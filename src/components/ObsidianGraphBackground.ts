import ForceGraph from "force-graph";

type ForceNode = { id: string; name?: string; val?: number };
type ForceLink = { source: string; target: string };
type GraphPayload = { nodes: ForceNode[]; links: ForceLink[] };

type ForceGraphInstance = InstanceType<typeof ForceGraph>;

const BG = "rgb(27, 27, 30)";
const NODE = "rgba(130, 145, 170, 0.42)";
const LINK = "rgba(85, 95, 115, 0.22)";

/** Mount force-graph into `container`. Returns teardown for tests or view transitions. */
export function mountObsidianGraphBackground(
	container: HTMLElement,
): () => void {
	let fg: ForceGraphInstance | null = null;
	let cancelled = false;

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

			fg = new ForceGraph(container)
				.graphData(json)
				.width(w)
				.height(h)
				.backgroundColor(BG)
				.nodeLabel(() => "")
				.nodeColor(() => NODE)
				.nodeVal("val")
				.nodeRelSize(3)
				.linkColor(() => LINK)
				.linkWidth(0.6)
				.enablePointerInteraction(false)
				.enableZoomInteraction(false)
				.enablePanInteraction(false)
				.warmupTicks(40)
				.cooldownTicks(160)
				.d3VelocityDecay(0.45);

			window.addEventListener("resize", onResize);
		})
		.catch(() => { });

	return () => {
		cancelled = true;
		window.removeEventListener("resize", onResize);
		if (fg) {
			fg._destructor();
			fg = null;
		}
	};
}
