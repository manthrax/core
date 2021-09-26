//import * as THREE from 'https://threejs.org/build/three.module.js';

import * as THREE from "https://threejs.org/build/three.module.js";
let shdrCt = 0;
export default class Clouds extends THREE.Points {
  constructor(params) {
    let def = {
      count: 10000,
      area: 400,
      size: 150,
      colorVariation: 0.9,
      sizeVariation: 0,
      spinVariation: 0,
      velocityFn: `velocity = vec3(0.);`,
      rotationVelocityFn: `rotationVelocity *= 1.;`
    };
    for (let f in def) if (params[f] == undefined) params[f] = def[f];
    let {
      count,
      area,
      blending,
      velocityFn,
      rotationVelocityFn,
      opacity,
      size,
      colorVariation,
      sizeVariation,
      spinVariation,
      map
    } = params;

    let vertices = [];
    let colors = [];
    let data = [];

    let { sin, cos, random } = Math;
    let rnd = (rng = 1) => random() * rng;
    let srnd = (rng = 1) => (random() - 0.5) * (rng * 2);

    let br = 1; //65/255
    let bg = 1; //72/255
    let bb = 1; //97/255

    let vel = 10;

    for (let i = 0; i < count; i++) {
      let x = THREE.MathUtils.randFloatSpread(area * 2);
      let y =
        THREE.MathUtils.randFloatSpread(area * 0.25) + area * 0.05 + size * 0.5;
      let z = THREE.MathUtils.randFloatSpread(area * 2);
      let w = THREE.MathUtils.randFloatSpread(1000);
      vertices.push(x, y, z, w);
      colors.push(
        br - rnd(colorVariation),
        bg - rnd(colorVariation),
        bb - rnd(colorVariation),
        1
      );
      data.push(
        srnd(vel),
        srnd(sizeVariation) + size,
        srnd(vel),
        srnd(spinVariation)
      );
    }
    let geometry = new THREE.BufferGeometry();

    for (let i = 0; i < count; i++)
      geometry.setAttribute("data", new THREE.Float32BufferAttribute(data, 4));
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 4)
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 4));
    geometry.attributes.position.usage = THREE.StaticDrawUsage;
    let material = new THREE.PointsMaterial({
      color: 0xffffff,
      transparent: true,
      blending: blending || THREE.NormalBlending,
      depthWrite: false,
      vertexColors: THREE.VertexColors,
      opacity: (opacity !== undefined && opacity) || 1
      //dithering:true
    });
    map && (material.map = map)
    material.userData.params = params;
    material.defines = { version: ++shdrCt };
    let shader;
    material.onBeforeCompile = function(shdr) {
      /*
          shdr.defines={version:shdrCt}
          shdr.customProgramCacheKey = function(id){
            return ''+id;
          }(++shdrCt)
          */

      //console.log("Recompile:", shdr.defines);
      shader = shdr;
      shdr.uniforms.time = { value: 0 };
      shdr.uniforms.localCameraPosition = { value: new THREE.Vector3() };
      shdr.uniforms.volumeSize = {
        value: new THREE.Vector3(area * 2, area * 0.25, area * 2)
      };
      shdr.vertexShader = shdr.vertexShader.replace(
        `#include <begin_vertex>`,
        `
vec3 transformed = vec3( position );
float y=transformed.y;
vec3 groundCamPosition = localCameraPosition;
groundCamPosition.y = 0.;
vec3 velocity = vec3(data.x,0,data.z);
${velocityFn}
transformed = (transformed+(velocity*time)) - groundCamPosition;
transformed = transformed / volumeSize;
transformed = (fract(transformed)-.5);
vec3 normalizedPos = transformed;
transformed = transformed*volumeSize;
transformed+=groundCamPosition;
//transformed.y = y;
`
      );
      shdr.vertexShader =
        `
attribute vec4 data;
varying vec4 vData;
uniform vec3 localCameraPosition;
uniform vec3 volumeSize;
uniform float time;
varying float vFade;
` +
        shdr.vertexShader.replace(
          "#include <fog_vertex>",
          `
#include <fog_vertex>
vData = data;


float len = length(normalizedPos.xyz);

vFade=1.-smoothstep(.25,.5,len);


//vColor.xyz *= vFade;
gl_PointSize *= vData.y;
//gl_PointSize /= length(normalizedPos.xz)+.75;
`
        );
      shdr.fragmentShader =
        `
uniform float time;
varying vec4 vData;
varying float vFade;
` + shdr.fragmentShader;
      let ck = THREE.ShaderChunk["map_particle_fragment"];
      //ck=ck.replace('uvTransform','uvRot * uvTransform ');
      let tok = "vec2 uv = ";

      ck = ck.replace("gl_PointCoord", "pos").replace("gl_PointCoord", "pos");
      ck = ck.replace(
        tok,
        `
float rotationVelocity = vData.w;
rotationVelocity *= time;
${rotationVelocityFn}
diffuseColor.a=min(diffuseColor.a,vFade);
float sc = sin(rotationVelocity);
float cc = cos(rotationVelocity);
mat3 uvRot = mat3(sc,cc,0.,cc,-sc,0.,0.,0.,1.);
vec3 pos = ((vec3(gl_PointCoord,0.)-.5)*uvRot)+.5;
` + tok
      );
      shdr.fragmentShader = shdr.fragmentShader.replace(
        "#include <map_particle_fragment>",
        ck
      );
    };

    super(geometry, material);
    this.frustumCulled = false;
    this.renderOrder = 5;
    this.material.size = size;
    let min = (x, y) => (x < y ? x : y);
    let max = (x, y) => (x > y ? x : y);
    let smod = (p, o, r) => {
      let d = p - o;
      if (d < -r) d = -(((-d + r) % (r * 2)) - r);
      else if (d > r) d = ((d + r) % (r * 2)) - r;
      return d + o;
    };
    this.onBeforeRender = function(renderer, scene, camera) {
      if (!shader) return;
      shader.uniforms.time.value = performance.now() / 1000;
      this.worldToLocal(
        camera.localToWorld(
          shader.uniforms.localCameraPosition.value.set(0, 0, 0)
        )
      );

    };
  }
}
