import { useState } from "react";
import ObsidianGraphBackground from "./ObsidianGraphBackground.tsx";
import GraphParamsPanel from "./GraphParamsPanel";
import { DEFAULT_GRAPH_PARAMS, type GraphSimParams } from "./ObsidianGraphBackground.ts";

interface Props {
  baseUrl: string;
}

export default function SecondBrainApp({ baseUrl }: Props) {
  const [params, setParams] = useState<GraphSimParams>(DEFAULT_GRAPH_PARAMS);
  const [mountKey, setMountKey] = useState(0);
  const homeUrl = baseUrl.replace(/\/?$/, "/");

  return (
    <>
      <ObsidianGraphBackground
        key={mountKey}
        baseUrl={baseUrl}
        params={params}
        className="second-brain-graph"
      />
      <GraphParamsPanel
        params={params}
        onChange={setParams}
        onRemount={() => setMountKey(k => k + 1)}
        homeUrl={homeUrl}
      />
    </>
  );
}
