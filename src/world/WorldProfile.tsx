import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/** Local opt-in diagnostics. Only mounted in development with ?perf=1. */
export default function WorldProfile({ mode }: { mode: string }) {
  const gl = useThree(s => s.gl);
  const samples = useRef<number[]>([]);
  useEffect(() => () => { delete gl.domElement.dataset.worldProfile; delete gl.domElement.dataset.worldProfileStart; }, [gl]);
  useFrame((_, delta) => {
    if (document.hidden) return;
    samples.current.push(delta * 1000);
    if (samples.current.length < 180) return;
    const times = samples.current;
    const duration = times.reduce((sum, time) => sum + time, 0);
    times.sort((a, b) => a - b);
    gl.domElement.dataset.worldProfile = JSON.stringify({
      mode, frames: times.length, seconds: +(duration / 1000).toFixed(2),
      fps: +(times.length * 1000 / duration).toFixed(1),
      p95ms: +times[Math.floor(times.length * .95)].toFixed(1),
      calls: gl.info.render.calls, triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries, dpr: gl.getPixelRatio(),
      width: gl.domElement.width, height: gl.domElement.height,
    });
    gl.domElement.dataset.worldProfileStart ??= gl.domElement.dataset.worldProfile;
    samples.current = [];
  });
  return null;
}
