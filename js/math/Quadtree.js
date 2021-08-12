let {min, max, abs, random} = Math;
let srnd = (rng=1)=>(random() - .5) * 2. * rng

function Quadtree(istep=.5, idepth=4) {
    let iscale;
    let tree;
    let leaves;
    let prv;
    let key = (x,y)=>((x < 0) ? 0 : 1) | ((y < 0) ? 0 : 2)
    let parent = (k)=>(k >> 2);
    let clear = this.clear = ()=>(tree = this.tree = {}) && (leaves = this.leaves = {}) && (this.list = prv = undefined)
    let origin = {x:0,y:0}
    clear()
    let insert = this.insert = (o,x,y)=>{

        (prv && (prv.next = o)) || (prv = this.list = o);
        prv = o;
        let k = 1;
        let cx = origin.x;
        let cy = origin.y;
        let step = istep;
        x -= step;
        y -= step;
        for (let i = 0; i < idepth; i++) {
            k = (k << 2) | key(x - cx, y - cy);
            (tree[k] && (tree[k] |= (k & 3))) || (tree[k] = k & 3);
            cx += (k & 1) ? step : -step;
            cy += (k & 2) ? step : -step;
            step /= 2;
        }
        let kp = leaves[k] || (leaves[k] = o);
        (kp !== o) && (o.qnext = kp) && (leaves[k] = o);
        return k;
    }
    this.setOrigin = (x,y)=>{origin.x=x;origin.y=y;}
    this.traverse = (fn,k=4,step=istep,cx=0,cy=0)=>{
        let leaf=leaves[k];
        fn(leaves[k], step, cx, cy)
        let ck = tree[k]
        if ( (ck === undefined) || leaf )
            return;
        step /= 2;
        k <<= 2;

        for (let i = 0; i < 4; i++)
            this.traverse(fn, k | i, step, cx + ((i & 1) ? step : -step), cy + ((i & 2) ? step : -step))
    }
    this.traversePoint = (pt,fn)=> this.traverse(fn,4,istep,pt.x,pt.y)
}

//----- TEST

import {createCanvas} from "../rendering/CanvasUtil.js"
import {sqrng} from "../math/SquirrelRNG.js"
import MouseRaycaster from "../rendering/camera/MouseRaycaster.js"

let test = ({THREE, scene, camera, world})=>{

    let raycaster = new MouseRaycaster(THREE);

    let cw = 1024;
    let ch = 1024;
    let c = createCanvas(cw, ch)
    let ctx = c.ctx;

    //document.body.appendChild(c);
    let qsz=200
    let q2=qsz*.5
    let vplane = new THREE.Mesh(new THREE.PlaneGeometry(qsz,qsz),new THREE.MeshBasicMaterial({
        color: 'white',
        map: new THREE.CanvasTexture(c),
        transparent:true,
        alphaTest:.25,
    }))
    vplane.position.set(0,.05,0)
    vplane.material.map.magFilter = THREE.NearestFilter
    vplane.geometry.rotateX(-Math.PI * .5);
    scene.add(vplane);

    let qtree = new Quadtree(.8,9)

    let mouse = {
        x: 0,
        y: 0
    }
    let currentSector;
    let lastSector;

    document.addEventListener('sector_entered', (event)=>{
        currentSector = event.detail;
    })
    document.addEventListener('pointermove', (event)=>{
        if (event.target == c) {
            mouse.x = event.offsetX
            mouse.y = event.offsetY

        } else {
            let rslt = raycaster.raycast({
                event,
                camera,
                root: vplane
            });
            if (rslt[0]) {
                let uv = rslt[0].uv
                mouse.x = uv.x * cw;
                mouse.y = (1. - uv.y) * ch;

          //      let pt = rslt[0].point;
          //      mouse.x = pt.x;
          //      mouse.y = pt.z;
            }
        }
    }
    , false)

    let run = ()=>{
        if(currentSector!==lastSector){
            lastSector = currentSector;
            qtree.setOrigin(currentSector.position.x/q2, currentSector.position.z/q2);
            vplane.position.x=currentSector.position.x;
            vplane.position.z=currentSector.position.z;
        }

        qtree.clear();
        let list, prv;
        ctx.fillStyle = 'rgba(0,0,0,.98)'
        //ctx.fillRect(0, 0, cw, ch)
        ctx.clearRect(0, 0, cw, ch)
        
        let st = performance.now()

        let rng = new sqrng(1234);
        srnd = (sz=1)=>rng.rsf32() * sz
        //for(let i=0;i<100;i++)console.log(rng.rsf32())
        let mkTest = (x,y,i)=>{
            let o = {
                x,
                //-.3,//srnd(.8),
                y,
                //-.8,//srnd(.8)
            };
            o.name = `o:${i}`
            o.key = qtree.insert(o, o.x, o.y)
        }


        //mkTest((mouse.x - (.5 * cw)) / cw * 2, (mouse.y - (.5 * ch)) / ch * 2, -1)
        mkTest(mouse.x - vplane.position.x, mouse.y - vplane.position.z, -1)


        let w = world;
        let d=world.dynamics;
        for (let i = 0; i < d.length; i++) {
            let o=d[i]

            mkTest(o.position.x/q2,o.position.z/q2,i);//srnd(.8), srnd(.8), i)
        }
        let time = performance.now() - st;
        //console.log(time, qtree.tree, qtree.leaves)
        ctx.fillStyle = 'yellow'
        ctx.fillText('' + time, 10, 20)
        ctx.strokeStyle = 'rgba(255,0,0,.5)'
        ctx.save()
        let sz = 8;
        ctx.scale(.5, .5);
        ctx.translate(cw - sz, ch - sz);

        let sz2 = sz * .5;
        if(0)for (let o = qtree.list; o; o = o.next) {
            let rx = (o.x * cw) | 0;
            let ry = (o.y * ch) | 0;
            ctx.strokeRect(rx - sz2, ry - sz2, sz, sz);
        }
        ctx.strokeStyle = 'rgba(0,0,255,.5)'

        ctx.fillStyle = 'rgba(255,0,0,.9)'
        qtree.traverse((e,step,x,y)=>{
            let rx = (x * cw) | 0;
            let ry = (y * ch) | 0;
            let sx = (step * cw) | 0
            let sy = (step * cw) | 0
            if (e){

                ctx.fillRect(rx - sx, ry - sy, sx * 2, sy * 2);
                
                return
            }
            ctx.strokeRect(rx - sx, ry - sy, sx * 2, sy * 2);
        }
        )
        ctx.restore()
        vplane.material.map.needsUpdate = true;
    }
    setInterval(run, 20);
}

export {Quadtree, test};
