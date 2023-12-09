import * as code1 from "./main?raw";
import { runExample } from "./main";
import code2 from "./shaders?raw";

export const ConwayExample = {
  title: "Conway's Game of Life",
  url: "conway",
  code: [
    { text: code1.default, language: "typescript", filename: "main.ts" },
    { text: code2, language: "ts", filename: "shaders.ts" },
  ],
  description: "A GPU-accelerated implementation of Conway's Game of Life.",
  run: runExample,
};
