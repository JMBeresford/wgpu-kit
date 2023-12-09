#define EDGE_WIDTH 0.03

uniform float uTime;
uniform float uFade;
uniform vec3 uColor;
varying vec2 vUv;

#pragma glslify: cnoise3 = require('glsl-noise/classic/3d');
#pragma glslify: snoise3 = require('glsl-noise/simplex/3d');

float random(float x) {
  return fract(sin(x) * 43758.5453123);
}

struct Grid {
  vec2 st;
  vec2 id;
};

Grid getGrid(vec2 st, float scale) {
  vec2 gridSt = st / scale;
  vec2 coords = fract(gridSt) - 0.5;

  float gridX = smoothstep(0.5 - EDGE_WIDTH, 0.5 - EDGE_WIDTH / 2.0, coords.x);
  float gridY = smoothstep(0.5 - EDGE_WIDTH, 0.5 - EDGE_WIDTH / 2.0, coords.y);

  Grid grid = Grid(vec2(gridX, gridY), floor(gridSt));

  return grid;
}

void main() {
  float t = (uTime + 1000.0) * 0.25;

  vec2 st = gl_FragCoord.xy;
  st += t * 100.0;
  Grid grid = getGrid(st, 50.0);
  
  float noise1 = cnoise3(vec3(grid.id * 0.2, t));
  float noise2 = snoise3(vec3((grid.id + noise1 * 10.0) * 0.1, t));
  float noise = noise1 + noise2;

  float outline = max(grid.st.x, grid.st.y);
  vec3 outlineColor = uColor * outline; 
  vec3 cellColor = uColor * noise * 2.5;

  // accidentally stumbled upon a forbidden spell with this one
  vec3 color = mix(cellColor, outlineColor, step(0.001, outline));
  color *= 0.1;

  // vignette
  vec2 correctedUv = vUv;
  float vignette = distance(vec2(0.5), correctedUv);
  vignette = smoothstep(0.75, 0.3, vignette);
  color *= vignette;

  gl_FragColor = vec4(color, color) * uFade;

  // #include <tonemapping_fragment>
}
