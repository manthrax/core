import { Line2 } from 'https://threejs.org/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'https://threejs.org/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'https://threejs.org/examples/jsm/lines/LineGeometry.js';


let mat0,mat1;
let boxGeom,sphereGeom,planeGeom;

export default function StarTools(THREE){

function LoadGame(//fn="assets/gtest.txt") {
    fn="assets/01_STNC_galaxy_700.txt"){
    return new Promise((resolve,reject)=>{
        fetch(fn).then(res=>res.text().then(txt=>{
            let lines = txt.replaceAll('\r', '').replaceAll('\t', '').split('\n').filter((e)=>e.length && (e.indexOf("###") != 0));
            let tokenize = (s)=>{
                let toks = []
                let tok = ''
                let inQuote = false;
                for (let i = 0; i < s.length; i++) {
                    let c = s.slice(i, i + 1);
                    if (c == '"') {
                        inQuote = !inQuote;
                        if (!inQuote)
                            toks.push(tok);
                        tok = ''
                    } else if ((!inQuote) && ((c == ' ')||(c=='='))) {
                        tok.length && toks.push(tok);
                        (c=='=') && toks.push('=')
                        tok = ''
                    } else
                        tok += c;
                }
                tok.length && toks.push(tok);
                return toks;
            }

            let root = {}
            let obj = root;
            let sym
            let symstack = []
let hadAssignment = false;
            let traverse = (toks,idx)=>{
                for (let i = 0; i < toks.length; i++) {
                    let t = toks[i];
                    if (t == '{') {
                        symstack.push(obj);
                        let nobj={}
                        if (!obj[sym])  obj[sym] = obj = nobj;
                        else{
                            if(!(obj[sym] instanceof Array))
                                obj[sym]=[obj[sym]]
                            obj[sym].push(nobj)
                            obj=nobj;
                        }
                        sym = null
                    } else if (t == '}') {
                        obj = symstack.pop()
                    } else if (t == '='){
                        hadAssignment = true;
                        continue;
                    }else if (!sym){
                        sym = t;
                    }else  {
                        let it=parseInt(t);
                        if(!isNaN(it))t=it;
                        if(hadAssignment){
                            obj[sym] = t;
                            hadAssignment = false;
                        }else{
                            hadAssignment = false;
                        
                        }
                        sym = null;
                    }
                }
            }
            let tokens = lines.map(tokenize);
            tokens.forEach(traverse);

            resolve(root)
        }
        ))
    }
    );
}

let mat0 = new THREE.MeshStandardMaterial({
  //wireframe: true,
   // map: new THREE.TextureLoader().load('../../ion-trail/assets/mats/spark1.png'), //scifitiles/78468-MetalTileFloor.jpg'),
    metalness: .7,
    roughness: .7,
    color: 0xffffff,
  //  transparent:true,
  //  opacity:.7,
  //  side:THREE.DoubleSide,
   // depthWrite:false,
  //  blending:THREE.AdditiveBlending
})
let mat1 = mat0.clone()
//mat1.blending = THREE.AdditiveBlending
let planeGeom = new THREE.PlaneBufferGeometry(.5,.5)
let sphereGeom = new THREE.SphereBufferGeometry(.5,16,8)
let boxGeom =  new THREE.BoxBufferGeometry(1,1,1)



let tobj = new THREE.Object3D();
let tbox = new THREE.Mesh(sphereGeom,mat1.clone())
tbox.material.blending = THREE.AdditiveBlending
tbox.material.side = THREE.BackSide
//scene.add(tbox)

let nv3 = (x,y,z)=>new THREE.Vector3(x,y,z)

let zmargin = nv3(.4,.4,.4)

document.addEventListener('object-clicked',(e)=>{
    let hit = e.detail.object;

    if((hit.instanceId!==undefined) && (hit.object.name=='starmap')){
        hit.object.getMatrixAt(hit.instanceId,tobj.matrix);
        tobj.matrix.decompose(tbox.position,tbox.quaternion,tbox.scale)
        tbox.scale.add(zmargin)
        hit.object.add(tbox)

    	document.dispatchEvent(new CustomEvent('generate-nebula',{detail:{seed:tbox.position.x+tbox.position.y-tbox.position.z}}))
    }
})

let t0=nv3()


function buildVis(scene,voxPoints,voxSz,voxClr){
let mclone = mat0;
mclone.onBeforeCompile=(shader,renderer)=>{
    console.log(shader.fragmentShader)
}
    const mesh = new THREE.InstancedMesh(planeGeom,mclone,voxPoints.length);
    const matrix = new THREE.Matrix4();
    let c4 = new THREE.Color()
    voxPoints.forEach((v,i)=>{
        let sz = voxSz[i];
        sz.multiplyScalar(2.5);
        matrix.elements = [sz.x, 0, 0, 0, 0, sz.y, 0, 0, 0, 0, sz.z, 0, v.x, v.y, v.z, 1]
        mesh.setMatrixAt(i, matrix);
        mesh.setColorAt(i, c4.set((Math.random()*0x1000000)|0))
    }
    )
    mesh.instanceColor && (mesh.instanceColor.needsUpdate = true)
    scene.add(mesh)

    //mesh.scale.multiplyScalar(1)
    mesh.position.y -= 2;
    mesh.name = 'starmap'
    return mesh;
}

function LoadSavedGame(fn,scene){
    return LoadGame(fn).then(game=>{
        console.log(game)
        let go = game.galactic_object || {};
        let arr = []
        for(let k in go){
            let g = go[k];
            arr[k]=go[k]
        }
    let voxPoints=[]
    let voxRot=[]
    let voxSz=[]
    let hLines = []


        arr.forEach(e=>{
            let c = nv3(e.coordinate.x,0,e.coordinate.y)
            e.coordinate && voxPoints.push(c) && voxSz.push(nv3(10,10,10)) && voxRot.push(0,0,0)
            if(e.hyperlane){
                if(e.hyperlane.null instanceof Array)
                    e.hyperlane.null.forEach(lane=>{
                        let he = arr[lane.to];
                        let c1 = nv3(he.coordinate.x,0,he.coordinate.y)
                        hLines.push(c.clone(),c1);                
                    })
                else{
                    let he = arr[e.hyperlane.null.to];
                    let c1 = nv3(he.coordinate.x,0,he.coordinate.y)
                    hLines.push(c.clone(),c1);
                }
            }
        })
        //voxPoints.forEach(v=>v.multiplyScalar(10))
        //hLines.forEach(v=>v.multiplyScalar(10))
        let m = buildVis(scene,voxPoints,voxSz);
        //m.geometry = new THREE.BoxBufferGeometry(1,1,1);
        //m.position.y += 50;
        m.material = mat0;



if(hLines.length){

 //   const geometry = new THREE.BufferGeometry().setFromPoints( hLines );

 //   m.add(new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:'white',blending:THREE.AdditiveBlending,transparent:true})))


    const mesh = new THREE.InstancedMesh(boxGeom,mat1,hLines.length/2);

    for(let i=0,j=0;i<hLines.length;i+=2,j++){
        tobj.position.copy(hLines[i+0]).add(hLines[i+1]).multiplyScalar(.5)
        let len = tobj.scale.copy(hLines[i+1]).sub(hLines[i+0]).length();
        tobj.scale.set(1,1,len);
        tobj.lookAt(hLines[i+1]);
        tobj.updateMatrix();
        mesh.setMatrixAt(j, tobj.matrix);
    }
    m.add(mesh)
/*


    const geometry = new LineGeometry();
    geometry.setPositions( hLines );
    //geometry.setColors( colors );

    matLine = new LineMaterial( {

        color: 0xffffff,
        linewidth: 5, // in pixels
        //vertexColors: true,
        //resolution:  // to be set by renderer, eventually
        dashed: false,
        alphaToCoverage: true,

    } );

    let line = new Line2( geometry, matLine );
   // line.computeLineDistances();
    line.scale.set( 1, 1, 1 );
    m.add( line );
*/





}

        return m;
    })
}

function LoadScenario(fn,scene){
return LoadGame(fn).then(game=>{
    console.log(game)
    let voxPoints=[]
    let voxSz=[]
    let region=(s)=>{
        let rad = s.radius!==undefined?s.radius:1.
        if(s.position.x.min!==undefined){
            let vmin = nv3(s.position.x.min,0,s.position.y.min)
            let vmax = nv3(s.position.x.max,0,s.position.y.max)
            let cent = nv3().copy(vmin).add(vmax).multiplyScalar(.5)
            voxPoints.push(cent)
            voxSz.push(vmax.sub(vmin).multiplyScalar(.5).add(nv3(rad,rad,rad)))
        }else{
            let vmin = nv3(s.position.x,0,s.position.y)
            voxPoints.push(vmin)
            voxSz.push(nv3(rad+.1,rad+.1,rad+.1))
        }
    }

    game.static_galaxy_scenario.system.forEach(e=>region(e))
    let m = buildVis(scene,voxPoints,voxSz);

   
    game.static_galaxy_scenario.nebula.forEach(e=>region(e))
    let m1 = buildVis(scene,voxPoints,voxSz);
    
    return m1;
})
}
return {LoadGame,LoadScenario,LoadSavedGame}
}
