import * as code from "./main?raw";
import { runExample } from "./main";

export const MultisamplingExample = {
  title: "Multisampling",
  url: "multisampling",
  code: [{ text: code.default, language: "typescript", filename: "main.ts" }],
  description: "A simple example of multisampling.",
  run: runExample,
};
