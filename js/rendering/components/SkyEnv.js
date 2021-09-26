//import*as THREE from "https://threejs.org/build/three.module.js";
import {Sky} from 'https://threejs.org/examples/jsm/objects/Sky.js';

import { FloatNode } from 'https://threejs.org/examples/jsm/nodes/inputs/FloatNode.js';
import { MathNode } from 'https://threejs.org/examples/jsm/nodes/math/MathNode.js';

let lights;
import NebulaMaterial from './Nebula.js'

export default function SkyEnv(ctx) {
    return new Promise((resolve,reject)=>{
        let self = {}
        let {renderer, scene, world, THREE} = ctx;

        /*
    let pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    new RGBELoader().load(//"https://cdn.glitch.com/98e0326e-ecbf-44ed-bd5a-0b0d40b0cee8%2Fstudio_small_07_1k.hdr?v=1621085795290"
    "./art/green_point_park_1k.hdr"//"https://cdn.glitch.com/98e0326e-ecbf-44ed-bd5a-0b0d40b0cee8%2Fvenice_sunset_2k.hdr?v=1621085945412"
    , texture=>{
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        pmremGenerator.dispose();
        scene.environment = envMap;
        scene.background = envMap
    }
    );
    */
        let rttCamera
        let _clearColor = new THREE.Color();
        let renderToTarget = (renderer,object,camera,target)=>{

            const originalAutoClear = renderer.autoClear;
            const outputEncoding = renderer.outputEncoding;
            const toneMapping = renderer.toneMapping;
            renderer.getClearColor(_clearColor);
            renderer.toneMapping = THREE.NoToneMapping;
            renderer.outputEncoding = THREE.LinearEncoding;
            renderer.autoClear = false;
            renderer.setRenderTarget(target);
            renderer.render(object, camera);
            renderer.setRenderTarget(null);
            renderer.toneMapping = toneMapping;
            renderer.outputEncoding = outputEncoding;
            renderer.autoClear = originalAutoClear;
        }

        let fsPlane = new THREE.Mesh(new THREE.PlaneBufferGeometry(),new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            fragmentShader:`
void main(){
	gl_FragColor = vec4(1.);
}
`
        }));

        let lights = new THREE.Object3D();
        let shadowLight, ambientLight;
        let helper
        let setupLights = ()=>{

            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            //ambientLight = new THREE.AmbientLight("white",1000);
            //lights.add(ambientLight)

            shadowLight = new THREE.DirectionalLight("white",1);
            shadowLight.shadow.enabled = true;

            /*
    let timeOfDay = 930 //1015
    let azim = 0 // -110
    light.position.setFromSpherical({
        radius: 15,
        phi: timeOfDay * Math.PI * 2 / 1200,
        theta: azim * Math.PI / 180
    })*/
            //set(7, 14, 5);
            // default THREE.PCFShadowMap
            lights.add(shadowLight);
            lights.add(shadowLight.target)
            shadowLight.castShadow = true;

            //Set up shadow properties for the light
            shadowLight.shadow.mapSize.width = 2048;
            shadowLight.shadow.mapSize.height = 2048;
            shadowLight.shadow.radius = 0;
            shadowLight.shadow.bias = -0.0005;
            let lc = shadowLight.shadow.camera;
            lc.near = 0.5;
            lc.far = 100;
            lc.left = lc.bottom = -32;
            lc.right = lc.top = 32;
            lc.updateProjectionMatrix();
            /*
    let light1 = new THREE.PointLight(0xff0000,0.1,20,2);
    lights.add(light1);
    light1.position.set(1, 2, 1);

    let light2 = new THREE.PointLight(0x00ffff,0.1,20,2);
    lights.add(light2);
    light2.position.set(-1, 2, -1);
*/
            scene.add(lights);
self.lights = ctx.lights = lights;

            //helper = new THREE.DirectionalLightHelper(shadowLight)
            //scene.add(helper)

        }
        self.targetChanged = (pos)=>{
            lights.position.set(pos.x, lights.position.y, pos.z)
        }
        setupLights()
        // Add Sky
        let sky = new Sky();
        //    sky.scale.setScalar(450000);

        NebulaMaterial.create(false, 'starswamp.snip').then((mat)=>{
            //

            mat.fragmentShader = mat.fragmentShader.slice(0, mat.fragmentShader.lastIndexOf('}')) + `
    #include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}
            `
            /*
            mat = new THREE.MeshBasicMaterial({color:'red'})
            mat.onBeforeCompile=function(a,b,c){
                    let fs = a.fragmentShader.slice( 0,a.fragmentShader.lastIndexOf('gl_FragColor'))
            fs += `
            outgoingLight.rgb=vec3(1.,0.,1.);
gl_FragColor = vec4( outgoingLight, diffuseColor.a );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}
            `
            a.fragmentShader=fs;
            }

                       mat = new THREE.ShaderMaterial({fragmentShader:`
void main(){
    gl_FragColor=vec4(0.,0.,1.,1.);	
    #include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}
            `})
*/
            mat.side = THREE.DoubleSide
            //mat.depthWrite = false
            self.nightScene = new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mat)
            //,mat);
            //self.nightSky.nebulaMaterial );// //

            //            self.clone = new THREE.Mesh(new THREE.SphereGeometry(1,32,32),mat);//self.nightScene.clone();
            //            scene.add(self.clone)

            //           self.clone.scale.setScalar(50)
            //           self.clone.material = mat
            //           self.nightScene.frustumCulled = false;
            //self.nightScene.scale.setScalar(450000);

            //    		self.nightScene.scale.multiplyScalar(45000)
            //self.nightScene.scale.multiplyScalar(10)
            //self.nightScene.material = self.nightSky.energyImpactMaterial
            if (self.clone)
                self.clone.onBeforeRender = function() {
                    self.material.uniforms && self.material.uniforms.uTime && (self.material.uniforms.uTime.value = performance.now() / 1000.)
                }

            self.nightScene.onBeforeRender = function() {}

            resolve(self)
        }
        )

        //scene.add(sky);

        let sun = new THREE.Vector3();

        /// GUI

        const effectController = {
            turbidity: 3.4,
            //10,
            rayleigh: 1,
            //3,
            mieCoefficient: 0.06,
            //0.005,
            mieDirectionalG: .7,
            //0.7,
            elevation: 80,
            azimuth: 100,
            //180,
            exposure: renderer.toneMappingExposure
        };

        const pmremGenerator = new THREE.PMREMGenerator(renderer);

const transition = new FloatNode(0.1);
document.addEventListener('before-render',()=>{
	let time = performance.now()/1000.;
	transition.value = time % 1;
})

        self.update = (rseed=12345.)=>{
            console.log(`skyseed:${rseed}`)
            const uniforms = sky.material.uniforms;
            uniforms['turbidity'].value = effectController.turbidity;
            uniforms['rayleigh'].value = effectController.rayleigh;
            uniforms['mieCoefficient'].value = effectController.mieCoefficient;
            uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;

            //effectController.elevation = (performance.now() / 500)%90;

            const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
            const theta = THREE.MathUtils.degToRad(effectController.azimuth);

            sun.setFromSphericalCoords(1, phi, theta);

            uniforms['sunPosition'].value.copy(sun);

            renderer.toneMappingExposure = effectController.exposure;
            //renderer.render(scene, camera);
            if (shadowLight) {
                shadowLight.position.copy(sun).multiplyScalar(14)
                //shadowLight.lookAt(shadowLight.target.position)
                // helper.lookAt(lights.position)
                helper && helper.update()
            }
            //if( self.nightSky.nebulaMaterial)
            self.nightScene && self.nightScene.material.randomize && self.nightScene.material.randomize(rseed || (((Math.random() * 1000.) | 0)));

            let lastMap = scene.environment
            
                scene.background = scene.environment = null;
            let nextMap = pmremGenerator.fromScene(self.nightScene || sky).texture;

            if (lastMap && nextMap) {
                if (!this.envTween) {

                    let w = nextMap.image.width
                    let h = nextMap.image.height

                    rttCamera = new THREE.OrthographicCamera(-w,h,w,-h,-1,1);

                    this.envTween = new THREE.WebGLRenderTarget(w,h,{
                        depthBuffer: false,
                        magFilter: THREE.NearestFilter,
                        minFilter: THREE.NearestFilter,
                        generateMipmaps: false,
                        type: THREE.UnsignedByteType,
                        format: THREE.RGBEFormat,
                        encoding: THREE.RGBEEncoding,
                    })

                }


fsPlane.material.map = lastMap;

                renderToTarget(renderer, fsPlane, rttCamera, this.envTween)

                scene.background = scene.environment = nextMap;
                
//scene.background = scene.environment = this.envTween.texture;
                
//nextMap = this.envTween.texture;
                //


                //scene.environment = new MathNode(lastMap, nextMap, transition, MathNode.MIX);


            } else {
                scene.background = scene.environment = nextMap;
            }
            //self.nightScene.material = self.nightSky.nebulaMaterial
            //
            // pmremGenerator.dispose();

            //     scene.environment = envMap;


        }

        self.update();

        //            scene.background = scene.environment = pmremGenerator.fromScene(self.nightScene || sky).texture;

        world.defcmd('sky', (p)=>{

            let gseed = NebulaMaterial.genSeed
            if (p[1]) {
                NebulaMaterial.rng.seed = parseFloat(p[1])
                self.update(NebulaMaterial.rng.seed)
            }
            world.docmd('info', '' + gseed)
        }
        )

        document.addEventListener('generate-nebula', (e)=>{
            self.update(e.detail.seed)
        }
        )
        let triggerUpdate=(newSeed)=>{
			document.dispatchEvent(new CustomEvent('generate-nebula',{detail:{seed:newSeed}}))
        }
        document.addEventListener('define-commands', (e)=>{
        	e.detail.commands.neb=(e)=>{
        		if(e[1]==undefined)world.docmd('info', '' + NebulaMaterial.genSeed);
        		else triggerUpdate(parseFloat(e[1]||0))
        	}
        });
        document.addEventListener('keydown', (e)=>{
            if (e.code == 'BracketLeft') {
                effectController.elevation += 1;
                triggerUpdate(effectController.elevation)

            } else if (e.code == 'BracketRight') {
                effectController.elevation -= 1;
                triggerUpdate(effectController.elevation)
            }
        }
        )
    }
    )

}
