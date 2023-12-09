import { useRef } from "react";
import type { BufferGeometry, Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import type { GridMaterialProps } from "./shader";
import { GridMaterial, GridMaterialKey } from "./shader";

export function Grid(): JSX.Element {
  const ref = useRef<Mesh<BufferGeometry, GridMaterialProps>>(null);

  useFrame(({ clock }, dt) => {
    if (!ref.current) return;
    ref.current.material.uTime = clock.elapsedTime;

    if (ref.current.material.uFade === undefined) {
      ref.current.material.uFade = 0;
    } else {
      const fade = ref.current.material.uFade + dt * 0.5;
      if (ref.current.material.uFade < 1) ref.current.material.uFade = fade;
    }
  });

  return (
    <mesh ref={ref}>
      <planeGeometry args={[1, 1]} />
      <GridMaterial key={GridMaterialKey} />
    </mesh>
  );
}
