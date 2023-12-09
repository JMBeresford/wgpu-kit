import { Attribute } from "@wgpu-kit/core/src/Attribute";
import { VertexAttributeObject } from "@wgpu-kit/core/src/VertexAttributeObject";
import { Pipeline } from "@wgpu-kit/core/src/Pipeline";
import { PipelineGroup } from "@wgpu-kit/core/src/PipelineGroup";
import { Executor } from "@wgpu-kit/core/src/Executor";
import { Uniform } from "@wgpu-kit/core/src/Uniform";
import { Storage } from "@wgpu-kit/core/src/Storage";
import { BindGroup } from "@wgpu-kit/core/src/BindGroup";
import {
  GRID_SIZE,
  WORKGROUP_SIZE,
  computeShader,
  renderShader,
} from "./shaders";

export async function runExample(canvas: HTMLCanvasElement): Promise<void> {
  const vertices = new Float32Array([
    -0.8, -0.8, 0.8, -0.8, 0.8, 0.8,

    -0.8, -0.8, 0.8, 0.8, -0.8, 0.8,
  ]);

  const posAttribute = new Attribute({
    label: "Position",
    format: "float32x2",
    shaderLocation: 0,
    arrayBuffer: vertices,
    itemCount: vertices.length / 2,
    itemSize: 2,
  });

  const gridUniform = new Uniform({
    label: "Grid Size Uniform",
    visibility:
      GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
    binding: 0,
    arrayBuffer: new Float32Array([GRID_SIZE, GRID_SIZE]),
  });

  const stepUniform = new Uniform({
    label: "Step Uniform",
    visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
    binding: 1,
    arrayBuffer: new Uint32Array([0]),
  });

  const cellState = new Uint32Array(GRID_SIZE * GRID_SIZE * 2);

  for (let i = 0; i < cellState.length / 2; i++) {
    cellState[i] = Math.random() > 0.75 ? 1 : 0;
  }

  const gridStorage = new Storage({
    label: "Cell State Storage",
    visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
    binding: 2,
    arrayBuffer: cellState,
    readOnly: false,
  });

  const vao = new VertexAttributeObject({
    label: "Cell VAO",
    itemCount: vertices.length / 2,
  });

  await vao.addAttributes(posAttribute);

  const renderPipeline = new Pipeline({
    label: "Render Pipeline",
    shader: renderShader,
    canvas,
  });

  const computePipeline = new Pipeline({
    label: "Cell Simulation Pipeline",
    type: "compute",
    workgroupSize: [WORKGROUP_SIZE, WORKGROUP_SIZE, 1],
    workgroupCount: [GRID_SIZE / WORKGROUP_SIZE, GRID_SIZE / WORKGROUP_SIZE, 1],
    onAfterPass: async () => {
      if (!stepUniform.cpuBuffer) return;
      stepUniform.cpuBuffer[0] += 1;

      await stepUniform.updateGpuBuffer();
    },
    shader: computeShader,
  });

  const pipelineGroup = new PipelineGroup({
    label: "Cell Pipeline Group",
    pipelines: [computePipeline, renderPipeline],
    vertexCount: vertices.length / 2,
    instanceCount: GRID_SIZE * GRID_SIZE,
  });

  const bindGroup = new BindGroup();

  await bindGroup.addUniforms(gridUniform, stepUniform);
  await bindGroup.addStorages(gridStorage);

  await pipelineGroup.setBindGroups(bindGroup);
  pipelineGroup.addVertexAttributeObjects(vao);

  const executor = new Executor({
    label: "Cell Executor",
  });

  await executor.addPipelineGroups(pipelineGroup);

  async function tick(): Promise<void> {
    await executor.run();
    await new Promise(requestAnimationFrame);
    await tick();
  }

  await tick();
}
