import ForceGraph from "force-graph";

type ForceNode = { id: string; name?: string; val?: number };
type ForceLink = { source: string; target: string };
type GraphPayload = { nodes: ForceNode[]; links: ForceLink[] };

type ForceGraphInstance = InstanceType<typeof ForceGraph>;

const BG = "rgb(27, 27, 30)";
const NODE_RGB = "130, 145, 170";
const LINK_RGB = "85, 95, 115";
const NODE_ALPHA = 0.12;
const LINK_ALPHA = 0.22;

const NODE_FADE_MS = 1100;

/** Mount force-graph into `container`. Returns teardown for tests or view transitions. */
export function mountObsidianGraphBackground(
	container: HTMLElement,
): () => void {
	let fg: ForceGraphInstance | null = null;
	let cancelled = false;
	let fadeRaf = 0;
	let nodeFade = 0;

	function onResize() {
		if (fg) {
			fg.width(window.innerWidth).height(window.innerHeight);
		}
	}

	fetch("/obsidian-graph.json")
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
			const h = window.innerHeight;
			if (w < 2 || h < 2) return;

			function smoothstep(edge0: number, edge1: number, x: number) {
				x = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
				return x * x * (3 - 2 * x);
			}

			fg = new ForceGraph(container)
				.graphData(json)
				.width(w)
				.height(h)
				.backgroundColor(BG)
				.autoPauseRedraw(false)
				.nodeLabel(() => "")
				.nodeColor(
					() => `rgba(${NODE_RGB}, ${NODE_ALPHA * nodeFade})`,
				)
				.nodeVal("val")
				.nodeRelSize(3)
				.linkColor(() => `rgba(${LINK_RGB}, ${LINK_ALPHA * nodeFade})`)
				.linkWidth(0.6)
				.enablePointerInteraction(false)
				.enableZoomInteraction(false)
				.enablePanInteraction(false)
				.warmupTicks(40)
				.cooldownTicks(160)
				.d3VelocityDecay(0.45);

			window.addEventListener("resize", onResize);

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
		window.removeEventListener("resize", onResize);
		if (fg) {
			fg._destructor();
			fg = null;
		}
	};
}
