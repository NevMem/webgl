#version 300 es

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;

uniform mat4 worldMatrix;
uniform mat4 eyeMatrix;
uniform mat4 projectionMatrix;

uniform float size;

out vec3 Normal;
out vec3 FragPos;

void main(){
	Normal = normal;
	FragPos = vec3(worldMatrix * vec4(position * size, 1.));
	gl_Position = projectionMatrix * eyeMatrix * worldMatrix * vec4(position * size, 1.);
}