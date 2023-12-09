import { mat4 } from "gl-matrix";
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
    enableMultiSampling: true,
    enableDepthStencil: true,
    shader: /* wgsl */ `
      struct VertexInput {
        @builtin(instance_index) instanceIndex: u32,
        @location(0) pos: vec2<f32>,
      }

      struct VertexOutput {
        @builtin(position) pos: vec4<f32>,
        @location(0) uv: vec2<f32>,
      }

      @group(0) @binding(2) var<uniform> matrix: mat4x4<f32>;

      @vertex
      fn vertexMain(input: VertexInput) -> VertexOutput {
        var output = VertexOutput();

        var position = vec4<f32>(input.pos * 0.5, f32(input.instanceIndex) * -3.0, 1.0);
        position = matrix * position;

        output.pos = position;
        output.uv = (input.pos + 1.0) / 2.0;
        output.uv = vec2<f32>(output.uv.x, 1.0 - output.uv.y);

        return output;
      }

      @group(0) @binding(0) var tex: texture_2d<f32>;
      @group(0) @binding(1) var texSampler: sampler;

      @fragment
      fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
        var color = textureSample(tex, texSampler, input.uv);

        if (color.a < 0.5) {
          return vec4<f32>(1.0, 0.8, 0.8, 1.0);
        }

        return color;
      }
    `,
  });

  pipeline.setClearColor([0.9, 0.9, 1.0, 1.0]);

  const pipelineGroup = new PipelineGroup({
    label: "Render pipeline group",
    instanceCount: 5,
    vertexCount: vertices.length / 2,
    pipelines: [pipeline],
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
    mipmapFilter: "linear",
  });

  const viewMatrix = mat4.create();
  const projMatrix = mat4.create();
  mat4.lookAt(viewMatrix, [1, 0, 2], [0, 0, 0], [0, 1, 0]);
  mat4.perspective(projMatrix, 45, 1, 0.1, 100);

  mat4.multiply(viewMatrix, projMatrix, viewMatrix);

  const matrixUniform = new Uniform({
    label: "Matrix uniform",
    binding: 2,
    visibility: GPUShaderStage.VERTEX,
    arrayBuffer: new Float32Array(viewMatrix.values()),
  });

  const bindGroup = new BindGroup();

  await bindGroup.addTextures(logoTex);
  await bindGroup.addSamplers(sampler);
  await bindGroup.addUniforms(matrixUniform);

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
