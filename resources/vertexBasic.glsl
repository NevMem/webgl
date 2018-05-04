attribute vec3 position;
attribute vec3 normal;

uniform mat4 worldMatrix;
uniform mat4 eyeMatrix;
uniform mat4 projectionMatrix;

uniform float size;

varying vec3 Normal;
varying vec3 FragPos;

void main(){
	Normal = normal;
	FragPos = vec3(worldMatrix * vec4(position * size, 1.));
	gl_Position = projectionMatrix * eyeMatrix * worldMatrix * vec4(position * size, 1.);
}