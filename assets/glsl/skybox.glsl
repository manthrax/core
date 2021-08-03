

precision highp float;

//uniform mat4 uModel;
//uniform mat4 uView;
//uniform mat4 uProjection;
//attribute vec3 aPosition;
//attribute vec2 aUV;


uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;


attribute vec3 position;
attribute vec2 uv;

//varying vec2 vuv;
varying vec3 vposition;
void main() {
    vposition = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * vec4((vposition*5000.0)+cameraPosition, 1);
    //vuv = uv;
}


__split__


precision highp float;

//uniform sampler2D uTexture;
uniform samplerCube uTexture;

//varying vec2 vuv;
varying vec3 vposition;

void main() {
    gl_FragColor = textureCube(uTexture, vposition);
}
