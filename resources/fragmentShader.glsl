precision mediump float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 lightPos;

varying vec3 Normal;
varying vec3 FragPos;
varying vec3 Color;

float getIntensity(in vec2 pos){
	return fract((2. * sin(.5 * length(vec2(pos.x - 0.0, pos.y - 0.0)) * 100.0 + uTime / 500.0) + 1.0) / 2.0);
}

void main(){
	//vec2 pos = gl_FragCoord.xy / uResolution.xy - 0.5;
	//pos.y = pos.y * uResolution.y / uResolution.x;
	//vec3 color = vec3(0.1, 0.2, 0.45) * getIntensity(pos);

	vec3 color = Color;//vec3(0.3, 0.9, 0.1);

	vec3 norm = normalize(Normal);
	vec3 lightDir = normalize(lightPos - FragPos);
	float diff = max(abs(dot(norm, lightDir)), .3);

	gl_FragColor = vec4(color * diff, 1.0);
}