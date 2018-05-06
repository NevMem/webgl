#version 300 es
precision highp float;

uniform vec3 paintColor;
out vec4 fragColor;

void main(){
	fragColor = vec4(paintColor, .9);
}