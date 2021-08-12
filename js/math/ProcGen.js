import*as THREE from "https://threejs.org/build/three.module.js";
let {abs, sin, min, max} = Math;
let texLoader = new THREE.TextureLoader()
let loadTextureSet = (root)=>{
    let mts = ['-albedo', '-ao', '-normal-ogl', '-metallic', '-roughness']
    return Promise.all(mts.map(e=>new Promise((resolve,reject)=>{
        texLoader.load(root + e + '.png', (tex)=>{
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping
            resolve(tex)
        }
        )
    }
    )))
}

let loadMaterial = (root)=>new Promise((resolve,reject)=>loadTextureSet(root).then(maps=>{
    resolve(new THREE.MeshStandardMaterial({
        map: maps[0],
        aoMap: maps[1],
        normalMap: maps[2],
        metalnessMap: maps[3],
        roughnessMap: maps[4]
    }))
}
))

export default function ProcGen(scene){
    let primCfg=(box1,params)=>{
        let {px=0, py=0, pz=0, sx=1, sy=1, sz=1, tx=1, ty=1, tz=1, ox=0, oy=0, oz=0,s=1} = params || {}
        
        let pts = box1.geometry.attributes.position.array
        for (let p = 0; p < pts.length; p += 3) {
            pts[p] += ox;
            pts[p + 1] += oy;
            pts[p + 2] += oz;
        }
        let uvs = box1.geometry.attributes.uv.array
        let nml = box1.geometry.attributes.normal.array
        for (let u = 0, n = 0; u < uvs.length; u += 2,
        n += 3) {
            let nx = abs(nml[n])
            let ny = abs(nml[n + 1])
            let nz = abs(nml[n + 2])
            let dir = (nx > nz) ? ((nx > ny) ? 0 : 1) : ((ny > nz) ? 1 : 2)
            if (dir == 0) {
                uvs[u] *= sz * tz
                uvs[u + 1] *= sy * ty
            } else if (dir == 1) {
                uvs[u] *= sx * tx
                uvs[u + 1] *= sz * tz
            } else {
                uvs[u] *= sx * tx
                uvs[u + 1] *= sy * ty
            }
        }
        box1.position.set(px, py, pz)
        box1.scale.set(sx*s, sy*s, sz*s)
        box1.castShadow = box1.receiveShadow = true;
        return box1
    }
    let mkMesh=(params)=>{
        let {geom=new THREE.BoxBufferGeometry(),mat=new THREE.MeshStandardMaterial()}=params
        let mesh
        scene.add((mesh = new THREE.Mesh(geom,mat)));
        primCfg(mesh,params)
        return mesh
    }
    let mkBx = (params)=>{
        let mesh = mkMesh(params)
        return mesh
    }


    loadMaterial('./art/sci-fi-panel1-bl/sci-fi-panel1').then(mats1=>{
        loadMaterial('./art/spaceship-panels-bl/spaceship-panels1').then(mats2=>{
            //  mkBx({mat:mats1})
            mkBx({
                pz: 2,
                py: 0,
                s:.5,
                sx: 1,
                sy: 4,
                sz: 1,
                tx: 1,
                ty: 1,
                tz: 1,
                oy: .5,
                mat: mats1
            })


            //  scene.remove(box1);
            let testplane = new THREE.Mesh(new THREE.PlaneBufferGeometry(10,10),mats1);

            primCfg(testplane,{tx:15,ty:15})
           // testplane.position.y = -0.5;
            testplane.rotation.x = -Math.PI * 0.5;
            testplane.receiveShadow = true;
            scene.add(testplane);
        }
        )
    }
    )
}
