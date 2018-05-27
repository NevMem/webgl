#version 300 es
precision highp float;
precision highp int;

in vec2 tCoord;
uniform sampler2D tx;
uniform mat4 colorTransform;

out vec4 outColor;

void main(){
	vec4 color = texture(tx, tCoord);
	vec4 buffer = color;
	//buffer = vec4(color.g, color.b, color.g, color.a);
	//buffer = vec4(color.b, color.r, color.g, color.a);
	//buffer = vec4(1. - color.r, .0, 1. - color.g, color.a);

	buffer = colorTransform * color;

	color = buffer;
	outColor = color;
}