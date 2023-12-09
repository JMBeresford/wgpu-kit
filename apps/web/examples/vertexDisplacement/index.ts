import * as code1 from "./main?raw";
import code2 from "./shaders?raw";
import code3 from "./sphere?raw";
import { runExample } from "./main";

export const VertexDisplacementExample = {
  title: "Vertex Displacement",
  url: "vertexDisplacement",
  code: [
    { text: code1.default, language: "typescript", filename: "main.ts" },
    { text: code2, language: "ts", filename: "shaders.ts" },
    { text: code3, language: "ts", filename: "sphere.ts" },
  ],
  description:
    "A simple example of vertex displacement via a compute pipeline.",
  run: runExample,
};
