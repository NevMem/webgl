precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 lightPosition;
uniform vec3 paintColor;

varying vec3 Normal;
varying vec3 FragPos;

float upsin(float val){
	return (sin(val) + 1.0) / 2.0;
}

float circle(vec2 p){
	float blur = .05;
	float r = 1.0;

	float d = length(p - vec2(.0, .0));
	d = d * 10.0;
	//d += uTime / 200.0;

	return smoothstep(.95 - blur, .95, upsin(d));
}

float cross(vec2 a, vec2 b){
	return a.x * b.y - a.y * b.x;
}

float intensity(vec2 p){
	vec2 v = vec2(sin(uTime / 500.0), cos(uTime / 500.0));

	float sn = cross(v, p);
	float cs = dot(v, p);

	sn = abs(sn);
	cs = abs(cs);

	float res = cs / sn;

	return res;
}

void main(){
	vec2 p = gl_FragCoord.xy / uResolution.xy - .5;
	p.x = p.x * uResolution.x / uResolution.y;
	p *= 2.0;

	vec3 color = paintColor;

	vec3 normal = normalize(Normal);
	vec3 ray = normalize(FragPos - lightPosition);
	float intensity = max(.2, abs(dot(ray, normal)));

	//color = color * circle(p);// * intensity(p);
	//color = color * step(.5, fract(p.x)) * step(.5, fract(p.y));

	gl_FragColor = vec4(color * intensity, 1.);
}