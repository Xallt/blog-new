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

const BG = "rgb(27, 27, 30)";
const NODE_RGB = "130, 145, 170";
/** Muted RGB triples for `type` from Obsidian frontmatter (export.py). */
const NODE_RGB_BY_TYPE: Record<string, string> = {
	paper: "118, 158, 214",
	library: "128, 188, 152",
	definition: "206, 168, 118",
};
const LINK_RGB = "85, 95, 115";
const NODE_ALPHA = 0.12;
const LINK_ALPHA = 0.22;

const NODE_FADE_MS = 1100;

/** Scroll parallax: background translate as fraction of window.scrollY (negative = moves opposite to scroll) */
const PARALLAX_SCROLL_K = -0.18;

/** Simulation alpha decay (library default ~0.0228) */
const D3_ALPHA_DECAY = 0.018;
/** Lower = velocities decay slower (default in d3-force ~0.4) */
const D3_VELOCITY_DECAY = 0.12;
/** Base velocity noise per tick; multiplied by max(alpha, AMBIENT_ALPHA_FLOOR) */
const AMBIENT_JITTER = 0.3;
const AMBIENT_ALPHA_FLOOR = 0.02;

/** Cursor: graph-space influence radius (falloff from cursor position) */
const CURSOR_RADIUS = 200;
/** Scales graph-space mouse delta (not normalized — faster motion ⇒ larger kick) */
const CURSOR_IMPULSE_STRENGTH = 0.05;
const CURSOR_IMPULSE_ALPHA_FLOOR = 0.14;

/** Once per frame: nudge nearby nodes along the mouse’s graph-space delta. */
function applyCursorImpulse(
	nodes: SimNode[],
	cx: number,
	cy: number,
	dgx: number,
	dgy: number,
) {
	if (dgx === 0 && dgy === 0) return;
	const a = CURSOR_IMPULSE_ALPHA_FLOOR;
	const R = CURSOR_RADIUS;
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
		const s = CURSOR_IMPULSE_STRENGTH * w * a;
		node.vx = (node.vx ?? 0) + dgx * s;
		node.vy = (node.vy ?? 0) + dgy * s;
	}
}

function createAmbientForce() {
	let nodes: SimNode[] = [];

	function force(alpha: number) {
		const a = Math.max(alpha, AMBIENT_ALPHA_FLOOR);
		const j = AMBIENT_JITTER * a;
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

	return { force };
}

/** Mount force-graph into `container`. Returns teardown for tests or view transitions. */
export function mountObsidianGraphBackground(
	container: HTMLElement,
	baseUrl: string = "/",
): () => void {
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

	const scrollOpts: AddEventListenerOptions = { passive: true };

	/** Canvas height needed so parallax never reveals empty space below. */
	function canvasHeight(): number {
		const maxScroll = Math.max(
			0,
			document.documentElement.scrollHeight - window.innerHeight,
		);
		return Math.ceil(
			window.innerHeight + maxScroll * Math.abs(PARALLAX_SCROLL_K),
		);
	}

	function onResize() {
		if (fg) {
			fg.width(window.innerWidth).height(canvasHeight());
		}
		applyParallax();
	}

	function applyParallax() {
		const y = window.scrollY * PARALLAX_SCROLL_K;
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
		const p = fg.screen2GraphCoords(lx, ly);
		let dgx = 0;
		let dgy = 0;
		if (hasPrevGraphSample) {
			dgx = p.x - prevGraphX;
			dgy = p.y - prevGraphY;
		}
		prevGraphX = p.x;
		prevGraphY = p.y;
		hasPrevGraphSample = true;
		const { nodes } = fg.graphData() as { nodes: SimNode[] };
		applyCursorImpulse(nodes, p.x, p.y, dgx, dgy);
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

			const ambientForce = createAmbientForce();

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
					return `rgba(${nodeRgb(node)}, ${NODE_ALPHA * nodeFade})`;
				})
				.nodeVal("val")
				.nodeRelSize(3)
				.linkColor(() => `rgba(${LINK_RGB}, ${LINK_ALPHA * nodeFade})`)
				.linkWidth(0.6)
				.enablePointerInteraction(false)
				.enableZoomInteraction(false)
				.enablePanInteraction(false)
				.warmupTicks(40)
				.cooldownTicks(Infinity)
				.cooldownTime(Infinity)
				.d3AlphaDecay(D3_ALPHA_DECAY)
				.d3VelocityDecay(D3_VELOCITY_DECAY)
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
					(performance.now() - fadeStart) / NODE_FADE_MS,
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

	return () => {
		cancelled = true;
		cancelAnimationFrame(fadeRaf);
		cancelAnimationFrame(rippleRaf);
		window.removeEventListener("resize", onResize);
		window.removeEventListener("scroll", onScroll, scrollOpts);
		window.removeEventListener("mousemove", onMouseMove);
		window.removeEventListener("blur", onMouseLeave);
		if (fg) {
			fg._destructor();
			fg = null;
		}
		container.style.transform = "";
	};
}
