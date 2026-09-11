export const vertexShader = `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = vec4(position, 1.0);
}
`

export const fragmentShader = `
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 charcoal;
uniform vec3 blue;
varying vec2 vUv;

float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}
	
float noise(vec2 n) {
    const vec2 d = vec2(0.0, 1.0);
    vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
    return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}

void main() {
    vec2 uv = (gl_FragCoord.xy) / u_resolution.x / 2.0;
    vec2 time = vec2(u_time, u_time) / 10.0;
    float v = noise(uv + time) + noise(uv * 4.0 + time / 4.0) / 4.0 + noise(uv * 8.0) / 8.0;
    float a = noise(uv * 0.5 - time);
    vec3 b = blue * vec3(1.0 + a, 1.0 + a, 1.0);

    vec3 color = charcoal * (1.0 - v) + b * v;

    gl_FragColor = vec4(color, 1.0);
}
`