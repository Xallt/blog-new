import ForceGraph from "force-graph";

type ForceNode = { id: string; name?: string; val?: number; type?: string };
type ForceLink = { source: string; target: string };
type GraphPayload = { nodes: ForceNode[]; links: ForceLink[] };

type ForceGraphInstance = InstanceType<typeof ForceGraph>;

type SimNode = {
	x?: number;
	y?: number;
	vx?: number;
	vy?: number;
};

export interface GraphSimParams {
  parallaxScrollK: number;
  alphaDecay: number;
  velocityDecay: number;
  ambientJitter: number;
  ambientAlphaFloor: number;
  cursorRadius: number;
  cursorImpulseStrength: number;
  cursorImpulseAlphaFloor: number;
  cursorReheatAlphaThreshold: number;
  cursorReheatAlphaTarget: number;
  cursorRippleSettleMs: number;
  nodeAlpha: number;
  linkAlpha: number;
  linkWidth: number;
  nodeFadeMs: number;
  warmupTicks: number;
}

export const DEFAULT_GRAPH_PARAMS: GraphSimParams = {
  parallaxScrollK: -0.18,
  alphaDecay: 0.018,
  velocityDecay: 0.12,
  ambientJitter: 0.3,
  ambientAlphaFloor: 0.02,
  cursorRadius: 200,
  cursorImpulseStrength: 0.2,
  cursorImpulseAlphaFloor: 0.3,
  cursorReheatAlphaThreshold: 0.8,
  cursorReheatAlphaTarget: 1.0,
  cursorRippleSettleMs: 4000,
  nodeAlpha: 0.12,
  linkAlpha: 0.22,
  linkWidth: 0.6,
  nodeFadeMs: 1100,
  warmupTicks: 40,
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

/** Once per frame: nudge nearby nodes along the mouse's graph-space delta. */
function applyCursorImpulse(
	nodes: SimNode[],
	cx: number,
	cy: number,
	dgx: number,
	dgy: number,
	cursorRadius: number,
	cursorImpulseStrength: number,
	cursorImpulseAlphaFloor: number,
) {
	if (dgx === 0 && dgy === 0) return;
	const a = cursorImpulseAlphaFloor;
	const R = cursorRadius;
	const R2 = R * R;
	for (let i = 0, n = nodes.length; i < n; i++) {
		const node = nodes[i];
		const x = node.x;
		const y = node.y;
		if (x == null || y == null) continue;
		const dx = x - cx;
		const dy = y - cy;
		const d2 = dx * dx + dy * dy;
		if (d2 > R2) continue;
		const dist = Math.sqrt(d2);
		const t = 1 - dist / R;
		const w = t * t;
		const s = cursorImpulseStrength * w * a;
		node.vx = (node.vx ?? 0) + dgx * s;
		node.vy = (node.vy ?? 0) + dgy * s;
	}
}

/** Mount force-graph into `container`. Returns teardown for tests or view transitions. */
export function mountObsidianGraphBackground(
	container: HTMLElement,
	baseUrl: string = "/",
	initialParams: GraphSimParams = DEFAULT_GRAPH_PARAMS,
): { destroy: () => void; setParams: (next: GraphSimParams) => void } {
	let p = { ...initialParams };

	let fg: ForceGraphInstance | null = null;
	let cancelled = false;
	let fadeRaf = 0;
	let nodeFade = 0;

	let rippleRaf = 0;
	let pendingRippleCoords = false;
	let lastClientX = 0;
	let lastClientY = 0;
	let hasPrevGraphSample = false;
	let prevGraphX = 0;
	let prevGraphY = 0;
	let ambientForce: ReturnType<typeof createAmbientForce> | null = null;
	let reheatTimer: ReturnType<typeof setTimeout> | null = null;

	const scrollOpts: AddEventListenerOptions = { passive: true };

	let lastResizeWidth = window.innerWidth;
	let lastResizeHeight = window.innerHeight;

	function createAmbientForce() {
		let nodes: SimNode[] = [];
		let currentAlpha = 0;

		function force(alpha: number) {
			currentAlpha = alpha;
			const a = Math.max(alpha, p.ambientAlphaFloor);
			const j = p.ambientJitter * a;
			for (let i = 0, n = nodes.length; i < n; i++) {
				const node = nodes[i];
				if (node.x == null || node.y == null) continue;
				node.vx = (node.vx ?? 0) + (Math.random() - 0.5) * j;
				node.vy = (node.vy ?? 0) + (Math.random() - 0.5) * j;
			}
		}

		force.initialize = (init: SimNode[]) => {
			nodes = init;
		};

		return { force, getAlpha: () => currentAlpha };
	}

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
		if (fg) {
			fg.width(w).height(canvasHeight());
		}
		applyParallax();
	}

	function applyParallax() {
		const y = window.scrollY * p.parallaxScrollK;
		container.style.transform = `translate3d(0, ${y}px, 0)`;
	}

	function onScroll() {
		applyParallax();
	}

	function flushRippleCoords() {
		pendingRippleCoords = false;
		if (cancelled || !fg) return;
		const canvas = container.querySelector("canvas");
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		const lx = lastClientX - rect.left;
		const ly = lastClientY - rect.top;
		const coords = fg.screen2GraphCoords(lx, ly);
		let dgx = 0;
		let dgy = 0;
		if (hasPrevGraphSample) {
			dgx = coords.x - prevGraphX;
			dgy = coords.y - prevGraphY;
		}
		prevGraphX = coords.x;
		prevGraphY = coords.y;
		hasPrevGraphSample = true;
		const { nodes } = fg.graphData() as { nodes: SimNode[] };
		applyCursorImpulse(
			nodes,
			coords.x,
			coords.y,
			dgx,
			dgy,
			p.cursorRadius,
			p.cursorImpulseStrength,
			p.cursorImpulseAlphaFloor,
		);

		if (dgx !== 0 || dgy !== 0) {
			// Only activate D3 forces when alpha is cold; guard prevents redundant resets
			if (ambientForce && ambientForce.getAlpha() < p.cursorReheatAlphaThreshold) {
				// Hold alpha at a warm level so link springs / charge propagate the disturbance
				(fg as unknown as { d3AlphaTarget: (v: number) => void }).d3AlphaTarget(p.cursorReheatAlphaTarget);
				fg.d3ReheatSimulation();
			}
			// (Re-)arm the cooldown; every swipe frame extends the warm window
			if (reheatTimer !== null) clearTimeout(reheatTimer);
			reheatTimer = setTimeout(() => {
				if (fg) (fg as unknown as { d3AlphaTarget: (v: number) => void }).d3AlphaTarget(0);
				reheatTimer = null;
			}, p.cursorRippleSettleMs);
		}
	}

	function onMouseMove(e: MouseEvent) {
		lastClientX = e.clientX;
		lastClientY = e.clientY;
		if (!pendingRippleCoords) {
			pendingRippleCoords = true;
			rippleRaf = requestAnimationFrame(flushRippleCoords);
		}
	}

	function onMouseLeave() {
		hasPrevGraphSample = false;
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
			const w = window.innerWidth;
			const h = canvasHeight();
			if (w < 2 || window.innerHeight < 2) return;

			function smoothstep(edge0: number, edge1: number, x: number) {
				x = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
				return x * x * (3 - 2 * x);
			}

			ambientForce = createAmbientForce();

			function nodeRgb(node: ForceNode): string {
				const t = node.type?.trim().toLowerCase();
				if (t && NODE_RGB_BY_TYPE[t]) return NODE_RGB_BY_TYPE[t];
				return NODE_RGB;
			}

			fg = new ForceGraph(container)
				.graphData(json)
				.width(w)
				.height(h)
				.backgroundColor(BG)
				.autoPauseRedraw(false)
				.nodeLabel(() => "")
				.nodeColor((n) => {
					const node = n as ForceNode;
					return `rgba(${nodeRgb(node)}, ${p.nodeAlpha * nodeFade})`;
				})
				.nodeVal("val")
				.nodeRelSize(3)
				.linkColor(() => `rgba(${LINK_RGB}, ${p.linkAlpha * nodeFade})`)
				.linkWidth(p.linkWidth)
				.enablePointerInteraction(false)
				.enableZoomInteraction(false)
				.enablePanInteraction(false)
				.warmupTicks(p.warmupTicks)
				.cooldownTicks(Infinity)
				.cooldownTime(Infinity)
				.d3AlphaDecay(p.alphaDecay)
				.d3VelocityDecay(p.velocityDecay)
				.d3Force("ambient", ambientForce.force);

			fg.onEngineStop(() => {
				if (cancelled || !fg) return;
				fg.d3ReheatSimulation();
			});

			window.addEventListener("resize", onResize);
			window.addEventListener("scroll", onScroll, scrollOpts);
			window.addEventListener("mousemove", onMouseMove, { passive: true });
			window.addEventListener("blur", onMouseLeave);

			applyParallax();

			const fadeStart = performance.now();
			function tickNodeFade() {
				if (cancelled || !fg) return;
				const t = Math.min(
					(performance.now() - fadeStart) / p.nodeFadeMs,
					1,
				);
				nodeFade = smoothstep(0, 1, t);
				if (t < 1) {
					fadeRaf = requestAnimationFrame(tickNodeFade);
				} else {
					nodeFade = 1;
					fg.autoPauseRedraw(true);
				}
			}
			fadeRaf = requestAnimationFrame(tickNodeFade);

			const duration = 2000;
			const start = performance.now();
			const kStart = 1;
			const kEnd = 1.2;

			const intervalId = setInterval(() => {
				const now = performance.now();
				const elapsed = now - start;
				const t = Math.min(elapsed / duration, 1);
				const smoothT = smoothstep(0, 1, t);
				const k = kStart + (kEnd - kStart) * smoothT;
				fg?.zoom(k);

				if (t >= 1) {
					clearInterval(intervalId);
				}
			}, 10);
		})
		.catch(() => { });

	function setParams(next: GraphSimParams) {
		p = { ...next };
		if (fg) {
			fg.d3AlphaDecay(p.alphaDecay)
				.d3VelocityDecay(p.velocityDecay)
				.linkWidth(p.linkWidth);
		}
		applyParallax();
	}

	function destroy() {
		cancelled = true;
		cancelAnimationFrame(fadeRaf);
		cancelAnimationFrame(rippleRaf);
		if (reheatTimer !== null) {
			clearTimeout(reheatTimer);
			reheatTimer = null;
		}
		window.removeEventListener("resize", onResize);
		window.removeEventListener("scroll", onScroll, scrollOpts);
		window.removeEventListener("mousemove", onMouseMove);
		window.removeEventListener("blur", onMouseLeave);
		if (fg) {
			fg._destructor();
			fg = null;
		}
		container.style.transform = "";
	}

	return { destroy, setParams };
}
