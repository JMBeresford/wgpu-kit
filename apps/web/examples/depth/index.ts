import * as code from "./main?raw";
import { runExample } from "./main";

export const DepthExample = {
  title: "Depth",
  url: "depth",
  code: [{ text: code.default, language: "typescript", filename: "main.ts" }],
  description: "A simple example of depth testing.",
  run: runExample,
};
