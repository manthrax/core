
precision highp float;

//uniform mat4 uModel;
//uniform mat4 uView;
//uniform mat4 uProjection;


uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 position;
attribute vec2 uv;

varying vec3 vPosition;

void main() {
XXX
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
    //pos = mat3(modelMatrix) * position;
    vPosition = (modelMatrix * vec4(position, 1)).xyz;
    //gl_Position = uProjection * uView * uModel * vec4(aPosition, 1);
    //pos = (uModel * vec4(aPosition, 1)).xyz;
}


__split__


precision highp float;
precision highp int;

varying vec3 vPos;

uniform vec3 baseColor;
uniform float brightness;
uniform float scale;
uniform float time;

// http://www.fractalforums.com/new-theories-and-research/very-simple-formula-for-fractal-patterns/
float field(in vec3 p) {
	float strength = 7. + .03 * log(1.e-6 + fract(sin(time) * 4373.11));
	float accum = 0.;
	float prev = 0.;
	float tw = 0.;
	for (int i = 0; i < 32; ++i) {
		float mag = dot(p, p);
		p = abs(p) / mag + vec3(-.51, -.4, -1.3);
		float w = exp(-float(i) / 7.);
		accum += w * exp(-strength * pow(abs(mag - prev), 2.3));
		tw += w;
		prev = mag;
	}
	return max(0., 5. * accum / tw - .2);
}

vec3 nrand3( vec2 co )
{
	vec3 a = fract( cos( co.x*8.3e-3 + co.y )*vec3(1.3e5, 4.7e5, 2.9e5) );
	vec3 b = fract( sin( co.x*0.3e-3 + co.y )*vec3(8.1e5, 1.0e5, 0.1e5) );
	vec3 c = mix(a, b, 0.5);
	return c;
}

void main() {
    vec3 pos = normalize(vPos)/scale;
    
	vec3 p = vec3(pos / 4.) + vec3(2., -1.3, -1.);
	p += 0.18 * vec3(sin(time / 16.), sin(time / 12.),  sin(time / 128.));
	
	vec3 p2 = vec3(pos / (4.+sin(time*0.11)*0.2+0.2+sin(time*0.15)*0.3+0.4)) + vec3(2., -1.3, -1.);
	p2 += 0.2 * vec3(sin(time / 16.), sin(time / 12.),  sin(time / 128.));

	vec3 p3 = vec3(pos / (4.+sin(time*0.14)*0.23+0.23+sin(time*0.19)*0.31+0.31)) + vec3(2., -1.3, -1.);
	p3 += 0.25 * vec3(sin(time / 16.), sin(time / 12.),  sin(time / 128.));
	
	float t = field(p);
	float t2 = field(p2);
	float t3 = field(p3);

	float v = (1. - exp((abs(pos.x) - 1.) * 6.)) * (1. - exp((abs(pos.y) - 1.) * 6.)) * (1. - exp((abs(pos.z) - 1.) * 6.));
	
	vec3 c1 = mix(.9, 1., v) * vec3(1.8 * t * t * t, 1.4 * t * t, t);
	vec3 c2 = mix(.8, 1., v) * vec3(1.9 * t2 * t2 * t2, 1.8 * t2 * t2, t2);
	vec3 c3 = mix(.8, 1., v) * vec3(1.4 * t3 * t3 * t3, 1.8 * t3 * t3, t3);
	c1 *= baseColor;
	c2 *= baseColor;
	c3 *= baseColor;
	
	gl_FragColor = vec4( brightness * vec3(c1*0.7 + c2*0.9 + c3*0.1), 1.0 );
}
