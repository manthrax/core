import {createCanvas} from './CanvasUtil.js'

export default function PixelInspector(THREE, sourceTexture) {
    let fontSz = 105;
    //25;
    let canv = createCanvas(1024, fontSz);
    let ctex = new THREE.CanvasTexture(canv);
    ctex.wrapS = ctex.wrapT = THREE.RepeatWrapping;
    ctex.minFilter = THREE.NearestFilter;
    //ctex.magFilter = 
    let visMat = new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
            uSource: {
                value: sourceTexture
            },
            uMap: {
                value: ctex
            }
        }
    })
let sourceTextureWidth = sourceTexture.image.width;

    //document.body.appendChild(canv)

    visMat.vertexShader = `varying vec2 vUv;
    ` + visMat.vertexShader.replace('gl_Position', `
    vUv=uv;
    gl_Position`);
    visMat.fragmentShader = `
    varying vec2 vUv;
    uniform sampler2D uSource; 
    uniform sampler2D uMap;
    ` + visMat.fragmentShader.replace('gl_FragColor', `
vec2 tuv = fract((1.-vUv)*${sourceTextureWidth}.);
vec4 src = texture2D(uSource,vUv);

vec2 colrow = tuv*8.;
vec2 ftile = fract(colrow);
int row = int(colrow.y);
int col = int(colrow.x);
vec4 map;
//if(row==(col/2)){ 
if(colrow.y<1.){
    vec3 tint;
    int r=int(src.r*255.999);
    int g=int(src.g*255.999);
    int b=int(src.b*255.999);
    int a=int(src.a*255.999);
    int hx=-1;
    if(col<2) {tint=vec3(1.,0.,0.);hx = (col==0)?r/16:r&15;}
    else if(col<4) {tint=vec3(0.,1.,0.);hx = (col==2)?g/16:g&15;}
    else if(col<6)  {tint=vec3(0.,0.,1.);hx = (col==4)?b/16:b&15;}
    else {tint=vec3(1.);hx = (col==6)?a/16:a&15;}

float tx = (float(hx)/16.0)+(ftile.x/16.) + -.007;
float ty = (ftile.y*.8) + .15;
    map = texture2D(uMap,vec2(tx,ty));
    map.rgb *= tint;
    //map.a=1.;
}

    gl_FragColor=mix(src,map,map.a);
    gl_FragColor.a=src.a;

    //gl_FragColor`);
    let map = visMat.uniforms.uMap.value;
    map.flipY = false;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    //map.minFilter = map.magFilter = THREE.NearestFilter;
    let ctx = canv.ctx;
    ctx.fillStyle = 'red'
    ctx.clearRect(0, 0, canv.width, canv.height)
    //ctx.fillRect(0,0,canv.width,canv.height)

    //ctx.font = fontSz + "px lucida console"
    ctx.font = fontSz+"px Courier";
    ctx.strokeStyle = 'black'
    let py = (fontSz * .85) | 0
    ctx.lineWidth = 8;
    ctx.strokeText('0123456789ABCDEF', 2, py)
    ctx.fillStyle = 'white'
    ctx.fillText('0123456789ABCDEF', 2, py)

    /*
            let idat = map.image.idat();
            let rnd = Math.random;
            for (let i = 0; i < idat.data.length; i++)
                idat.data[i] = (rnd() * 255.99) | 0;
            ctx.putImageData(idat, 0, 0);
*/

    //visMat = new THREE.MeshBasicMaterial({side:THREE.DoubleSide,transparent:true,map:gb.renderTarget.texture});
    let visMesh = new THREE.Mesh(new THREE.PlaneGeometry(500,500),visMat);
    visMesh.rotation.x = Math.PI * .5;
    return visMesh;
    //visMesh.material.map.encoding = THREE.sRGBEncoding;
}
