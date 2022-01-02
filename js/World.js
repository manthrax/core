import {Vector3, Object3D} from "https://threejs.org/build/three.module.js";
import {addToSet,removeFromSet} from "./AList.js"

let gridSz;
let rad;

export default class World {
    set gridSize(v) {
        gridSz = v;
    }
    get gridSize() {
        return gridSz;
    }
    set visibleTileCount(v) {
        rad = v;
    }
    constructor(scene, igridSz=10, visRad=5) {
        this.visibleTileCount = visRad;
        this.gridSize = igridSz;
        this.origin = new Vector3()
        this.scene = scene;
        let {abs, sin, cos, min, max, floor} = Math

        //let gkey = (p)=>`${p.x},${p.z}`
        //let mkey = (p)=>`${floor(p.x/gridSz)},${floor(p.z/gridSz)}`
        //let k2c = (k)=> k.split(',').map(e=>parseInt(e))

        let map = this.map = {}
        let visible = {}
        let targetSector;
        let nv3 = (x,y,z)=>new Vector3(x,y,z)
        let tv0 = nv3()
        let tv1 = nv3()

        let gkey = (p)=>((p.x << 16) & 0xffff0000) | (p.z & 0x0000ffff)
        let mkey = (p)=>((floor(p.x / gridSz) << 16) & 0xffff0000) | (floor(p.z / gridSz) & 0x0000ffff)
        let key2coordinate = this.key2coordinate = (k)=>nv3((k >> 16), 0, (k & 0x0000ffff) | ((k & 0x8000) ? 0xffff0000 : 0))
        let selection = this.selection = []

        let getSector = this.getSector = (k)=>{
            let mk = map[k]
            if (mk)
                return mk;

            mk = map[k] = {
                key: k,
                objects: [],
                coordinate: key2coordinate(k)
            }
            mk.position = mk.coordinate.clone().multiplyScalar(gridSz)

            mk.root = new Object3D()
            mk.root.position.copy(mk.position)
            scene.add(mk.root)
            mk.root.updateMatrixWorld();
            (!visible[mk.key]) && scene.remove(mk.root)
            return mk
        }

        let ksector = (k)=>{
            let mk = map[k]
            if (!mk) {
                mk = getSector(k)
                this.sectorGenerator(mk);
            }
            return mk
        }
        let gsector = (p)=>{
            let k = gkey(p);
            return ksector(k)
        }
        let sectorAt = (p)=>ksector(mkey(p))
        let nbtab = []
        for (let x = -rad; x <= rad; x++)
            for (let z = -rad; z <= rad; z++)
                nbtab.push(nv3(x, 0, z))
        let neighbors = (sec)=>nbtab.map(e=>gsector(tv0.copy(sec.coordinate).add(e)))

        this.topObject = 0;
        this.objects = {}

        this.addToSector = (obj,sec)=>{
            obj.sector = sec;
            addToSet(obj, sec.objects, 'objectIndex')
            return obj
        }
        this.select = (obj,selected)=>{
            if(obj.type) debugger
            let fn = selected ? addToSet : removeFromSet
            fn(obj, this.selection, 'selectionIndex')
        }
        this.moveSector = (obj)=>{

            let sec = sectorAt(obj.position)
            obj.sector && removeFromSet(obj, obj.sector.objects, 'objectIndex')

            this.addToSector(obj, sec)

            obj.view && sec.root.attach(obj.view)
            if (!visible[sec.key]) {
                obj.dynamic && removeFromSet(obj, dynamics, 'dynamicIndex')
            }
        }
        this.add = (obj)=>{
            if (obj.view && (obj.view.userData.objectId == undefined))
                this.objects[obj.view.userData.objectId = this.topObject++] = obj
            let sec = sectorAt(obj.position)
            this.addToSector(obj, sec)
        }
        
        let cmin=nv3()
        let cmax=nv3()
        let cstep=nv3()
        let rslt=[]

        let collisions=[];

        this.getCollisions = (obj,rad=1)=>{
            let op = obj.position;
            rslt.length=collisions.length = 0;
            let rad2=rad*2;
            cmin.set(-rad,0,-rad).add(op);
            cmax.set( rad,0, rad).add(op);
            let sec0 = sectorAt(cmin)
            cstep.set(cmax.x,0,cmin.z)
            let sec1 = sectorAt(cstep)
            cstep.set(cmin.x,0,cmax.z)
            let sec2 = sectorAt(cstep)
            cstep.set(cmax.x,0,cmax.z)
            let sec3 = sectorAt(cstep)
            rslt.push(sec0);
            (sec1!==sec0)&&rslt.push(sec1);
            (sec2!==sec0)&&rslt.push(sec2);
            (sec3!==sec0)&&(sec3!==sec2)&&(sec3!==sec1)&&rslt.push(sec3);
            for(let i=0,len=rslt.length;i<len;i++){
                let sec = rslt[i];
                let o=sec.objects;
                for(let j=0,jl=o.length;j<jl;j++){
                    let ob=o[j]
                    if((!ob.dynamic)||(ob===obj))continue;
                    let dx=op.x-ob.position.x;
                    let dz=op.z-ob.position.z;
                    let sdist = (dx*dx+dz*dz);
                    if(sdist<(rad*rad))
                        collisions.push(ob)
                }
            }
            return collisions;
        }

        this.move = (obj,mvec)=>{
            //(obj.userData) && (obj=this.objects[obj.userData.objectId])
            obj.view.position.add(mvec);
            obj.position.add(mvec)
            if ((obj.view.position.x < 0) || (obj.view.position.z < 0) || (obj.view.position.x >= gridSz) || (obj.view.position.z >= gridSz)) {
                this.moveSector(obj)
            }
        }
        this.reset = ()=>{
            for (let k in map) {
                let s = map[k]
                s.root && s.root.parent && s.root.parent.remove(s.root)
            }
            map = this.map = {}
            targetSector = undefined
            dynamics = this.dynamics = []
            selection = this.selection = []
            visible = {}
        }

        /*
        let spawnContext={}
        let spawnEvt = new CustomEvent('spawn',{detail:spawnContext})
        this.spawn=(sec,nob)=>{
            document.dispatchEvent(spawnEvt);
            if(!spawnContext.view){

            }
        }*/

        let topObj = 0;
        let spawnView = (obj,inst)=>{
            obj.position && inst.position.copy(obj.position)
            obj.rotation && inst.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z)
            obj.sector.root.attach(inst)
            obj.view = inst;
            inst.userData.objectId = topObj++;
            this.objects[inst.userData.objectId] = obj;
            return inst;
        }


        
        this.cloneObject = (obj)=>{
            let nob = {
                src: obj.src,
                sector: obj.sector
            }
            obj.position && (nob.position=obj.position.clone())
            obj.rotation && (nob.rotation=obj.rotation.clone())
            obj.flags && (nob.flags=obj.flags);
            return spawnView(nob, this.spawn(nob.sector, nob))
            // return nobs
        }
        let dynamics = this.dynamics = []
        let setVisible = (sector,is)=>{
            scene[is ? 'add' : 'remove'](sector.root)
            if (is) {
                visible[sector.key] = sector;
                sector.objects.map(obj=>(!obj.view) && spawnView(obj, this.spawn(sector, obj)))
                sector.objects.forEach(obj=>(obj.dynamic) && addToSet(obj, dynamics, 'dynamicIndex'))
            } else {
                sector.objects.forEach(obj=>(obj.dynamic) && removeFromSet(obj, dynamics, 'dynamicIndex'))
                delete visible[sector.key];
            }
        }

        let dframe = []
        
        this.update = (target)=>{
            if (!this.sectorGenerator)
                return;

            let sec = sectorAt(target)

            this.beginFrame && this.beginFrame()

            if (targetSector !== sec) {
                this.targetSectorChanged && this.targetSectorChanged(sec)
                let n = neighbors(sec);
                let nvis = {}
                n.forEach(e=>nvis[e.key] = true)
                Object.keys(visible).map(k=>(!nvis[k]) && setVisible(visible[k], false))
                n.forEach(e=>(!visible[e.key]) && setVisible(e, true))
                targetSector = sec

            }
            let now = performance.now() / 1000.
            for (let i = 0; i < dynamics.length; i++)
                dframe[i] = dynamics[i]
            for (let i = 0, o = dframe[0]; i < dynamics.length; i++,
            o = dframe[i]) {
                if (o.update)
                    o.update()
                else {
                    o.view.position.y = abs(sin((now + i) * 10.)) * .05
                    o.view.rotation.y += .01;
                    o.position && (o.view.position.y += o.position.y)
                }
            }
        }

        this.commands = {}
        this.docmd = (...args)=>this.commands[args[0]] && this.commands[args[0]](args)
        this.defcmd = (name,fn)=>this.commands[name] = fn
        this.buildCommands=()=>{
            let commands = {}
            let cmds = new CustomEvent('define-commands',{detail:{commands}});
            document.dispatchEvent(cmds);
            for(let k in commands) this.defcmd(k,commands[k]);
        }

        //    world.defcmd('list', (p)=>)
    }
}
