#version 300 es

precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 lightPosition;
uniform vec3 paintColor;

in vec3 Normal;
in vec3 FragPos;

out vec4 fragColor;

void main(){
	vec2 p = gl_FragCoord.xy / uResolution.xy - .5;
	p.x = p.x * uResolution.x / uResolution.y;
	p *= 2.0;

	vec3 color = paintColor;

	vec3 normal = normalize(Normal);
	vec3 ray = normalize(FragPos - lightPosition);
	float intensity = abs(dot(ray, normal));

	//intensity = 1.;

	float lowestIntensity = .7;

	fragColor = vec4(color * (lowestIntensity + (1. - lowestIntensity) * intensity), 1.);
}