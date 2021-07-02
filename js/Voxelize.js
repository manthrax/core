
let nv3;
let {min, max, abs, floor, PI, random} = Math;
let vmax = (da)=>max(abs(da.z), max(abs(da.x), abs(da.y)))
let trunc = (v)=>v.set(floor(v.x + .5), floor(v.y + .5), floor(v.z + .5))

function VX(THREE){
    let vox={}
    let size=[0,0,0]
    let map={}
    let row=0;
    let slab=0;
    let vol = 0;
    let addr;
    let p=[0,0,0]
    vox.size=(x,y,z)=>(size=[x,y,z])&&(vol=x*y*z)&&(row=x)&&(slab=x*y)
    let valid=(x,y,z)=>(x>-1&&x<size[0])&&(y>-1&&y<size[1])&&(z>-1&&z<size[2]);
    vox.setxyz=(x,y,z,v)=>valid(x,y,z) && (addr=x+(y*row)+(z*slab))&&((v&&(map[addr]=v))||(delete map[addr]))
    vox.getxyz=(x,y,z,v)=>(valid(x,y,z) && ((addr=x+(y*row)+(z*slab))&&map[addr])) || undefined
    let k2ap = (k,a)=>{a[0]=(k % size[0]);a[1]= ((k / row) % size[1]) | 0;a[2]=(k / slab) | 0;return a}
    vox.allxyz=(fn)=>{
        for(let i=0;i<vol;i++) k2ap(i,p)&&fn(p[0],p[1],p[2],map[i]);
    }
    vox.occupiedxyz=(fn)=>{
        let keys = Object.keys(map).map(e=>+e);
        keys.forEach(k=>k2ap(k,p)&&fn(p[0],p[1],p[2],map[k]))
    }
    return vox;
}

let WHITE = 0xffffff
let GRAY = 0x808080
let DKGRAY = 0x101010
let LTGRAY = 0xeeeeee
let RED = 0xff0000
let BLUE = 0x0000ff
let GREEN = 0x00ff00
let ORANGE = 0xff8000
let TRANSPARENT = undefined

export default class Vox {
    constructor(THREE) {
        this.THREE = THREE
        this.size = [0,0,0]
        this.voxMap = {};
        nv3 = (x,y,z)=>new THREE.Vector3(x,y,z)
    }
    voxelize(root, maxRow=256) {
        let { voxMap, size, THREE} = this;
        let c = root.clone(true);
        root.parent.add(c);

        let worldGeoms = []

        let bnds = new THREE.Box3().setFromObject(c)
        let bmin = bnds.min.clone()
        let sz = bnds.getSize(nv3())
        let maxSz = max(sz.x, max(sz.y, sz.z))
        let rescale = (maxRow - 1) / maxSz;

        c.scale.multiplyScalar(rescale)
        bnds.setFromObject(c)

        c.position.sub(bnds.min)
        c.updateMatrixWorld(true)
        c.traverse(e=>e.isMesh && worldGeoms.push(e.geometry.clone().applyMatrix4(e.matrixWorld)))



        let tris = []
        bnds.setFromObject(c)
        trunc(bnds.getSize(sz))


        let idTop = 0;
        let midx = []
        let mvts = []
        worldGeoms.forEach(g=>{
            let idx = g.index.array;
            let pts = g.attributes.position.array;
            for (let i = 0; i < pts.length; i += 3)
                mvts.push(nv3(pts[i], pts[i + 1], pts[i + 2]))
            for (let i = 0; i < idx.length; i++)
                midx.push(idx[i] + idTop)
            idTop += pts.length / 3;
        }
        )

        for (let i = 0; i < midx.length - 2; i += 3)
            tris.push([mvts[midx[i]], mvts[midx[i + 1]], mvts[midx[i + 2]]])


let mvx = new VX(THREE)

this.size[0]=sz.x;
this.size[1]=sz.y;
this.size[2]=sz.z;

mvx.size(sz.x,sz.y,sz.z)

        let vox=this
        vox.k2ap = (k,a)=>{a[0]=(k % sz.x);a[1]= ((k / sz.x) % sz.y) | 0;a[2]=((k / (sz.x * sz.y))) | 0;return a}
        vox.k2p = (k,p)=>p.set((k % sz.x), ((k / sz.x) % sz.y) | 0, ((k / (sz.x * sz.y))) | 0)
        vox.get = (x,y,z)=>voxMap[x + (y * sz.x) + (z * sz.x * sz.y)]
        vox.setv = (vx,val)=>{
            if(val!==undefined)voxMap[vx] = val; else delete voxMap[vx];
        }
        vox.p2k = (p)=>p[0] + (p[1] * sz.x) + (p[2] * sz.x * sz.y);
        vox.set = (x,y,z,val=0)=>{
            let vx = x + (y * sz.x) + (z * sz.x * sz.y);
            return vox.setv(vx, val)
        }
        vox.getp = (p)=>vox.get(p[0], p[1], p[2])
        vox.setp = (p,val)=>vox.set(p[0], p[1], p[2], val)


        let tmp = nv3()
        let ct = tris.length;
        let da = nv3()
        let da1 = nv3()
        let db = nv3()
        let dc = nv3()
        let lf = nv3()
        let rt = nv3()
        let dln = nv3()
        let dl = nv3()


        let ta = nv3()
        let tb = nv3()

        let rasStep = .4999

        let rasline = (a,b)=>{
            ta.copy(a)
            tb.copy(b)
            // trunc(ta)
            // trunc(tb)
            dln.copy(tb).sub(ta)
            let maxln = (vmax(dln) + 1) | 0;
            for (let i = 0; i < maxln; i += rasStep) {
                dl.copy(dln).multiplyScalar(i / maxln).add(ta)

                trunc(dl)

                vox.set(dl.x, dl.y, dl.z, i)

                mvx.setxyz(dl.x, dl.y, dl.z, i)
            }
        }

        tris.forEach((tri,i)=>{
            let t0 = tri[0]
            da.copy(tri[1]).sub(t0)
            db.copy(tri[2]).sub(t0)
            let maxa = vmax(da);
            let maxb = vmax(db);
            let step1, step2;
            if (maxa < maxb)
                [da,db,maxa,maxb] = [db, da, maxb, maxa];
            dc.copy(da).sub(db)
            let s;
            for (s = 0; s < maxb; s += rasStep) {
                lf.copy(da).multiplyScalar(s / maxa).add(t0)
                rt.copy(db).multiplyScalar(s / maxb).add(t0)
                rasline(lf, rt)
            }
            for (s = maxb; s <= maxa; s += rasStep) {
                lf.copy(da).multiplyScalar(s / maxa).add(t0)
                rt.copy(dc).multiplyScalar((s - maxb) / (maxa - maxb)).add(db).add(t0)
                rasline(rt, lf)
            }
            //console.log(maxa,maxb)
        }
        )


/*
        let hull = this.processHull();
        hull.position.add(bmin);
        hull.scale.multiplyScalar(1. / rescale)
        c.parent.add(hull);
*/

        c.scale.multiplyScalar(1. / rescale)
        c.position.add(bmin)
        c.parent.remove(c);

        return vox;
    }

    processHull() {
        let DECK=LTGRAY;
        let HULL=BLUE;
        let SHIELDS=RED;
        let INTERIOR=TRANSPARENT;
        let CHASSIS=DKGRAY;
        let ARMOR=ORANGE;

        let {voxMap, size,THREE} = this;
        let sss = size[0] * size[1] * size[2]
let n6=[[-1,0,0],[0,-1,0],[0,0,-1],[1,0,0],[0,1,0],[0,0,1]]
let n26 = []
for(let x=-1;x<=1;x++)
for(let y=-1;y<=1;y++)
for(let z=-1;z<=1;z++)(x||y||z) && n26.push([x,y,z]);


        let neighbors6 = (p,nopen=[])=>{
            (p[0] > 0) && nopen.push([p[0] - 1, p[1], p[2]]);
            (p[1] > 0) && nopen.push([p[0], p[1] - 1, p[2]]);
            (p[2] > 0) && nopen.push([p[0], p[1], p[2] - 1]);
            (p[0] < ssx) && nopen.push([p[0] + 1, p[1], p[2]]);
            (p[1] < ssy) && nopen.push([p[0], p[1] + 1, p[2]]);
            (p[2] < ssz) && nopen.push([p[0], p[1], p[2] + 1]);
            return nopen;
        }

        let ssx = size[0] - 1;
        let ssy = size[1] - 1;
        let ssz = size[2] - 1;
        let vox = this;

        let findConnectedRegion = (x=0,y=0,z=0,outValue=666,startValue)=>{
            let open = [[x, y, z]]
            let outmap = {}

            startValue = startValue || vox.getp(open[0]);
            for (let j = 0; open.length && (open.length < sss); j++) {
                let nopen = []
                open.forEach(p=>{
                    let v = vox.getp(p)
                    if (v !== startValue)
                        return
                    v = outmap[vox.p2k(p)];
                    if (v == outValue)
                        return;
                    outmap[vox.p2k(p)] = outValue;

                    neighbors6(p, nopen);
                }
                )
                open = nopen;
            }
            return outmap
        }



        let tmp = nv3()

        let ikeys=(ks)=>Object.keys(ks).map(v=>+v);//{return parseInt(v)});

        let shell=(interior, color = ORANGE)=>{
            let ks = ikeys(interior)
            let shell = {}
            ks.forEach(i=>{
                let nb=neighbors6(this.k2ap(i,tmp))
                let fullNeighbors=0
                nb.forEach(n=>(interior[this.p2k(n)]!==undefined)&&(fullNeighbors++))
                if(fullNeighbors!=6)
                    shell[i]=color;//SHIELDS
            })
            return shell;
        }
        let mask = (hullShell,from, color)=>{
            let ks = ikeys(hullShell);
            if(color==undefined)
            ks.forEach(k=>delete from[k])
            else ks.forEach(k=>from[k] = color)            
        }
        

        let exterior = findConnectedRegion()
        let interior = {}
        for (let i = 0; i < sss; i++) if(exterior[i] !== 666){ interior[i] = LTGRAY; vox.setv(i, 0x202020); }//Make solid


        mask(shell(interior),interior);
        let armor;
        mask(armor = shell(interior),interior);

        voxMap = this.voxMap = interior;


        let vslice = 8;//(size[1] / 10) | 0
        let deckY=(y)=>((y+8)%vslice)
        ikeys(voxMap).forEach((i)=>{
            this.k2ap(i,tmp);
            deckY(tmp[1]) && (delete voxMap[i])
        })

let girderMask = 7
        ikeys(armor).forEach((i)=>{
            this.k2ap(i,tmp);
            //if(!((tmp[0] ^ tmp[1] ^ tmp[2])&3)) voxMap[i] = ORANGE
            if(!((tmp[0]&girderMask)&&(tmp[1]&girderMask)&&(tmp[2]&girderMask))) voxMap[i]=CHASSIS; //delete voxMap[i] ;//
            else voxMap[i] = ARMOR; //delete voxMap[i] ;//=ARMOR; //vox.setv(i, ARMOR)
        })


//        let interior = {}
//        let hullShell = {}
//        erode();
//        erode();
        //dilate();
/*

        for(let k in interior){
            k = parseInt(k);
            vox.k2p(k,tmp)
            vox.setv(k,deckY(tmp.y)?undefined:interior[k])
            //vox.setv(k,interior[k])
        }
*/

vox.keys=()=>Object.keys(voxMap).map(v=>+v) //{return parseInt(v)});
vox.getPoints=(keys=vox.keys())=>keys.map(k=>vox.k2p(+k,nv3()))
let k = vox.keys()
        let csz = 1.;
        const boxGeom = new THREE.BoxBufferGeometry(csz,csz,csz)
        let occupied = vox.keys()
        let voxPoints = vox.getPoints(occupied);
        const mesh = new THREE.InstancedMesh(boxGeom,new THREE.MeshStandardMaterial({
            wireframe: false,

            map: new THREE.TextureLoader().load('../../ion-trail/assets/scifitiles/78468-MetalTileFloor.jpg'),
            //transparent:true,
            //opacity:.8,
            //vertexColors:true,
            //depthTest:false,
            //depthFunc:THREE.GreaterDepth,
            //depthWrite:false,
            //blending:THREE.AdditiveBlending,
            metalness: .1,
            roughness: .9,
            color: 0xaaaaaa
        }),voxPoints.length);
        //mesh.position.x -= 250;
        const matrix = new THREE.Matrix4();

        let c4 = new THREE.Color()
        voxPoints.forEach((v,i)=>{
            let vval = voxMap[occupied[i]];
            let offset = 0; //  ((v.y % vslice) == 0) ? (size[0]/2)|0: 0;
            matrix.elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, v.x + offset, v.y, v.z, 1]
            mesh.setMatrixAt(i, matrix);
        
            mesh.setColorAt(i, c4.set(vval | 0))
        }
        )
        mesh.instanceColor && (mesh.instanceColor.needsUpdate = true)

        return mesh;

    }
}

/*
    //let tg = new THREE.BoxBufferGeometry(csz,csz,csz)
    //let tg = new THREE.PlaneBufferGeometry(csz,csz)
    let tg = new THREE.SphereBufferGeometry(csz,64,32)//8,4)
    let test = new THREE.Mesh(tg,new THREE.MeshStandardMaterial({transparent:true,opacity:.5,wireframe:true}))
    test.geometry.rotateX(PI*.25)
    test.geometry.rotateY(PI*.25)
    test.scale.multiplyScalar(20)
    c.parent.add(test);
    let bb=test.clone()
    bb.scale.multiplyScalar(.25)
    test.add(bb)
    */

        //c = test


        //for(let i=0;i<sss;i++){
        //    if(vox.voxMap[i]!==666)vox.voxMap[i]=.5;
        //}
        /*
    const mesh = new THREE.InstancedMesh( new THREE.BoxBufferGeometry(csz,csz,csz), new THREE.MeshBasicMaterial({wireframe:false,transparent:true,opacity:.5,color:0xffff00}), ct );
    c.parent.add( mesh );
    const matrix = new THREE.Matrix4();
    tris.forEach((tri,i)=>{
        tmp.copy(tri[0]).add(tri[1]).add(tri[2])
        tmp.multiplyScalar(1/3);
        matrix.elements=[1,0,0,0,0,1,0,0,0,0,1,0,tmp.x,tmp.y,tmp.z,1]
        mesh.setMatrixAt( i, matrix );
    })
*/