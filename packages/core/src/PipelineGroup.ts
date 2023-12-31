import type { BindGroup } from "./BindGroup";
import type { IndexBuffer } from "./IndexBuffer";
import type { Pipeline } from "./Pipeline";
import type { VertexAttributeObject } from "./VertexAttributeObject";
import { WithCanvas } from "./components/Canvas";
import { WithDevice } from "./components/Device";
import { WithLabel } from "./components/Label";

const components = WithDevice(WithCanvas(WithLabel()));

/**
 * {@link PipelineGroup} constructor parameters
 */
export type PipelineGroupOptions = {
  label?: string;
  pipelines?: Pipeline[];
  instanceCount?: number;

  /**
   * The number of vertices to draw in a render pipeline.
   */
  vertexCount: number;
};

/**
 * A group of {@link Pipeline}s that share the same {@link VertexAttributeObject}s
 * and {@link BindGroup}s.
 */
export class PipelineGroup extends components {
  private _pipelineLayout?: GPUPipelineLayout;
  private _bindGroups: BindGroup[] = [];

  vertexAttributeObjects: VertexAttributeObject[] = [];
  pipelines: Pipeline[];
  instanceCount: number;
  indexBuffer?: IndexBuffer;
  vertexCount: number;

  constructor(options: PipelineGroupOptions) {
    super();
    this.label = options.label;
    this.pipelines = options.pipelines ?? [];

    this.instanceCount = options.instanceCount ?? 1;
    this.vertexCount = options.vertexCount;
  }

  get bindGroups() {
    return this._bindGroups;
  }

  async setBindGroups(...bindGroups: BindGroup[]): Promise<void> {
    await Promise.all(
      bindGroups.map(async (bindGroup) => {
        if (bindGroup.group === undefined) {
          await bindGroup.updateBindGroup();
        }
      }),
    );

    this._bindGroups = bindGroups;
    await this.updatePipelineLayout();
  }

  addVertexAttributeObjects(
    ...vertexAttributeObjects: VertexAttributeObject[]
  ): void {
    this.vertexAttributeObjects.push(...vertexAttributeObjects);
  }

  setInstanceCount(count: number) {
    this.instanceCount = count;
  }

  async setIndexBuffer(indexBuffer: IndexBuffer) {
    this.indexBuffer = indexBuffer;
    await this.indexBuffer.updateGpuBuffer();
  }

  async build() {
    await this.buildPipelines();
  }

  private async updatePipelineLayout() {
    const device = await this.getDevice();
    const layouts = this.bindGroups
      .sort((a, b) => a.index - b.index)
      .map((bg) => bg.layout);

    if (layouts.some((layout) => layout === undefined)) {
      throw new Error("Bind group layout not set");
    }

    const bindGroupLayouts = layouts as GPUBindGroupLayout[];

    this._pipelineLayout = device.createPipelineLayout({
      label: `${this.label ?? "Unlabelled"} Pipeline Layout`,
      bindGroupLayouts,
    });
  }

  private async buildPipelines() {
    const device = await this.getDevice();

    await Promise.all(
      this.pipelines.map(async (pipeline) => {
        await pipeline.build();

        if (this._pipelineLayout === undefined) {
          throw new Error("Pipeline layout not built");
        }

        if (pipeline.pipelineDescriptor.shaderModule === undefined) {
          throw new Error("Shader module not set");
        }

        if (pipeline.type === "render") {
          const vaoLayouts: GPUVertexBufferLayout[] = [];
          this.vertexAttributeObjects.forEach((vao) => {
            if (vao.layout === undefined) {
              throw new Error("Vertex attribute layout not set");
            }
            vaoLayouts.push(vao.layout);
          });

          pipeline.gpuPipeline = await device.createRenderPipelineAsync(
            pipeline.getRenderDescriptor(vaoLayouts, this._pipelineLayout),
          );
        } else {
          pipeline.gpuPipeline = await device.createComputePipelineAsync(
            pipeline.getComputeDescriptor(this._pipelineLayout),
          );
        }
      }),
    );
  }
}
