import {
	forceCollide,
	forceLink,
	forceManyBody,
	forceSimulation,
	forceX,
	forceY,
	type SimulationLinkDatum,
	type SimulationNodeDatum,
} from "d3-force";

type GraphNode = { id: string; name?: string; val?: number; type?: string };
type GraphLink = { source: string; target: string };
type GraphPayload = { nodes: GraphNode[]; links: GraphLink[] };

export interface GraphSimParams {
	parallaxScrollK: number;
	driftAmplitude: number;
	driftSpeed: number;
	breatheAmount: number;
	breatheSpeed: number;
	cursorRadius: number;
	cursorPush: number;
	cursorSwirl: number;
	cursorEase: number;
	glowBoost: number;
	pulseRate: number;
	cursorPulseRate: number;
	pulseSpeed: number;
	nodeAlpha: number;
	linkAlpha: number;
	linkWidth: number;
	nodeFadeMs: number;
}

export const DEFAULT_GRAPH_PARAMS: GraphSimParams = {
	parallaxScrollK: -0.18,
	driftAmplitude: 7,
	driftSpeed: 0.35,
	breatheAmount: 0.22,
	breatheSpeed: 0.6,
	cursorRadius: 200,
	cursorPush: 30,
	cursorSwirl: 0.5,
	cursorEase: 5,
	glowBoost: 3,
	pulseRate: 2,
	cursorPulseRate: 6,
	pulseSpeed: 110,
	nodeAlpha: 0.14,
	linkAlpha: 0.2,
	linkWidth: 0.6,
	nodeFadeMs: 1100,
};

const BG = "rgb(27, 27, 30)";
const NODE_RGB = "130, 145, 170";
/** Muted RGB triples for `type` from Obsidian frontmatter (export.py). */
const NODE_RGB_BY_TYPE: Record<string, string> = {
	paper: "118, 158, 214",
	library: "128, 188, 152",
	definition: "206, 168, 118",
};
const LINK_RGB = "85, 95, 115";
const PULSE_RGB = "185, 205, 245";

const LAYOUT_MAX_TICKS = 300;
const LAYOUT_TICK_BUDGET_MS = 8;
const MAX_PULSES = 48;
const MAX_DPR = 2;

/** Animated node: home position from the d3 layout plus per-node motion state. */
type AnimNode = {
	hx: number;
	hy: number;
	/** Raw layout coords, kept so homes can be re-fit on resize. */
	lx: number;
	ly: number;
	r: number;
	rgb: string;
	// Randomized phases/frequencies for organic drift & breathing
	p1: number;
	p2: number;
	p3: number;
	p4: number;
	f1: number;
	f2: number;
	bp: number;
	// Eased cursor displacement and glow
	ox: number;
	oy: number;
	glow: number;
	// Current rendered position (after drift + displacement)
	x: number;
	y: number;
	linkIdxs: number[];
};

type AnimLink = { a: number; b: number };

type Pulse = { link: number; t: number; dir: 1 | -1; speed: number };

function smoothstep01(x: number) {
	x = Math.max(0, Math.min(1, x));
	return x * x * (3 - 2 * x);
}

function nodeRgb(node: GraphNode): string {
	const t = node.type?.trim().toLowerCase();
	if (t && NODE_RGB_BY_TYPE[t]) return NODE_RGB_BY_TYPE[t];
	return NODE_RGB;
}

/** Mount the graph background into `container`. Returns teardown for tests or view transitions. */
export function mountObsidianGraphBackground(
	container: HTMLElement,
	baseUrl: string = "/",
	initialParams: GraphSimParams = DEFAULT_GRAPH_PARAMS,
): { destroy: () => void; setParams: (next: GraphSimParams) => void } {
	let p = { ...initialParams };

	let cancelled = false;
	let raf = 0;
	let canvas: HTMLCanvasElement | null = null;
	let ctx: CanvasRenderingContext2D | null = null;

	let nodes: AnimNode[] = [];
	let links: AnimLink[] = [];
	const pulses: Pulse[] = [];

	let fadeStart = 0;
	let lastFrame = 0;
	let pulseDebt = 0;
	let cursorPulseDebt = 0;

	let cursorX = -1e9;
	let cursorY = -1e9;
	let cursorActive = false;
	let lastClientX = 0;
	let lastClientY = 0;

	let lastResizeWidth = window.innerWidth;
	let lastResizeHeight = window.innerHeight;

	const reducedMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	).matches;

	const scrollOpts: AddEventListenerOptions = { passive: true };

	/** Canvas height needed so parallax never reveals empty space below. */
	function canvasHeight(): number {
		const maxScroll = Math.max(
			0,
			document.documentElement.scrollHeight - window.innerHeight,
		);
		return Math.ceil(
			window.innerHeight + maxScroll * Math.abs(p.parallaxScrollK),
		);
	}

	function applyParallax() {
		const y = window.scrollY * p.parallaxScrollK;
		container.style.transform = `translate3d(0, ${y}px, 0)`;
	}

	function onScroll() {
		applyParallax();
		// Parallax moves the canvas under a stationary pointer
		if (cursorActive) updateCursor();
	}

	function updateCursor() {
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		cursorX = lastClientX - rect.left;
		cursorY = lastClientY - rect.top;
	}

	/** Map raw layout coords onto the canvas with a small overscan margin. */
	function fitHomes() {
		if (nodes.length === 0 || !canvas) return;
		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		// Percentile bounds so a few far-flung outliers don't squash the
		// main cluster into the middle; outliers just land off-canvas.
		const xs = nodes.map((n) => n.lx).sort((a, b) => a - b);
		const ys = nodes.map((n) => n.ly).sort((a, b) => a - b);
		const q = (arr: number[], f: number) =>
			arr[Math.min(arr.length - 1, Math.max(0, Math.round(f * (arr.length - 1))))];
		const minX = q(xs, 0.02);
		const maxX = q(xs, 0.98);
		const minY = q(ys, 0.02);
		const maxY = q(ys, 0.98);
		const spanX = Math.max(1, maxX - minX);
		const spanY = Math.max(1, maxY - minY);
		// Overscan slightly past the edges so the graph bleeds off-screen
		const pad = 0.04;
		for (const n of nodes) {
			n.hx = ((n.lx - minX) / spanX) * w * (1 + 2 * pad) - w * pad;
			n.hy = ((n.ly - minY) / spanY) * h * (1 + 2 * pad) - h * pad;
			n.x = n.hx;
			n.y = n.hy;
		}
	}

	function sizeCanvas() {
		if (!canvas || !ctx) return;
		const w = window.innerWidth;
		const h = canvasHeight();
		const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
		canvas.style.width = `${w}px`;
		canvas.style.height = `${h}px`;
		canvas.width = Math.round(w * dpr);
		canvas.height = Math.round(h * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	function onResize() {
		const w = window.innerWidth;
		const h = window.innerHeight;
		const widthChanged = w !== lastResizeWidth;
		// Ignore small height-only changes — mobile browser address bar
		// showing/hiding causes ~50-60px changes that shouldn't resize the canvas.
		const heightChangedSignificantly = Math.abs(h - lastResizeHeight) >= 100;
		if (!widthChanged && !heightChangedSignificantly) return;
		lastResizeWidth = w;
		lastResizeHeight = h;
		sizeCanvas();
		fitHomes();
		applyParallax();
		if (reducedMotion) drawFrame(performance.now(), 0);
	}

	function onPointerMove(e: PointerEvent) {
		lastClientX = e.clientX;
		lastClientY = e.clientY;
		cursorActive = true;
		updateCursor();
	}

	function onPointerLeave() {
		cursorActive = false;
	}

	function spawnPulse(linkIdx: number) {
		if (pulses.length >= MAX_PULSES) return;
		pulses.push({
			link: linkIdx,
			t: 0,
			dir: Math.random() < 0.5 ? 1 : -1,
			speed: p.pulseSpeed * (0.7 + Math.random() * 0.6),
		});
	}

	function spawnAmbientPulses(dt: number) {
		if (links.length === 0) return;
		pulseDebt += p.pulseRate * dt;
		while (pulseDebt >= 1) {
			pulseDebt -= 1;
			spawnPulse((Math.random() * links.length) | 0);
		}
		// Extra pulses radiating from nodes the cursor is lighting up
		if (cursorActive) {
			cursorPulseDebt += p.cursorPulseRate * dt;
			while (cursorPulseDebt >= 1) {
				cursorPulseDebt -= 1;
				let best = -1;
				let bestGlow = 0.25;
				// Pick a random glowing node (sampling keeps it cheap and varied)
				for (let k = 0; k < 12; k++) {
					const i = (Math.random() * nodes.length) | 0;
					if (nodes[i].glow > bestGlow && nodes[i].linkIdxs.length > 0) {
						best = i;
						bestGlow = nodes[i].glow;
					}
				}
				if (best >= 0) {
					const idxs = nodes[best].linkIdxs;
					spawnPulse(idxs[(Math.random() * idxs.length) | 0]);
				}
			}
		} else {
			cursorPulseDebt = 0;
		}
	}

	function drawFrame(now: number, dt: number) {
		if (!ctx || !canvas) return;
		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		const t = now / 1000;
		const fade = smoothstep01((now - fadeStart) / p.nodeFadeMs);

		const ease = 1 - Math.exp(-p.cursorEase * dt);
		const R = p.cursorRadius;
		const R2 = R * R;

		// --- update nodes ---
		const driftT = t * p.driftSpeed * Math.PI * 2;
		for (let i = 0, n = nodes.length; i < n; i++) {
			const nd = nodes[i];
			const A = p.driftAmplitude;
			const dx =
				A *
				(Math.sin(driftT * nd.f1 + nd.p1) * 0.7 +
					Math.sin(driftT * nd.f2 + nd.p2) * 0.3);
			const dy =
				A *
				(Math.sin(driftT * nd.f1 + nd.p3) * 0.7 +
					Math.sin(driftT * nd.f2 + nd.p4) * 0.3);

			let tx = 0;
			let ty = 0;
			let glowTarget = 0;
			if (cursorActive && !reducedMotion) {
				const cx = nd.hx + dx - cursorX;
				const cy = nd.hy + dy - cursorY;
				const d2 = cx * cx + cy * cy;
				if (d2 < R2 && d2 > 1e-6) {
					const d = Math.sqrt(d2);
					const wgt = smoothstep01(1 - d / R);
					const ux = cx / d;
					const uy = cy / d;
					// Radial push away plus a tangential swirl for fluidity
					tx = (ux + -uy * p.cursorSwirl) * p.cursorPush * wgt;
					ty = (uy + ux * p.cursorSwirl) * p.cursorPush * wgt;
					glowTarget = wgt;
				}
			}
			nd.ox += (tx - nd.ox) * ease;
			nd.oy += (ty - nd.oy) * ease;
			nd.glow += (glowTarget - nd.glow) * ease;
			nd.x = nd.hx + dx + nd.ox;
			nd.y = nd.hy + dy + nd.oy;
		}

		// --- render ---
		ctx.fillStyle = BG;
		ctx.fillRect(0, 0, w, h);

		// Links, bucketed into a few alpha levels so we can batch strokes
		const glowK = p.glowBoost;
		const BUCKETS = 6;
		for (let bkt = 0; bkt < BUCKETS; bkt++) {
			const boost = bkt / (BUCKETS - 1);
			const alpha = p.linkAlpha * fade * (1 + glowK * boost);
			if (alpha <= 0.003) continue;
			ctx.strokeStyle = `rgba(${LINK_RGB}, ${Math.min(alpha, 1)})`;
			ctx.lineWidth = p.linkWidth * (1 + 0.6 * boost);
			ctx.beginPath();
			let any = false;
			for (let i = 0, n = links.length; i < n; i++) {
				const a = nodes[links[i].a];
				const b = nodes[links[i].b];
				const g = Math.max(a.glow, b.glow);
				if (Math.round(g * (BUCKETS - 1)) !== bkt) continue;
				ctx.moveTo(a.x, a.y);
				ctx.lineTo(b.x, b.y);
				any = true;
			}
			if (any) ctx.stroke();
		}

		// Pulses travelling along links
		for (let i = pulses.length - 1; i >= 0; i--) {
			const pu = pulses[i];
			const ln = links[pu.link];
			const a = nodes[ln.a];
			const b = nodes[ln.b];
			const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
			pu.t += (pu.speed * dt) / len;
			if (pu.t >= 1) {
				pulses.splice(i, 1);
				continue;
			}
			const tt = pu.dir === 1 ? pu.t : 1 - pu.t;
			const px = a.x + (b.x - a.x) * tt;
			const py = a.y + (b.y - a.y) * tt;
			const pa = Math.sin(Math.PI * pu.t) * 0.7 * fade;
			ctx.fillStyle = `rgba(${PULSE_RGB}, ${pa})`;
			ctx.beginPath();
			ctx.arc(px, py, 1.4, 0, Math.PI * 2);
			ctx.fill();
		}

		// Nodes with breathing and cursor glow
		for (let i = 0, n = nodes.length; i < n; i++) {
			const nd = nodes[i];
			const breathe =
				1 +
				p.breatheAmount *
					Math.sin(t * p.breatheSpeed * Math.PI * 2 * nd.f1 + nd.bp);
			const alpha = Math.min(
				p.nodeAlpha * fade * breathe * (1 + glowK * nd.glow),
				1,
			);
			const r = nd.r * (1 + 0.25 * nd.glow);
			if (nd.glow > 0.04) {
				// Soft halo only for lit nodes — gradients are too costly for all
				const halo = ctx.createRadialGradient(
					nd.x,
					nd.y,
					0,
					nd.x,
					nd.y,
					r * 4,
				);
				halo.addColorStop(0, `rgba(${nd.rgb}, ${0.25 * nd.glow * fade})`);
				halo.addColorStop(1, `rgba(${nd.rgb}, 0)`);
				ctx.fillStyle = halo;
				ctx.beginPath();
				ctx.arc(nd.x, nd.y, r * 4, 0, Math.PI * 2);
				ctx.fill();
			}
			ctx.fillStyle = `rgba(${nd.rgb}, ${alpha})`;
			ctx.beginPath();
			ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	function tick(now: number) {
		if (cancelled) return;
		const dt = Math.min((now - lastFrame) / 1000, 0.05);
		lastFrame = now;
		if (!document.hidden) {
			spawnAmbientPulses(dt);
			drawFrame(now, dt);
		}
		raf = requestAnimationFrame(tick);
	}

	/** Run the d3 layout in rAF chunks so it never blocks a frame for long. */
	function runLayout(json: GraphPayload, onDone: () => void) {
		type SimNode = SimulationNodeDatum & GraphNode;
		const simNodes: SimNode[] = json.nodes.map((n) => ({ ...n }));
		const simLinks: SimulationLinkDatum<SimNode>[] = json.links.map((l) => ({
			...l,
		}));
		const sim = forceSimulation(simNodes)
			.force(
				"link",
				forceLink<SimNode, SimulationLinkDatum<SimNode>>(simLinks)
					.id((d) => d.id)
					.distance(30),
			)
			.force("charge", forceManyBody().strength(-40))
			// Weak pull toward center keeps disconnected components from flying off
			.force("x", forceX(0).strength(0.06))
			.force("y", forceY(0).strength(0.06))
			.force(
				"collide",
				forceCollide<SimNode>((d) => Math.sqrt(d.val || 1) * 2 + 3),
			)
			.stop();

		let ticks = 0;
		function chunk() {
			if (cancelled) return;
			const start = performance.now();
			while (
				ticks < LAYOUT_MAX_TICKS &&
				sim.alpha() > sim.alphaMin() &&
				performance.now() - start < LAYOUT_TICK_BUDGET_MS
			) {
				sim.tick();
				ticks++;
			}
			if (ticks < LAYOUT_MAX_TICKS && sim.alpha() > sim.alphaMin()) {
				raf = requestAnimationFrame(chunk);
				return;
			}

			const idToIdx = new Map<string, number>();
			nodes = simNodes.map((sn, i) => {
				idToIdx.set(sn.id, i);
				return {
					hx: 0,
					hy: 0,
					lx: sn.x ?? 0,
					ly: sn.y ?? 0,
					r: Math.sqrt(sn.val || 1) * 2 + 0.5,
					rgb: nodeRgb(sn),
					p1: Math.random() * Math.PI * 2,
					p2: Math.random() * Math.PI * 2,
					p3: Math.random() * Math.PI * 2,
					p4: Math.random() * Math.PI * 2,
					f1: 0.7 + Math.random() * 0.6,
					f2: 1.3 + Math.random() * 0.9,
					bp: Math.random() * Math.PI * 2,
					ox: 0,
					oy: 0,
					glow: 0,
					x: 0,
					y: 0,
					linkIdxs: [],
				};
			});
			links = [];
			for (const sl of simLinks) {
				const a = idToIdx.get((sl.source as SimNode).id);
				const b = idToIdx.get((sl.target as SimNode).id);
				if (a == null || b == null) continue;
				const idx = links.length;
				links.push({ a, b });
				nodes[a].linkIdxs.push(idx);
				nodes[b].linkIdxs.push(idx);
			}
			onDone();
		}
		raf = requestAnimationFrame(chunk);
	}

	fetch(`${baseUrl.replace(/\/?$/, "/")}obsidian-graph.json`)
		.then((r) => (r.ok ? r.json() : null))
		.then((json: GraphPayload | null) => {
			if (
				cancelled ||
				!json ||
				!Array.isArray(json.nodes) ||
				json.nodes.length === 0
			) {
				return;
			}
			if (window.innerWidth < 2 || window.innerHeight < 2) return;

			canvas = document.createElement("canvas");
			canvas.style.display = "block";
			container.appendChild(canvas);
			ctx = canvas.getContext("2d");
			if (!ctx) return;
			sizeCanvas();
			applyParallax();

			window.addEventListener("resize", onResize);
			window.addEventListener("scroll", onScroll, scrollOpts);
			if (!reducedMotion) {
				window.addEventListener("pointermove", onPointerMove, {
					passive: true,
				});
				window.addEventListener("blur", onPointerLeave);
				document.addEventListener("pointerleave", onPointerLeave);
			}

			runLayout(json, () => {
				if (cancelled) return;
				fitHomes();
				fadeStart = performance.now();
				lastFrame = fadeStart;
				if (reducedMotion) {
					// Static render: no drift, no pulses, instant fade
					fadeStart = -1e9;
					drawFrame(performance.now(), 0);
				} else {
					raf = requestAnimationFrame(tick);
				}
			});
		})
		.catch(() => {});

	function setParams(next: GraphSimParams) {
		p = { ...next };
		applyParallax();
		if (reducedMotion) drawFrame(performance.now(), 0);
	}

	function destroy() {
		cancelled = true;
		cancelAnimationFrame(raf);
		window.removeEventListener("resize", onResize);
		window.removeEventListener("scroll", onScroll, scrollOpts);
		window.removeEventListener("pointermove", onPointerMove);
		window.removeEventListener("blur", onPointerLeave);
		document.removeEventListener("pointerleave", onPointerLeave);
		if (canvas) {
			canvas.remove();
			canvas = null;
			ctx = null;
		}
		container.style.transform = "";
	}

	return { destroy, setParams };
}
