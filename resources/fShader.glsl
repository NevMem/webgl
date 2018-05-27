#version 300 es
precision highp float;
precision highp int;

in vec2 tCoord;
uniform sampler2D tex1;
uniform sampler2D tex2;
out vec4 outColor;

int tr(vec4 a){
	return int(a.x * 255.) * 16777216 + int(a.y * 255.) * 65536 + int(a.z * 255.) * 255 + int(a.w * 255.);
}

void main() {
	int res = 0;
	int n = 16;
	for(int i = 0;i < n;i++) {
		res += 
			tr(texture(tex1, vec2(float(2 * n - 2 * i - 1) / float(2 * n), tCoord.x))) 
			* tr(texture(tex2, vec2(tCoord.y, float(2 * n - 2 * i - 1) / float(2 * n))));
	}
	int red = res / 16777216;
	res -= red * 16777216;
	int green = res / 65536;
	res -= green * 65536;
	int blue = res / 256;
	res -= blue * 256;
	outColor = vec4(float(red) / 255., float(green) / 255., float(blue) / 255., float(res) / 255.);
}