import { mat4 } from "gl-matrix";
import { Attribute } from "@wgpu-kit/core/src/Attribute";
import { Executor } from "@wgpu-kit/core/src/Executor";
import { Pipeline } from "@wgpu-kit/core/src/Pipeline";
import { PipelineGroup } from "@wgpu-kit/core/src/PipelineGroup";
import { Uniform } from "@wgpu-kit/core/src/Uniform";
import { VertexAttributeObject } from "@wgpu-kit/core/src/VertexAttributeObject";
import { IndexBuffer } from "@wgpu-kit/core/src/IndexBuffer";
import { BindGroup } from "@wgpu-kit/core/src/BindGroup";

export async function runExample(canvas: HTMLCanvasElement): Promise<void> {
  const vertices = [
    -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1, 1,
    -1, 1, 1, -1, -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, 1, -1, -1, 1, 1, -1,
    1, 1, 1, 1, -1, 1, -1, -1, -1, -1, -1, 1, 1, -1, 1, 1, -1, -1, -1, 1, -1,
    -1, 1, 1, 1, 1, 1, 1, 1, -1,
  ];

  const colors = [
    5, 3, 7, 5, 3, 7, 5, 3, 7, 5, 3, 7, 1, 1, 3, 1, 1, 3, 1, 1, 3, 1, 1, 3, 0,
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1,
    0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
  ];

  const indices = [
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14,
    15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
  ];

  const instanceCount = 15;

  const posAttribute = new Attribute({
    label: "Position attribute",
    format: "float32x3",
    arrayBuffer: new Float32Array(vertices),
    itemCount: vertices.length / 3,
    itemSize: 3,
    shaderLocation: 0,
  });

  const colorAttribute = new Attribute({
    label: "Color attribute",
    format: "float32x3",
    arrayBuffer: new Float32Array(colors),
    itemCount: colors.length / 3,
    itemSize: 3,
    shaderLocation: 1,
  });

  const indexBuffer = new IndexBuffer({
    label: "Index buffer",
    arrayBuffer: new Uint16Array(indices),
  });

  const vao = new VertexAttributeObject({
    itemCount: vertices.length / 3,
  });

  await vao.addAttributes(posAttribute, colorAttribute);

  const instancedVao = new VertexAttributeObject({
    itemCount: instanceCount,
    stepMode: "instance",
  });

  const timeAttribute = new Attribute({
    label: "Time attribute",
    format: "float32x2",
    arrayBuffer: new Float32Array(
      indices.map(() => [Math.random(), Math.random()]).flat(),
    ),
    itemCount: instanceCount,
    itemSize: 2,
    shaderLocation: 2,
  });

  const posOffsets = indices
    .map(() => {
      const x = Math.random() * 2 - 1;
      const y = Math.random() * 2 - 1;
      const z = Math.random() * 2 - 1;
      return [x, y, z];
    })
    .flat();

  const posOffsetAttribute = new Attribute({
    label: "Position offset attribute",
    format: "float32x3",
    arrayBuffer: new Float32Array(posOffsets),
    itemCount: instanceCount,
    itemSize: 3,
    shaderLocation: 3,
  });

  await instancedVao.addAttributes(timeAttribute, posOffsetAttribute);

  const pipeline = new Pipeline({
    label: "Render pipeline",
    enableDepthStencil: true,
    enableMultiSampling: true,
    canvas,
    shader: /* wgsl */ `
      struct VertexInput {
        @builtin(instance_index) instanceIndex: u32,
        @location(0) pos: vec3<f32>,
        @location(1) color: vec3<f32>,
        @location(2) timeAndSpeed: vec2<f32>,
        @location(3) posOffset: vec3<f32>,
      }

      struct VertexOutput {
        @builtin(position) pos: vec4<f32>,
        @location(0) color: vec3<f32>,
      }

      @group(0) @binding(0) var<uniform> matrix: mat4x4<f32>;
      @group(0) @binding(1) var<uniform> time: f32;

      @vertex
      fn vertexMain(input: VertexInput) -> VertexOutput {
        var output = VertexOutput();

        var position = (input.pos * 0.1) + input.posOffset;
        position.y += sin(time + input.timeAndSpeed.x) * input.timeAndSpeed.y;

        output.pos = matrix * vec4(position, 1.0);
        output.color = input.color;

        return output;
      }

      @fragment
      fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
        return vec4(input.color, 1.0);
      }
    `,
  });

  pipeline.setClearColor([0.9, 0.9, 1.0, 1.0]);

  const pipelineGroup = new PipelineGroup({
    label: "Render pipeline group",
    instanceCount,
    vertexCount: vertices.length / 3,
    pipelines: [pipeline],
  });

  pipelineGroup.addVertexAttributeObjects(vao, instancedVao);
  await pipelineGroup.setIndexBuffer(indexBuffer);

  const viewMatrix = mat4.create();
  const projMatrix = mat4.create();
  const viewProjMatrix = mat4.create();

  const matrixUniform = new Uniform({
    label: "Matrix uniform",
    binding: 0,
    visibility: GPUShaderStage.VERTEX,
    arrayBuffer: new Float32Array(viewProjMatrix.values()),
  });

  const timeUniform = new Uniform({
    label: "Time uniform",
    binding: 1,
    visibility: GPUShaderStage.VERTEX,
    arrayBuffer: new Float32Array([0]),
  });

  const bindGroup = new BindGroup();

  await bindGroup.addUniforms(matrixUniform);
  await bindGroup.addUniforms(timeUniform);

  await pipelineGroup.setBindGroups(bindGroup);

  async function updateViewProjMatrix(): Promise<void> {
    mat4.lookAt(viewMatrix, [1, 0, 2], [0, 0, 0], [0, 1, 0]);
    mat4.perspective(projMatrix, 45, canvas.width / canvas.height, 0.1, 100);

    mat4.multiply(viewProjMatrix, projMatrix, viewMatrix);
    if (indexedDB.cmp(viewProjMatrix, matrixUniform.cpuBuffer) !== 0) {
      matrixUniform.cpuBuffer?.set(viewProjMatrix);
      await matrixUniform.updateGpuBuffer();
    }
  }

  pipeline.setOnBeforePass(async () => {
    if (timeUniform.cpuBuffer === undefined) {
      return;
    }
    timeUniform.cpuBuffer[0] = performance.now() / 1000;
    await timeUniform.updateGpuBuffer();
    await updateViewProjMatrix();
  });

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
