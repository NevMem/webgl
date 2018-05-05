#version 300 es

layout(location = 0) in vec3 position;

uniform mat4 worldMatrix;
uniform mat4 eyeMatrix;
uniform mat4 projectionMatrix;

void main(){
	gl_Position = projectionMatrix * eyeMatrix * worldMatrix * vec4(position, 1.);
}