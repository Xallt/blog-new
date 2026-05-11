import { useEffect, useRef } from "react";
import {
  mountObsidianGraphBackground,
  DEFAULT_GRAPH_PARAMS,
  type GraphSimParams,
} from "./ObsidianGraphBackground";

interface Props {
  baseUrl?: string;
  params?: GraphSimParams;
  className?: string;
}

export default function ObsidianGraphBackground({
  baseUrl = "/",
  params = DEFAULT_GRAPH_PARAMS,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<{ destroy: () => void; setParams: (p: GraphSimParams) => void } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const instance = mountObsidianGraphBackground(containerRef.current, baseUrl, params);
    instanceRef.current = instance;
    return () => {
      instance.destroy();
      instanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    instanceRef.current?.setParams(params);
  }, [params]);

  return <div ref={containerRef} className={className} />;
}
