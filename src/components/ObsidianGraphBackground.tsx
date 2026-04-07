import { useCallback, useEffect, useRef, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";

type ForceNode = { id: string; name?: string; val?: number };
type ForceLink = { source: string; target: string };
type GraphPayload = { nodes: ForceNode[]; links: ForceLink[] };

const BG = "rgb(27, 27, 30)";
const NODE = "rgba(130, 145, 170, 0.42)";
const LINK = "rgba(85, 95, 115, 0.22)";

function useViewportSize(): { width: number; height: number } {
	const [dims, setDims] = useState(() => ({
		width: typeof window !== "undefined" ? window.innerWidth : 1,
		height: typeof window !== "undefined" ? window.innerHeight : 1,
	}));

	useEffect(() => {
		function onResize() {
			setDims({ width: window.innerWidth, height: window.innerHeight });
		}
		onResize();
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	return dims;
}

function fitGraphToViewport(
	fg: ForceGraphMethods | undefined,
	durationMs: number,
	paddingPx: number,
) {
	fg?.zoomToFit(durationMs, paddingPx);
}

export default function ObsidianGraphBackground() {
	const { width, height } = useViewportSize();
	const [data, setData] = useState<GraphPayload | null>(null);
	const fgRef = useRef<ForceGraphMethods | undefined>(undefined);

	useEffect(() => {
		let cancelled = false;
		fetch("/obsidian-graph.json")
			.then((r) => (r.ok ? r.json() : null))
			.then((json: GraphPayload | null) => {
				if (
					!cancelled &&
					json &&
					Array.isArray(json.nodes) &&
					json.nodes.length > 0
				) {
					setData(json);
				}
			})
			.catch(() => { });
		return () => {
			cancelled = true;
		};
	}, []);

	const nodeColor = useCallback(() => NODE, []);
	const linkColor = useCallback(() => LINK, []);

	const onEngineStop = useCallback(() => {
		fitGraphToViewport(fgRef.current, 600, 4);
	}, []);

	// Refit when the viewport changes (ref callback runs after canvas resizes).
	useEffect(() => {
		if (!data || width < 2 || height < 2) return;
		const id = requestAnimationFrame(() => {
			fitGraphToViewport(fgRef.current, 0, 4);
		});
		return () => cancelAnimationFrame(id);
	}, [data, width, height]);

	if (!data || width < 2 || height < 2) {
		return null;
	}

	return (
		<div className="obsidian-graph-bg" aria-hidden="true">
			<ForceGraph2D
				ref={fgRef}
				width={width}
				height={height}
				graphData={data}
				backgroundColor={BG}
				nodeLabel={() => ""}
				nodeColor={nodeColor}
				nodeVal="val"
				nodeRelSize={3}
				linkColor={linkColor}
				linkWidth={0.6}
				enablePointerInteraction={false}
				enableZoomInteraction={false}
				enablePanInteraction={false}
				warmupTicks={40}
				cooldownTicks={160}
				onEngineStop={onEngineStop}
				d3VelocityDecay={0.45}
			/>
		</div>
	);
}
