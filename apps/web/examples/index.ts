import { ConwayExample } from "./conway";
import { DepthExample } from "./depth";
import { InstancesExample } from "./indexedInstances";
import { MultisamplingExample } from "./multisampling";
import { TexturesExample } from "./textures";
import { VertexDisplacementExample } from "./vertexDisplacement";

export type Code = {
  text: string;
  filename: string;
  language: string;
};

export type Example = {
  title: string;
  url: string;
  code: Code[];
  description: string;
  run: (canvas: HTMLCanvasElement) => Promise<void>;
};

export const Examples: Example[] = [
  ConwayExample,
  VertexDisplacementExample,
  InstancesExample,
  MultisamplingExample,
  TexturesExample,
  DepthExample,
];
