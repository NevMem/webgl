precision highp float;

varying vec2 tCoord;

uniform sampler2D tx1;
uniform vec2 uResolution;
uniform vec2 dir;

void main(){
	vec2 p = gl_FragCoord.xy / uResolution.xy;
	p.x *= uResolution.x / uResolution.y;

	vec2 onePixel = vec2(1.0) / uResolution.xy;

	vec4 color = vec4(0);

	color += texture2D(tx1, tCoord - 5. * vec2(dir.x * onePixel.x, dir.y * onePixel.y)) * 0.035822;
	color += texture2D(tx1, tCoord - 4. * vec2(dir.x * onePixel.x, dir.y * onePixel.y)) * 0.05879;
	color += texture2D(tx1, tCoord - 3. * vec2(dir.x * onePixel.x, dir.y * onePixel.y)) * 0.086425;
	color += texture2D(tx1, tCoord - 2. * vec2(dir.x * onePixel.x, dir.y * onePixel.y)) * 0.113806;
	color += texture2D(tx1, tCoord - 1. * vec2(dir.x * onePixel.x, dir.y * onePixel.y)) * 0.13424;

	color += texture2D(tx1, tCoord) * 0.141836;
	
	color += texture2D(tx1, tCoord + 1. * vec2(dir.x * onePixel.x, dir.y * onePixel.y)) * 0.13424;
	color += texture2D(tx1, tCoord + 2. * vec2(dir.x * onePixel.x, dir.y * onePixel.y)) * 0.113806;
	color += texture2D(tx1, tCoord + 3. * vec2(dir.x * onePixel.x, dir.y * onePixel.y)) * 0.086425;
	color += texture2D(tx1, tCoord + 4. * vec2(dir.x * onePixel.x, dir.y * onePixel.y)) * 0.05879;
	color += texture2D(tx1, tCoord + 5. * vec2(dir.x * onePixel.x, dir.y * onePixel.y)) * 0.035822;

	gl_FragColor = vec4(color.rgb, 1.);
}