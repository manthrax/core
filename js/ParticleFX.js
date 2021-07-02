import * as THREE from './three.module.js'

import { noise, curl } from './Noise.js'
/* eslint-disable */

class ShaderParams
{
    add(paramName,type,value){
        let u = this.uniforms[paramName]={type,value}
        Object.defineProperty(this, paramName, {
          get: function() { return this.uniforms[paramName].value },
          set: function(v) {
          let u=this.uniforms[paramName]
              if(u.type=='f')u.value = v;
              else u.value.copy(v)
          }
        });
        this[paramName] = value 
    }
    constructor(uniforms){
        this.uniforms=uniforms
    }
}



let shdrCt = 0
let globalRollUniform = {
    value: 0
}
let tv0 = new THREE.Vector3()

export default class ParticleFX extends THREE.Mesh {
    constructor(params={}) {
        let def = {
            count: 1000,
            area: 400,
            size: 150,
            map: null,
            colorVariation: 0.9,
            sizeVariation: 0,
            spinVariation: 0,
            minSpin: 0,
            depthTest: true,
            depthWrite: true,
            blending: THREE.AdditiveBlending,

            speed:1,
            duration:Infinity,
            startTime:0,

        }
        let loadTexture = (name)=>new THREE.TextureLoader().load(name)
        for (let f in def)
            if (params[f] == undefined)
                params[f] = def[f]

        params.mapSrc && (params.map = loadTexture(params.mapSrc))

        let {count, //
        area, //
        blending, //
        opacity, //
        size, //
        colorVariation, sizeVariation, spinVariation, minSpin, map, color, particleTexture, //
        particleTextureWidth, depthWrite, depthTest, redAsAlpha, motionFn, colorFn, genFn,//
        speed,duration,startTime} = params

        if (particleTextureWidth)
            count = particleTextureWidth * particleTextureWidth
        //count = 1000;

        let {sin, cos, random} = Math
        let rnd = (rng=1)=>random() * rng

        let srnd = (rng=1)=>(random() - 0.5) * (rng * 2)

        let br = 1
        let bg = 1
        let bb = 1

        let vel = 10

        let index = []
        let sz = 0.;

        //count = 5;

        let generateQuadGeometry = (count,genFn=ParticleFX.getPoint)=>{
            let vertices = []
            let colors = []
            let data = []
            let uvs = []
            let vec = new THREE.Vector4()

            //count = (count/2)|0
            for (let i = 0; i < count; i++) {
                genFn(vec, i)

                let x = vec.x * area
                let y = vec.y * area
                // 0.25) + area * 0.05 + size * 0.5
                let z = vec.z * area
                let w = THREE.MathUtils.randFloatSpread(1000)

                let sx = sz;
                let sy = sz;
                if (Math.random() < .5)
                    sx *= -1;
                else if (Math.random() < .5)
                    sy *= -1;
                if (particleTexture) {
                    x = (i % particleTextureWidth) / particleTextureWidth;
                    y = Math.floor(i / particleTextureWidth) / particleTextureWidth
                }
                vertices.push(x, y, z, w)
                vertices.push(x, y, z, w)
                vertices.push(x, y, z, w)
                vertices.push(x, y, z, w)
                /*
                } else {
                    vertices.push(x - sx, y, z + sy, w)
                    vertices.push(x - sx, y, z - sy, w)
                    vertices.push(x + sx, y, z - sy, w)
                    vertices.push(x + sx, y, z + sy, w)
                }
*/
                uvs.push(0, 0)
                uvs.push(1, 0)
                uvs.push(1, 1)
                uvs.push(0, 1)
                colors.push(br - rnd(colorVariation), bg - rnd(colorVariation), bb - rnd(colorVariation), 1)
                colors.push(br - rnd(colorVariation), bg - rnd(colorVariation), bb - rnd(colorVariation), 1)
                colors.push(br - rnd(colorVariation), bg - rnd(colorVariation), bb - rnd(colorVariation), 1)
                colors.push(br - rnd(colorVariation), bg - rnd(colorVariation), bb - rnd(colorVariation), 1)

                let i4 = i * 4;
                index.push(i4, i4 + 1, i4 + 2, i4 + 2, i4 + 3, i4 + 0)
                let v = srnd(vel)
                let v1 = srnd(vel)
                let sv = srnd(sizeVariation) + size
                let spinvar = srnd(spinVariation) + minSpin * (srnd() < 0 ? -1 : 1)
                spinvar *= 5;
                for (let j = 0; j < 4; j++)
                    data.push(v, sv, v1, spinvar)
            }
            let geometry = new THREE.BufferGeometry()

            //for (let i = 0; i < count; i++) 
            geometry.setAttribute('data', new THREE.Float32BufferAttribute(data,4))
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices,4))
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(vertices.length * 3 / 4),3))
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors,4))
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs,2))
            geometry.setIndex(index)
            geometry.attributes.position.usage = THREE.StaticDrawUsage
            // geometry.computeVertexNormals()
            geometry.addGroup(0, count * 2, 0)

            return geometry;
        }
        let geometry = generateQuadGeometry(count, genFn)

        let min = (x,y)=>(x < y ? x : y)
        let max = (x,y)=>(x > y ? x : y)
        let smod = (p,o,r)=>{
            let d = p - o
            if (d < -r)
                d = -(((-d + r) % (r * 2)) - r)
            else if (d > r)
                d = ((d + r) % (r * 2)) - r
            return d + o
        }

        let shader

        let self

        let material = new THREE.MeshBasicMaterial({
            //'white',
            transparent: true,
            side: THREE.DoubleSide,
            //vertexColors: THREE.VertexColors,
            map,
            opacity,
            color,
            blending,
            //,
            depthTest,
            depthWrite,
            //vertexColors: true,
        })

        material.customProgramCacheKey = function(id, ck) {
            let str = '' + id;
            return function() {
                return str + ck;
            }
        }(++shdrCt, material.customProgramCacheKey())
        function injectShader(shdr, renderer) {

            //console.log('Recompile:', this.customProgramCacheKey())
            let {particleTexture, area, redAsAlpha} = this.userData.params;

            //let chunks = THREE.ShaderChunk;
            shdr.vertexShader = `
attribute vec4 data;
uniform float time;
uniform float startTime;
uniform float roll;
uniform float speed;
uniform float duration;

varying vec4 vdata;
varying float etime;




${noise}
${curl}



mat4 dumbTranspose(mat4 m) {
  return mat4(m[0][0], m[1][0], m[2][0], m[3][0],
              m[0][1], m[1][1], m[2][1], m[3][1],
              m[0][2], m[1][2], m[2][2], m[3][2],
              m[0][3], m[1][3], m[2][3], m[3][3]);
}


${particleTexture ? `uniform sampler2D particleTexture;
` : ``}
` + shdr.vertexShader

            shdr.vertexShader = shdr.vertexShader.replace('#include <begin_vertex>', `
//#include <begin_vertex>

etime = min(duration,(time-startTime) * speed );
float ang = etime * data.w;
vec2 vuv=(uv-.5)*2.;
vec2 sc = vec2(sin(ang),cos(ang));
vec2 ncs = vec2(-sc.y,sc.x);
vuv = (vuv.x*sc)+(vuv.y*ncs);
vuv *= data.y;                                      //SPRITE SCALE

mat4 mv = dumbTranspose(modelViewMatrix); //viewMatrix;//modelViewMatrix;//
vec3 vx = mv[0].xyz;
vec3 vy = mv[1].xyz;

${(particleTexture) ? `  //        GPU FEEDBACK PARTICLES
vdata = texture2D(particleTexture,position.xy);
vec3 transformed = vdata.xyz + (vuv.x*vx) + (vuv.y*vy);    // vdata.xyz + vec3(vuv.x,0.,vuv.y);
` : `                    //        VERTEX SHADER PARTICLES
vdata = vec4(position,.5);
sc = vec2(sin(roll),cos(roll));
ncs = vec2(-sc.y,sc.x);
vec3 pos = vec3(vdata.x,0.,0.)+vec3(0.,(sc*vdata.y)+(ncs*vdata.z));

${motionFn || ''}

vec3 transformed = pos + (vuv.x*vx) + (vuv.y*vy);    //vec3(vuv.x,0.,vuv.y);
`}

            `)
            shdr.fragmentShader = `
                varying vec4 vdata;
                varying float etime;
            ` + shdr.fragmentShader
            shdr.fragmentShader = shdr.fragmentShader.replace(`gl_FragColor`, `
   ${redAsAlpha ? `diffuseColor.a = diffuseColor.r;` : ``}
   ${(particleTexture) ? `diffuseColor.a *= smoothstep(abs(vdata.w-.5),1.,.5);` : ``}


   ${colorFn ? colorFn : ``}
gl_FragColor`)

            let u = self.shaderParams = new ShaderParams( shdr.uniforms )

            if (particleTexture)
                shdr.uniforms.particleTexture = particleTexture
            u.add('time','f',0)
            u.add('startTime','f',startTime)
            u.add('speed','f',speed)
            u.add('duration','f',duration)
            u.add('localCameraPosition','vec3',new THREE.Vector3())
            u.add('volumeSize','vec3',new THREE.Vector3(area * 2,area * 0.025,area * 2))
        }
        material.userData.params = params
        material.onBeforeCompile = injectShader
        super(geometry, material)

        self = this
        
        this.frustumCulled = false
        this.material.size = size
        this.onBeforeRender = function(renderer, scene, camera) {
            if(this.shaderParams){
                this.shaderParams.time = performance.now() / 1000
                this.shaderParams.localCameraPosition = this.worldToLocal(camera.localToWorld(tv0.set(0, 0, 0)))
            }
        }

        this.generateQuadGeometry = generateQuadGeometry

    }
}

ParticleFX.getPoint = function(vec) {
    var u = Math.random();
    var v = Math.random();
    var theta = u * 2.0 * Math.PI;
    var phi = Math.acos(2.0 * v - 1.0);
    var r = Math.cbrt(Math.random());
    var sinTheta = Math.sin(theta);
    var cosTheta = Math.cos(theta);
    var sinPhi = Math.sin(phi);
    var cosPhi = Math.cos(phi);
    vec.x = r * sinPhi * cosTheta;
    vec.y = r * sinPhi * sinTheta;
    vec.z = r * cosPhi;
    return vec;
}
