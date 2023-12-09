interface SphereGeometry {
  vertices: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
}

export function generateSphere(
  radius = 1,
  segmentsX = 5,
  segmentsY = 5,
): SphereGeometry {
  const sphere: SphereGeometry = {
    vertices: [],
    normals: [],
    uvs: [],
    indices: [],
  };

  const sx = Math.max(3, segmentsX);
  const sy = Math.max(2, segmentsY);

  let index = 0;
  const grid: number[][] = [];

  for (let iy = 0; iy <= sy; iy++) {
    const row: number[] = [];
    const v = iy / sy;

    let offset = 0;

    if (iy === 0) {
      offset = 0.5 / sx;
    } else if (iy === sy) {
      offset = -0.5 / sx;
    }

    for (let ix = 0; ix <= sx; ix++) {
      const u = ix / sx;

      const x = -radius * Math.cos(u * Math.PI * 2) * Math.sin(v * Math.PI);
      const y = radius * Math.cos(v * Math.PI);
      const z = radius * Math.sin(u * Math.PI * 2) * Math.sin(v * Math.PI);

      const normals = normalize([x, y, z]);

      sphere.vertices.push(x, y, z);
      sphere.normals.push(...normals);
      sphere.uvs.push(u + offset, 1 - v);
      row.push(index++);
    }

    grid.push(row);
  }

  for (let iy = 0; iy < sy; iy++) {
    for (let ix = 0; ix < sx; ix++) {
      const a = grid[iy][ix + 1];
      const b = grid[iy][ix];
      const c = grid[iy + 1][ix];
      const d = grid[iy + 1][ix + 1];

      if (iy !== 0 || sy === 2) {
        sphere.indices.push(a, b, d);
      }

      if (iy !== sy - 1 || sy === 2) {
        sphere.indices.push(b, c, d);
      }
    }
  }

  return sphere;
}

function normalize(v: number[]): number[] {
  const squares = v.map((x) => x * x);
  const sumOfSquares = squares.reduce((a, b) => a + b, 0);
  const length = Math.sqrt(sumOfSquares);
  const normalized = v.map((x) => x / length);

  return normalized;
}
