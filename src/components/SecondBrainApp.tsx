import { useState } from "react";
import ObsidianGraphBackground from "./ObsidianGraphBackground";
import GraphParamsPanel from "./GraphParamsPanel";
import { DEFAULT_GRAPH_PARAMS, type GraphSimParams } from "./ObsidianGraphBackground";

interface Props {
  baseUrl: string;
}

export default function SecondBrainApp({ baseUrl }: Props) {
  const [params, setParams] = useState<GraphSimParams>(DEFAULT_GRAPH_PARAMS);

  return (
    <>
      <ObsidianGraphBackground
        baseUrl={baseUrl}
        params={params}
        className="second-brain-graph"
      />
      <GraphParamsPanel params={params} onChange={setParams} />
    </>
  );
}
