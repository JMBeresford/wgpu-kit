import { shaderMaterial } from "@react-three/drei";
import type { MaterialNode } from "@react-three/fiber";
import { extend } from "@react-three/fiber";
import type { ShaderMaterial } from "three";
import { AdditiveBlending, Color } from "three";
import { generateUUID } from "three/src/math/MathUtils";
import fragmentShader from "./frag.glsl";
import vertexShader from "./vert.glsl";

type Uniforms = {
  uTime?: number;
  uFade?: number;
  uColor?: Color | number;
};

const uniforms: Uniforms = {
  uTime: 0,
  uFade: 0,
  uColor: new Color(1, 1, 1),
};

const BaseGridMaterial = shaderMaterial(
  uniforms,
  vertexShader,
  fragmentShader,
  (m) => {
    if (!m) return;
    m.transparent = true;
    m.premultipliedAlpha = true;
    m.blending = AdditiveBlending;
    m.toneMapped = true;
    m.extensions = {
      ...m.extensions,
      derivatives: true,
    };
  },
);

export const GridMaterialKey = generateUUID();
BaseGridMaterial.key = GridMaterialKey;

extend({ BaseGridMaterial });

export type GridMaterialProps = Uniforms & ShaderMaterial;

declare module "@react-three/fiber" {
  interface ThreeElements {
    baseGridMaterial: MaterialNode<GridMaterialProps, typeof BaseGridMaterial>;
  }
}

export function GridMaterial(props: Uniforms): JSX.Element {
  return <baseGridMaterial {...props} />;
}
