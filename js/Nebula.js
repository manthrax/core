import*as THREE from "https://threejs.org/build/three.module.js";
import Shaders from './Shaders.js';
import PRNG from './PRNG.js';
//let nebula = new Nebula()

export default class NebulaMaterial {
    static create(transparent, nebulaFn, uniforms) {
        let rand = this.rng = PRNG.SinRNG(5465);
        //this.energyImpactMaterial = await this.nebula(false,"energyImpact.snip",{impactPoint:new THREE.Vector3(),impactRadius:3.0});

        return new Promise((resolve,reject)=>{
            Shaders.load("assets/glsl/nebula.glsl", {
            nebulaFn: nebulaFn ? nebulaFn : "nebula1p.snip"
            }).then((skel)=>{
			
                uniforms = uniforms ? uniforms : {};
                skel.uniforms.uColor = {
                    value: new THREE.Vector3(0.5,0.7,0.9)
                }
                skel.uniforms.uOffset = {
                    value: new THREE.Vector3(rand.random() * 2000 - 1000,rand.random() * 2000 - 1000,rand.random() * 2000 - 1000)
                }
                skel.uniforms.uScale = {
                    value: 0.03
                }
                skel.uniforms.uIntensity = {
                    value: 1
                }
                skel.uniforms.uFalloff = {
                    value: 3
                }
                skel.uniforms.uAge = {
                    value: 0
                }
                skel.uniforms.uTime = {
                    value: 0.0
                }
/*
uniform vec3 baseColor;
uniform float brightness;
uniform float scale;
uniform float time;
*/

                for (var i in uniforms)
                    skel.uniforms[i] = {
                        value: uniforms[i]
                    };
                if (transparent) {
                    skel.depthTest = true;
                    skel.depthWrite = false;
                    skel.transparent = true;
                    skel.side = THREE.DoubleSide;
                    skel.blending = THREE.AdditiveBlending;
                }
                    skel.depthWrite = false;
                    skel.side = THREE.DoubleSide;

                var material = new THREE.ShaderMaterial(skel);
material.uniforms= THREE.UniformsUtils.clone( material.uniforms )

			

                material.randomize = (seed,time)=>{
                    var rand = this.rng;
                    if (seed != undefined)
                        rand.seed = seed;

this.genSeed = rand.seed;
            //-6443.604929024833 groovy maxfield parrish

            //5753.415834737375; nice blue...

            //-8199.669788980435;


                    //console.log("nebula seed:",rand.seed);
                    material.uniforms.uColor.value = new THREE.Vector3(rand.random(),rand.random(),rand.random()).normalize();
                    //0.5,0.7,0.9);
                    material.uniforms.uOffset.value = new THREE.Vector3(rand.random() * 2000 - 1000,rand.random() * 2000 - 1000,rand.random() * 2000 - 1000);
                    material.uniforms.uScale.value = 0.03;
                    material.uniforms.uIntensity.value = 1;
                    material.uniforms.uFalloff.value = 3;
                    material.uniforms.uTime.value = time !== undefined ? time : performance.now() / 1000;
                    material.uniformsNeedUpdate = true;
                    return rand.seed;

                }
                resolve(material);
            }
            )
            })
    }
}
