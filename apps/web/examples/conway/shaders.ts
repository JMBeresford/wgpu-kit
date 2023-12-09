export const GRID_SIZE = 256;
export const WORKGROUP_SIZE = 16;

export const renderShader = /* wgsl */ `
  struct VertexInput {
    @location(0) pos: vec2f,
    @builtin(instance_index) instance: u32,
  };

  struct VertexOutput {
    @builtin(position) pos: vec4f,
    @location(0) cell: vec2f,
    @location(1) @interpolate(flat) instance: u32,
  };

  struct CellState {
    state: array<u32, ${GRID_SIZE * GRID_SIZE}>,
  }

  struct State {
    states: array<CellState, 2>,
  }

  @group(0) @binding(0) var<uniform> grid: vec2<f32>;
  @group(0) @binding(1) var<uniform> step: u32;
  @group(0) @binding(2) var<storage, read_write> state: State;

  @vertex
  fn vertexMain(input: VertexInput) -> VertexOutput  {
    let i = f32(input.instance);
    let cell = vec2f(i % grid.x, floor(i / grid.x));
    let cellOffset = cell / grid * 2;
    let gridPos = (input.pos + 1) / grid - 1 + cellOffset;
    
    var output: VertexOutput;
    output.pos = vec4f(gridPos, 0, 1);
    output.cell = cell;
    output.instance = input.instance;
    return output;
  }

  @fragment
  fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
    let c = input.cell / grid;

    let readIdx = select(0u, 1u, step % 2u == 0u);
    let stateIn = &state.states[readIdx];

    let state = f32((*stateIn).state[input.instance]);
    return vec4f(c, 1-c.x, 1) * state * 2.0;
  }
`;

export const computeShader = /* wgsl */ `
  struct CellState {
    state: array<u32, ${GRID_SIZE * GRID_SIZE}>,
  }

  struct State {
    states: array<CellState, 2>,
  }

  @group(0) @binding(0) var<uniform> grid: vec2<f32>;
  @group(0) @binding(1) var<uniform> step: u32;
  @group(0) @binding(2) var<storage, read_write> state: State;

  fn cellIndex(cell: vec2u) -> u32 {
    return (cell.y % u32(grid.y)) * u32(grid.x) +
          (cell.x % u32(grid.x));
  }

  @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE}, 1)
  fn computeMain(@builtin(global_invocation_id) cell: vec3<u32>) {
    
    let stepIsEven = step % 2u == 0u;
    let readIdx = select(0u, 1u, stepIsEven);
    let writeIdx = select(1u, 0u, stepIsEven);
    
    let stateIn = &state.states[readIdx];
    let stateOut = &state.states[writeIdx];
    
    var activeNeighbors = 0u;
    for (var y: u32 = 0u; y < 3u; y = y + 1u) {
      for (var x: u32 = 0u; x < 3u; x = x + 1u) {
        if (x == 1u && y == 1u) {
          continue;
        }
        
        let cellActive: u32 = (*stateIn).state[cellIndex(vec2(cell.x + x - 1u, cell.y + y - 1u))];
        activeNeighbors = activeNeighbors + cellActive;
      }
    }

    let i = cellIndex(cell.xy);

    switch activeNeighbors {
      case 2: { // Active cells with 2 neighbors stay active.
        (*stateOut).state[i] = (*stateIn).state[i];
      }
      case 3: { // Cells with 3 neighbors become or stay active.
        (*stateOut).state[i] = 1;
      }
      default: { // Cells with < 2 or > 3 neighbors become inactive.
        (*stateOut).state[i] = 0;
      }
    } 
  }
`;
