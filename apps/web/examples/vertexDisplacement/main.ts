import {
  Attribute,
  BindGroup,
  Executor,
  IndexBuffer,
  Pipeline,
  PipelineGroup,
  Storage,
  Uniform,
  VertexAttributeObject,
} from "@wgpu-kit/core/src";
import { mat4 } from "gl-matrix";
import { generateSphere } from "./sphere";
import {
  shader,
  instanceCount,
  computeShader,
  workGroupSize,
  workGroupCount,
} from "./shaders";

export async function runExample(canvas: HTMLCanvasElement): Promise<void> {
  const sphere = generateSphere(0.075, 20, 20);

  const posAttribute = new Attribute({
    format: "float32x3",
    itemSize: 3,
    itemCount: sphere.vertices.length / 3,
    arrayBuffer: new Float32Array(sphere.vertices),
    shaderLocation: 0,
  });

  const normalsAttribute = new Attribute({
    format: "float32x3",
    itemSize: 3,
    itemCount: sphere.normals.length / 3,
    arrayBuffer: new Float32Array(sphere.normals),
    shaderLocation: 1,
  });

  const vao = new VertexAttributeObject({
    itemCount: sphere.vertices.length / 3,
  });

  await vao.addAttributes(posAttribute, normalsAttribute);

  const colors = [
    [0.2, 0.2, 0.2],
    [0.4, 0.4, 0.4],
    [0.6, 0.6, 0.6],
    [1.0, 0.8, 0.2],
  ];

  const instanceColors: number[] = [];
  for (let i = 0; i < instanceCount; i++) {
    const r = Math.floor(Math.pow(Math.random(), 4) * colors.length);
    instanceColors.push(...colors[r]);
  }

  const colorAttribute = new Attribute({
    format: "float32x3",
    itemSize: 3,
    itemCount: instanceCount,
    arrayBuffer: new Float32Array(instanceColors),
    shaderLocation: 2,
  });

  const instancedVao = new VertexAttributeObject({
    itemCount: instanceCount,
    stepMode: "instance",
  });

  await instancedVao.addAttributes(colorAttribute);

  const indexBuffer = new IndexBuffer({
    arrayBuffer: new Uint32Array(sphere.indices),
  });

  const modelMatrix = mat4.create();
  const viewMatrix = mat4.create();
  const modelViewMatrix = mat4.create();
  const normalMatrix = mat4.create();
  const projMatrix = mat4.create();
  const matrix = mat4.create();

  function updateMatrices(): void {
    const timeScale = 0.000025;
    const r = performance.now() * timeScale * -5;

    mat4.fromYRotation(modelMatrix, r);
    mat4.rotateZ(modelMatrix, modelMatrix, r * 0.35);
    mat4.lookAt(viewMatrix, [0, 0, 5], [0, 0, 0], [0, 1, 0]);
    mat4.perspective(projMatrix, 55, canvas.width / canvas.height, 0.01, 10);

    mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    mat4.multiply(matrix, projMatrix, modelViewMatrix);
  }

  const modelMatrixUniform = new Uniform({
    binding: 5,
    visibility: GPUShaderStage.VERTEX,
    arrayBuffer: modelMatrix as Float32Array,
  });

  const matrixUniform = new Uniform({
    binding: 0,
    visibility: GPUShaderStage.VERTEX,
    arrayBuffer: projMatrix as Float32Array,
  });

  const normalMatrixUniform = new Uniform({
    binding: 4,
    visibility: GPUShaderStage.VERTEX,
    arrayBuffer: normalMatrix as Float32Array,
  });

  const states: number[] = [];
  for (let i = 0; i < instanceCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = Math.cbrt(Math.random());
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    // x, y, z, life, weight, ...padding
    const life = Math.pow(Math.random(), 4);
    const weight = 0.2 + Math.pow(Math.random(), 4) * 0.3;
    const speed = 0.5 + Math.pow(Math.random(), 3) * 0.5;
    const timeOffset = Math.random() * 1000;
    states.push(x, y, z, life, weight, speed, timeOffset, 0);
  }

  const offsetsStorage = new Storage({
    arrayBuffer: new Float32Array(states),
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
    binding: 1,
    readOnly: true,
  });

  const offsetsStorage2 = new Storage({
    arrayBuffer: new Float32Array(states),
    visibility: GPUShaderStage.COMPUTE,
    binding: 2,
    readOnly: false,
  });

  const timeUniform = new Uniform({
    binding: 3,
    visibility: GPUShaderStage.COMPUTE,
    arrayBuffer: new Float32Array([0]),
  });

  const bindGroup = new BindGroup();

  await bindGroup.addUniforms(
    matrixUniform,
    normalMatrixUniform,
    timeUniform,
    modelMatrixUniform,
  );
  await bindGroup.addStorages(offsetsStorage, offsetsStorage2);
  await bindGroup.updateBindGroup();

  const bindGroup2 = new BindGroup({ layout: bindGroup.layout });

  offsetsStorage.binding = 2;
  offsetsStorage2.binding = 1;
  await bindGroup2.addUniforms(
    matrixUniform,
    normalMatrixUniform,
    timeUniform,
    modelMatrixUniform,
  );
  await bindGroup2.addStorages(offsetsStorage, offsetsStorage2);
  await bindGroup2.updateBindGroup();

  const pipeline = new Pipeline({
    shader,
    clearColor: [0.5, 0.45, 0.425, 1],
    canvas,
    enableDepthStencil: true,
    enableMultiSampling: true,
  });

  function getTime(): number {
    return performance.now() / 1000;
  }

  let counter = 0;
  const computePipeline = new Pipeline({
    shader: computeShader,
    type: "compute",
    workgroupSize: workGroupSize,
    workgroupCount: workGroupCount,
    onAfterPass: async () => {
      if (counter % 2 === 1) {
        await pipelineGroup.setBindGroups(bindGroup);
      } else {
        await pipelineGroup.setBindGroups(bindGroup2);
      }

      counter += 1;
    },
    onBeforePass: async () => {
      if (timeUniform.cpuBuffer) {
        timeUniform.cpuBuffer[0] = getTime();
        await timeUniform.updateGpuBuffer();
      }

      updateMatrices();
      await normalMatrixUniform.setCpuBuffer(normalMatrix as Float32Array);
      await matrixUniform.setCpuBuffer(matrix as Float32Array);
    },
  });

  const pipelineGroup = new PipelineGroup({
    pipelines: [computePipeline, pipeline],
    vertexCount: sphere.vertices.length / 3,
    instanceCount,
  });

  await pipelineGroup.setBindGroups(bindGroup);
  pipelineGroup.addVertexAttributeObjects(vao, instancedVao);
  await pipelineGroup.setIndexBuffer(indexBuffer);

  const executor = new Executor();

  await executor.addPipelineGroups(pipelineGroup);

  async function render(): Promise<void> {
    await executor.run();

    await new Promise(requestAnimationFrame);
    await render();
  }

  await render();
}
