//#version 100
precision mediump float;
precision mediump int;

//uniform mat4 uModel;
//uniform mat4 uView;
//uniform mat4 uProjection;

/*
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
attribute vec3 position;
attribute vec2 uv;
*/

uniform vec3    impactPoint;

//attribute vec3 aPosition;
varying vec3 vPos;
varying vec2 vUv;

void main() {

    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
    //pos = mat3(modelMatrix) * position;
    vPos = (modelMatrix * vec4(position, 1)).xyz;
    
    vPos = normalize(vPos);

    vUv = uv;

    //gl_Position = uProjection * uView * uModel * vec4(aPosition, 1);
    //pos = (uModel * vec4(aPosition, 1)).xyz;
}


__split__


//#version 100

precision mediump float;
precision mediump int;


uniform vec3 uColor;
uniform vec3 uOffset;
uniform float uScale;
uniform float uIntensity;
uniform float uFalloff;
uniform float uTime;
varying vec3 vPos;
varying vec2 vUv;

__classic-noise-4d__

float noise(vec3 p) {
    return 0.5 * cnoise(vec4(p, 0)) + 0.5;
}

float nebula(vec3 p) {
    const int steps = 6;
    float scale = pow(2.0, float(steps));
    vec3 displace;
    for (int i = 0; i < steps; i++) {
        displace = vec3(
            noise(p.xyz * scale + displace),
            noise(p.yzx * scale + displace),
            noise(p.zxy * scale + displace)
        );
        scale *= 0.5;
    }
    return noise(p * scale + displace);
}

__nebulaFn__
