/**
 * @author flimshaw / http://charliehoey.com
 *
 * Technicolor Shader
 * Simulates the look of the two-strip technicolor process popular in early 20th century films.
 * More historical info here: http://www.widescreenmuseum.com/oldcolor/technicolor1.htm
 * Demo here: http://charliehoey.com/technicolor_shader/shader_test.html
 */

export default class CloudShader  {
	makePlane(THREE){
		var flim_noise = new THREE.TextureLoader().load("/core/assets/seamless-perlin-noise.jpg");
        var params={
            uniforms: {
                "tDiffuse": { type: "t", value: null },
                "tNoise": { type: "t", value: flim_noise },
                "uTime": { type: "f", value: 0.0 },
            },

            vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv * 20.;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }`,
            fragmentShader:
            `uniform sampler2D tDiffuse;
            uniform sampler2D tNoise;
            uniform float uTime;

            varying vec2 vUv;

            vec3 Wheel(float wheelPos)
            {
                float r = abs(tan(wheelPos + .025));
                float g = abs(tan(wheelPos - .05));
                float b = abs(tan(wheelPos - .1));
              return( vec3( r, g, b ) );
            }
            const float fogNear = .9999;
            const float fogFar = 1.;
            
            void main() {

                float phase = abs( sin( uTime * .0001 ) );
                float wipe = sin(uTime * .000025);
                vec4 tex = texture2D( tNoise, vec2(vUv.x + (uTime * .000025), vUv.y * ( sin(uTime * .0001) * .25 + .75) ));
                vec4 tex2 = texture2D( tNoise, vec2(vUv.x - (tex.r * .2), vUv.y - (tex.r * .3) ) );
                gl_FragColor = vec4(Wheel( ( (tex.r * sin(tex2.r) * 2.5) ) * .55 ), 1.);
                float fogAmount = smoothstep(fogNear, fogFar, gl_FragCoord.z);
                gl_FragColor = vec4(vec3(1.),(gl_FragColor.r * (1.-fogAmount))-.4);
                 //gl_FragColor = vec4(Wheel( ( (tex.r - (2.5 * tex2.r)) ) * ( (sin(uTime * .0001) * 1.) ) ), 1.);
            }`
        }
		flim_noise.wrapS = THREE.RepeatWrapping;
		flim_noise.wrapT = THREE.RepeatWrapping;
	//	params.depthTest = params.depthWrite = false;
        params.side = THREE.DoubleSide;
        params.transparent = true;
		var shaderMat = new THREE.ShaderMaterial( params );
		var shaderPlane = new THREE.Mesh(new THREE.PlaneGeometry(1,1), shaderMat);
		shaderPlane.rotation.x = Math.PI * .5;
shaderPlane.scale.multiplyScalar(10000);
shaderPlane.position.y += 110;
		shaderPlane.onBeforeRender=function(){
		    shaderMat.uniforms.uTime.value = performance.now()
		    shaderMat.uniforms.uniformsNeedUpdate = true
		}
		return shaderPlane;
	}
};
