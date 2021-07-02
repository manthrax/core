import * as THREE from './three.module.js'
import ParticleFX from './ParticleFX.js'
import { noise, curl } from './Noise.js'

export default class GPUPoints extends ParticleFX {
  constructor(renderer, scene, camera, params = {}) {
    /*** FBO **/
    // verify browser agent supports "frame buffer object" features
    let gl = renderer.getContext()
    //debugger
    if (
      (!renderer.capabilities.isWebGL2 && !gl.getExtension('OES_texture_float')) ||
      gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) == 0
    ) {
      alert(' * Cannot create FBO :(')
    }

    // set initial positions of `w*h` particles
    let h = 256
    let w = h,
      i = 0,
      data = new Float32Array(w * h * 4)

    function getPoint(vec, normalize = true) {
      var u = Math.random()
      var v = Math.random()
      var theta = u * 2.0 * Math.PI
      var phi = Math.acos(2.0 * v - 1.0)
      var r = Math.cbrt(Math.random())
      var sinTheta = Math.sin(theta)
      var cosTheta = Math.cos(theta)
      var sinPhi = Math.sin(phi)
      var cosPhi = Math.cos(phi)
      vec.x = r * sinPhi * cosTheta
      vec.y = r * sinPhi * sinTheta
      vec.z = r * cosPhi
      normalize && vec.normalize()
      return vec
    }

    let vec = new THREE.Vector3()

    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        getPoint(vec)

        data[i++] = vec.x
        //x / w;
        data[i++] = vec.y
        //y / h;
        data[i++] = vec.z
        //0;
        data[i++] = Math.random() //vec.x + Math.sin(vec.y * 10.) * Math.cos(vec.z)
      }
    }
    let quads = (params.quads = params.quads || true)
    let motionFn = (params.motionFn = params.motionFn || curlswirl)
    // feed those positions into a data texture
    let dataTex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.FloatType)
    dataTex.minFilter = THREE.NearestFilter
    dataTex.magFilter = THREE.NearestFilter
    //    dataTex.needsUpdate = true;
    // add the data texture with positions to a material for the simulation
    let simMaterial
    let shaders
    let recompile = () => {
      shaders = generateShaders(params)
      simMaterial = new THREE.RawShaderMaterial({
        // `posMap` is set each render
        uniforms: {
          posTex: {
            type: 't',
            value: dataTex,
          },
          time: {
            type: 'f',
            value: 0,
          },
          //        prevFrame: { type: "t", value: null }
        },
        vertexShader: shaders.sim_vs,
        fragmentShader: shaders.sim_fs,
      })
    }
    recompile()
    // delete dataTex; it isn't used after initializing point positions
    //delete dataTex;
    dataTex.dispose()

    let PingPongFBO = function (simMat, w, h) {
      //debugger
      this.scene = new THREE.Scene()
      this.camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, -1, 1)
      this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(w, h), simMat))

      // create render targets a + b to which the simulation will be rendered
      this.renderTargetA = new THREE.WebGLRenderTarget(w, h, {
        wrapS: THREE.RepeatWrapping,
        wrapT: THREE.RepeatWrapping,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        stencilBuffer: false,
      })

      // a second render target lets us store input + output positional states
      this.renderTargetB = this.renderTargetA.clone()
    }

    // create a scene where we'll render the positional attributes
    let fbo = new PingPongFBO(simMaterial, w, h)

    //material = new THREE.PointsMaterial({size:.1,color:'red'});

    // add the points the user sees to the scene
    let posMapUniform = {
      type: 't',
      value: null,
    }

    let update = () => {
      // at the start of the render block, A is one frame behind B
      var oldA = fbo.renderTargetA
      // store A, the penultimate state
      fbo.renderTargetA = fbo.renderTargetB
      // advance A to the updated state
      fbo.renderTargetB = oldA
      // set B to the penultimate state
      // pass the updated positional values to the simulation
      simMaterial.uniforms.posTex.value = fbo.renderTargetA.texture
      simMaterial.uniforms.time.value = performance.now() / 1000

      //simMaterial.uniforms.prevFrame.value = this.frameBufferA.texture;
      renderer.setRenderTarget(fbo.renderTargetB)
      // run a frame and store the new positional values in renderTargetB
      renderer.render(fbo.scene, fbo.camera)
      //, renderTargetB, false);
      renderer.setRenderTarget(null)

      posMapUniform.value = fbo.renderTargetB.texture
      //material.uniforms && (material.uniforms.posMap.value = fbo.renderTargetB.texture);
      // pass the new positional values to the scene users see
    }

    let reset = () => {
      // render the starting positions to the render targets
      renderer.autoClearColor = false
      renderer.setRenderTarget(fbo.renderTargetA)
      renderer.render(fbo.scene, fbo.camera) //, renderTargetA, false);

      renderer.setRenderTarget(fbo.renderTargetB)
      renderer.render(fbo.scene, fbo.camera) //, renderTargetB, false);
      renderer.setRenderTarget(null)
      renderer.autoClearColor = true
    }
    if (quads) {
      let loadTexture = (name) => new THREE.TextureLoader().load(name)
      let p = {
        //             count:w*h,
        //map: loadTexture(cloudTex),
        particleTexture: posMapUniform,
        //material.uniforms.posMap,
        particleTextureWidth: w,

        //count: 10,
        area: 50,
        size: 0.003 * window.devicePixelRatio,
        opacity: 0.03,
        //0.275,
        spinVariation: 0.5,
        minSpin: 0.5,
        colorVariation: 0.0,
        //rotationVelocityFn: 'rotationVelocity *= 5.;',
        //velocityFn: 'velocity *= vec3(0.,2.,0.);//vec3(.2*sin(data.x*.25))+vec3(0.,1.,0.);',
        //        "https://cdn.glitch.com/1e65f0b3-ea59-444f-bab2-00bdacb611fb%2Ffog2.png?v=1617989308611"
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        color: 0x80fff0, //ccffff,
        redAsAlpha: true,
      }
      for (let f in params) p[f] = params[f]
      super(p)
      let mesh = this
      //.generateQuadGeometry((vec)=>{},w*h)
      //mesh.material = material;
      //            let mesh = this.mesh = new THREE.Points(geo,material);
      mesh.frustumCulled = false
      mesh.castShadow = mesh.receiveShadow = true
      //mesh.customDepthMaterial = material;
      scene.add(mesh)
      mesh.rotation.x = Math.PI * 0.5
      mesh.position.set(0, 3, 0)

      //clouds.position.set(3, 3, 0)
      //mesh.renderOrder = -1
      //this.mesh = mesh;
    } else {
      // create material the user sees
      let material = new THREE.RawShaderMaterial({
        uniforms: {
          posMap: posMapUniform, // `posMap` is set each render
        },
        vertexShader: shaders.ui_vert,
        fragmentShader: shaders.ui_frag,

        transparent: true,

        alphaTest: 0.5,

        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      })

      // store the uv attrs; each is x,y and identifies a given point's
      // position data within the positional texture; must be scaled 0:1!
      var geo = new THREE.BufferGeometry(),
        arr = new Float32Array(w * h * 3)
      for (let i = 0, j = 0; i < arr.length; j++) {
        arr[i++] = (j % w) / w
        arr[i++] = Math.floor(j / h) / h
        arr[i++] = 0
      }
      geo.setAttribute('position', new THREE.BufferAttribute(arr, 3, true))

      let mesh = (this.mesh = new THREE.Points(geo, material))
      mesh.frustumCulled = false
      mesh.castShadow = mesh.receiveShadow = true
      //mesh.customDepthMaterial = material;
      scene.add(mesh)
    }
    this.update = update

    this.recompile = recompile
    this.reset = reset
    this.reset()
  }
}

let curlswirl = `
float st2 = min(0.,sin(time*3.)*2.)-1.;
vec3 cn = curlNoise(pos.xyz*5.)*.1;      //Particle MOTION
pos.xyz += cn*.01;//mix(cn,trackn,fract(st2))*.1;
float len = length(pos.xyz);
//vec3  trackPoint = vec3(st2)*5.;
//vec3 trackn = (pos.xyz-trackPoint)*-(.01*pos.w);
//float bounceMag = 1.;
//if(len>1.)pos.xyz = pos.xyz + ( pos.xyz * ((1.-len)*bounceMag) );
pos.xyz = normalize(pos.xyz);


//pos.y += .01;

//pos.x += min(0.,sin(time)*.1);
//pos.y += sin(pos.x) / rate;
//pos.z += sin(-pos.z) / rate;
    
    
    //if(rand(pos.xz)>.999){
    //  vec2 rv = (vec2(rand(pos.xy),rand(pos.yx))-.5)*.01;
    //  pos.xy+=rv;
    //}
  
  
  
float domainsize=.05;
pos.xyz = (fract((pos.xyz*domainsize)+.5)-.5)/domainsize;

pos.w *= .99;
if(pos.w<0.001){
  pos.xyz = normalize(vec3(rand(pos.xy),rand(pos.yz),rand(pos.zx))-.5);
  pos.w = 1.;
}
`

let generateShaders = (params) => {
  let { quads, motionFn } = params
  let sim_vs = `
precision mediump float;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

attribute vec2 uv; // x,y offsets of each point in texture
attribute vec3 position;
varying vec2 vUv;
void main() {
  vUv = vec2(uv.x, uv.y);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

  let sim_fs = `
precision mediump float;
uniform sampler2D posTex;
uniform float time;

varying vec2 vUv;
float rand(vec2 co){
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

${noise}

${curl}

void main() {
  vec4 pos = texture2D(posTex, vUv);    // read the supplied x,y,z vert positions
  
${motionFn}


  gl_FragColor = pos;      // render the new positional attributes
}`
  /*
    //<!-- The ui shaders render what the user sees -->
    let ui_vert = `
precision mediump float;
uniform sampler2D posMap; // contains positional data read from sim-fs
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
attribute vec2 position;
${quads ? `attribute vec2 uv;
 varying vec2 vuv;
 ` : ``}
varying vec4 wpos;
void main() {
  vec4 pos = texture2D(posMap, position.xy);  // read this particle's position, which is stored as a pixel color

float domainsize=.05;
pos.xyz = (fract((pos.xyz*domainsize)+.5)-.5)/domainsize;
  
  
  vec4 mvPosition = modelViewMatrix * vec4(pos.xyz, 1.0);   // project this particle
  gl_Position = projectionMatrix * mvPosition;
  

  wpos = pos;
  
${quads ? `vuv=uv-.5;` : `gl_PointSize = (160.*pos.w)/ -mvPosition.z;   // set the size of each particle`}

}`;

    let ui_frag = `
precision mediump float;

varying vec4 wpos;

 
${quads ? `varying vec2 vuv;` : ``}

void main() {

${quads ? `vec2 vec=vuv;` : `
  vec2 vec = gl_PointCoord.xy-.5;
`}
 
  float c = min(length(vec)*2.,1.);
  float f = smoothstep(1.,.95, c);
  
  
  gl_FragColor = vec4(vec3(1.-c), f);
  gl_FragColor *= vec4(.3,.9,.8,1.);//fract(vec4(sin(wpos.a*7.),cos(wpos.a*5.),cos(wpos.a*4.),.99));
  
 gl_FragColor *= .7;

if(f<.1)discard;
//  gl_FragColor = vec4((1.-c)*.5);
//  if(f<.1)discard;
}`;
*/
  return {
    //ui_frag,
    //ui_vert,
    sim_vs,
    sim_fs,
  }
}
