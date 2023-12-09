import { Attribute } from "@wgpu-kit/core/src/Attribute";
import { Executor } from "@wgpu-kit/core/src/Executor";
import { Pipeline } from "@wgpu-kit/core/src/Pipeline";
import { PipelineGroup } from "@wgpu-kit/core/src/PipelineGroup";
import { Uniform } from "@wgpu-kit/core/src/Uniform";
import { VertexAttributeObject } from "@wgpu-kit/core/src/VertexAttributeObject";
import { Texture } from "@wgpu-kit/core/src/Texture";
import { Sampler } from "@wgpu-kit/core/src/Sampler";
import { BindGroup } from "@wgpu-kit/core/src/BindGroup";
import texture from "./logo.png";

export async function runExample(canvas: HTMLCanvasElement): Promise<void> {
  const vertices = new Float32Array([
    -1.0, -1.0, 1.0, -1.0, 1.0, 1.0,

    -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
  ]);

  const posAttribute = new Attribute({
    label: "Position attribute",
    format: "float32x2",
    arrayBuffer: vertices,
    itemCount: vertices.length / 2,
    itemSize: 2,
    shaderLocation: 0,
  });

  const vao = new VertexAttributeObject({
    itemCount: vertices.length / 2,
  });

  await vao.addAttributes(posAttribute);

  const pipeline = new Pipeline({
    label: "Render pipeline",
    canvas,
    shader: /* wgsl */ `
      struct VertexInput {
        @location(0) pos: vec2<f32>,
      }

      struct VertexOutput {
        @builtin(position) pos: vec4<f32>,
        @location(0) uv: vec2<f32>,
      }

      @group(0) @binding(2) var<uniform> scale: f32;

      @vertex
      fn vertexMain(input: VertexInput) -> VertexOutput {
        var output = VertexOutput();

        output.pos = vec4<f32>(input.pos * scale, 0.0, 1.0);
        output.uv = (input.pos + 1.0) / 2.0;
        output.uv = vec2<f32>(output.uv.x, 1.0 - output.uv.y);

        return output;
      }

      @group(0) @binding(0) var tex: texture_2d<f32>;
      @group(0) @binding(1) var texSampler: sampler;

      @fragment
      fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
        let tex = textureSample(tex, texSampler, input.uv);

        if (tex.a < 0.5) {
          discard;
        }

        return tex;
      }
    `,
    onAfterPass: async () => {
      if (scale.cpuBuffer !== undefined && scale.cpuBuffer.length > 0) {
        scale.cpuBuffer[0] = Math.sin(performance.now() / 1000);
        await scale.updateGpuBuffer();
      }
    },
  });

  pipeline.setClearColor([0.9, 0.9, 1.0, 1.0]);

  const pipelineGroup = new PipelineGroup({
    label: "Render pipeline group",
    pipelines: [pipeline],
    vertexCount: vertices.length / 2,
  });

  pipelineGroup.addVertexAttributeObjects(vao);

  const logoTex = new Texture({
    label: "Logo texture",
    binding: 0,
    visibility: GPUShaderStage.FRAGMENT,
  });

  await logoTex.setFromImage(texture.src);
  await logoTex.generateMipMaps();

  const sampler = new Sampler({
    label: "Logo sampler",
    binding: 1,
    visibility: GPUShaderStage.FRAGMENT,
  });

  await sampler.updateSampler({
    magFilter: "linear",
    minFilter: "linear",
  });

  const scale = new Uniform({
    label: "Scale",
    binding: 2,
    visibility: GPUShaderStage.VERTEX,
    arrayBuffer: new Float32Array([1]),
  });

  const bindGroup = new BindGroup();

  await bindGroup.addTextures(logoTex);
  await bindGroup.addSamplers(sampler);
  await bindGroup.addUniforms(scale);

  await pipelineGroup.setBindGroups(bindGroup);

  const executor = new Executor({
    label: "Render executor",
  });

  await executor.addPipelineGroups(pipelineGroup);

  async function tick(): Promise<void> {
    await executor.run();
    await new Promise(requestAnimationFrame);
    await tick();
  }

  await tick();
}
