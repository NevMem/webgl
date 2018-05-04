attribute vec3 position;
attribute vec3 normal;
attribute vec3 color;

uniform mat4 wMatrix;
uniform mat4 eyeMatrix;
uniform mat4 projMatrix;

varying vec3 Normal;
varying vec3 FragPos;
varying vec3 Color;

void main(){
	//triagNormal = (projMatrix * eyeMatrix * wMatrix * vec4(normal, 0.0)).xyz;
	Normal = normal;
	FragPos = vec3(wMatrix * vec4(position, 1.0));
	Color = color;

	gl_Position = projMatrix * eyeMatrix * wMatrix * vec4(position, 1.0);
}