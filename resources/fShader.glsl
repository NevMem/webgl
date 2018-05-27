#version 300 es
precision highp float;
precision highp int;

in vec2 tCoord;
uniform sampler2D tex1;
uniform sampler2D tex2;
out vec4 outColor;

uint tr(vec4 a){
	return uint(a.x * 255.) * uint(16777216) + uint(a.y * 255.) * uint(65536) + uint(a.z * 255.) * uint(256) + uint(a.w * 255.);
}

void main() {
	uint res = uint(0);
	int n = 128;
	for(int i = 0;i < n;i++) {
		res += 
			tr(texture(tex1, vec2(float(2 * n - 2 * i - 1) / float(2 * n), tCoord.x))) 
			* tr(texture(tex2, vec2(tCoord.y, float(2 * n - 2 * i - 1) / float(2 * n))));
	}
	uint red = res / uint(16777216);
	res -= red * uint(16777216);
	uint green = res / uint(65536);
	res -= green * uint(65536);
	uint blue = res / uint(256);
	res -= blue * uint(256);
	outColor = vec4(float(red) / 255., float(green) / 255., float(blue) / 255., float(res) / 255.);
}