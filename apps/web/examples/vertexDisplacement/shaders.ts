import { cnoise4D, snoise3Dgrad, math } from "wgsl-noise";

const instanceCount1D = 24;
export const instanceCount = Math.pow(instanceCount1D, 3);
export const workGroupSize: [number, number, number] = [2, 2, 2];
export const workGroupCount: [number, number, number] = [
  Math.ceil(instanceCount1D / workGroupSize[0]),
  Math.ceil(instanceCount1D / workGroupSize[1]),
  Math.ceil(instanceCount1D / workGroupSize[2]),
];

const workgroupThreads = workGroupSize[0] * workGroupSize[1] * workGroupSize[2];

const common = `
  struct ParticleState {
    offset: vec3<f32>,
    life: f32,
    weight: f32,
    speed: f32,
    timeOffset: f32
  }
  struct State {
    state: array<ParticleState, ${instanceCount}>
  }

  @group(0) @binding(0) var<uniform> matrix: mat4x4<f32>;
  @group(0) @binding(1) var<storage, read> stateIn: State;
  @group(0) @binding(2) var<storage, read_write> stateOut: State;
  @group(0) @binding(3) var<uniform> time: f32;
  @group(0) @binding(4) var<uniform> normalMatrix: mat4x4<f32>;
  @group(0) @binding(5) var<uniform> modelMatrix: mat4x4<f32>;
`;

export const shader = `
  struct VertexInput {
    @builtin(instance_index) instance: u32,
    @location(0) pos: vec3f,
    @location(1) normal: vec3f,
    @location(2) color: vec3f
  };

  struct VertexOutput {
    @builtin(position) pos: vec4f,
    @location(0) color: vec3f,
    @location(1) normal: vec4f,
    @location(2) modelPos: vec3f
  };

  ${common}

  const LIGHT = vec3(0.0, 1.0, -5.0);

  @vertex
  fn vertexMain(input: VertexInput) -> VertexOutput  {
    
    var output: VertexOutput;
    let state = stateIn.state[input.instance];
    let lifeScale = 1.0 - (abs(state.life - 0.5) * 2.0);
    let scaledPos = input.pos * lifeScale;
    let modelPos = modelMatrix * vec4(scaledPos + state.offset, 1.0);

    output.pos = matrix * modelPos;
    output.normal = normalMatrix * vec4f(input.normal, 1.0);
    output.color = input.color;
    output.modelPos = modelPos.xyz;
    
    return output;
  }

  @fragment
  fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
    var color = input.color;
    let pos: vec3f = input.modelPos;
    let L = normalize(LIGHT - pos);
    let N = normalize(input.normal.xyz);

    let ambient = 0.25;
    let str = max(dot(L, -N), 0.0) + ambient;
    color *= str;
    return vec4(color, 1.0);
  }
`;

export const computeShader = `
  ${math}
  ${cnoise4D}
  ${snoise3Dgrad}
  ${common} 

  struct ComputeInput {
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_id) local_invocation_id : vec3<u32>,
    @builtin(global_invocation_id) global_invocation_id : vec3<u32>,
    @builtin(local_invocation_index) local_invocation_index: u32,
    @builtin(num_workgroups) num_workgroups: vec3<u32>
  }


  @compute @workgroup_size(${workGroupSize.join(",")})
  fn computeMain(input: ComputeInput) {
    let workgroup_idx = input.workgroup_id.x +
      input.workgroup_id.y * input.num_workgroups.x +
      input.workgroup_id.z * input.num_workgroups.x * input.num_workgroups.y;

    let idx =
      workgroup_idx * ${workgroupThreads} + input.local_invocation_index;

    let state = stateIn.state[idx];
    let curOffset = state.offset;
    let life = state.life - 0.001 * state.speed;

    let radius = length(curOffset);
    let noiseScale = 0.25;


    let noiseX = snoise3Dgrad(curOffset * noiseScale);
    let noiseY = snoise3Dgrad(curOffset * noiseScale + vec3(10000.0, 0.0, 0.0));
    let noiseZ = snoise3Dgrad(curOffset * noiseScale + vec3(0.0, 10000.0, 0.0));

    let newOffset = curOffset + vec3(noiseX, noiseY, noiseZ) * 0.02 * state.weight;
    stateOut.state[idx].offset = newOffset;
    stateOut.state[idx].life = life;

    if (life < 0.0) {
      let newLifeNoiseScale = 1000.0;
      let t = state.timeOffset + time * state.speed * 0.1;
      stateOut.state[idx].offset = normalize(vec3f(
        cnoise4D(vec4f(newOffset * newLifeNoiseScale, t)),
        cnoise4D(vec4f(newOffset * newLifeNoiseScale + vec3(10000.0, 0.0, 0.0), t)),
        cnoise4D(vec4f(newOffset * newLifeNoiseScale + vec3(0.0, 10000.0, 0.0), t))
      ));
      stateOut.state[idx].life = 1.0;
    }
  }
`;
