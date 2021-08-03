import {InstanceGroup} from "./rendering/InstanceGroup.js"

export default class Sim {
    constructor(THREE, prefabs, world) {

        world.defcmd('list', (p)=>{
            localforage.keys().then(k=>{

                world.docmd('info', k.join(','))
            }
            )
        }
        )

        world.defcmd('help', (p)=>{
            let k = Object.keys(world.commands)
            world.docmd('info', k.join(','))
        }
        )
        let {abs, sin, cos, PI, random} = Math
        let nv3 = THREE.Vector3

        //console.log(prefabs)
        let ents = Object.entries(prefabs)
        ents = ents.filter(e=>!!e[1].object)
        ents.sort((a,b)=>a[1].object.userData.volume - b[1].object.userData.volume)

        let categories = {
            chr: [],
            obj: [],
            veh: [],
            scene: [],
            alien: []
        }
        ents.forEach(e=>{
            let k = e[1].src.split('_')[0];
            categories[k] && categories[k].push(e[1]) && (e[1].category = k)
        }
        )

        let now
        world.beginFrame = ()=>{
            now = performance.now() / 1000.
        }

        let mvec = new nv3()

        let bounce = function() {
            this.view.position.y = abs(sin((now + this.dynamicIndex) * 10.)) * .05
            this.view.rotation.y += .003;
            this.rotation && this.rotation.copy(this.view.rotation)
            this.position && (this.view.position.y += this.position.y)

        }

        let move = function(amt=.1) {
            //  amt = 0;

            mvec.set(0, 0, -1).applyQuaternion(this.view.quaternion).multiplyScalar(amt)
            world.move(this, mvec)
        }
        let vehUpdate = function() {
            bounce.call(this)
            move.call(this, .1)
        }

        let chrUpdate = function() {
            bounce.call(this)
            move.call(this, -.01)
        }

        categories.chr.forEach(e=>(e.dynamic = true) && (e.update = chrUpdate))
        categories.veh.forEach(e=>(e.dynamic = true) && (e.update = vehUpdate))

        let tileObj = 'vox/scene_grass'
        prefabs[tileObj].flags = 1;

        let computeStaticBounds = (inst)=>{
            (!inst.userData.worldBounds) && (inst.userData.worldBounds = new THREE.Box3())
            inst.userData.worldBounds.setFromObject(inst)

            if (!world.dbgVis) {
                world.dbgVis = new InstanceGroup()
                world.scene.add(world.dbgVis);
                world.dbgVisMesh = new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({
                    color: 'yellow',
                    transparent: true,
                    opacity: .5
                }))
                world.dbgBox = (bx)=>{
                    let m = world.dbgVisMesh.clone()
                    bx.getCenter(m.position)
                    bx.getSize(m.scale)
                    m.scale.multiplyScalar(1.01)
                    world.dbgVis.add(m)
                }
            }
            world.dbgBox(inst.userData.worldBounds)
        }
        world.spawn = (mk,obj)=>{
            let pf = prefabs[obj.src]
            let inst = pf.object.clone()

            pf.dynamic && (obj.dynamic = true)
            pf.update && (obj.update = pf.update)
            //      (!pf.dynamic) && computeStaticBounds(inst)

            return inst;
        }

        let spawnInSector = (mk,tileObj)=>{
            let pf = prefabs[tileObj]
            let ft = pf.object
            // ft.position.y
            let pos = new nv3(mk.position.x + (ft.userData.size.x * .5),-1 * ft.scale.y,mk.position.z + (ft.userData.size.z * .5))
            let rot = new nv3(0,((Math.random() * 4) | 0) * (Math.PI * .5),0)
            let obj = {
                src: tileObj,
                position: pos,
                rotation: rot,
                flags: pf.flags || 0,
                update: pf.update
            }
            world.addToSector(obj, mk)
            return obj
        }
        let arrayRand = e=>e[(Math.random() * e.length) | 0]

        let defaultSector = (mk)=>{

            let obj = spawnInSector(mk, tileObj)
            //obj.locked = true;
            for (let i = 0; i < 5; i++) {
                let s = spawnInSector(mk, arrayRand(random() > .2 ? categories.chr : random() > .5 ? categories.veh : categories.obj).name)
                s.position.x += Math.random() * world.gridSize
                s.position.z += Math.random() * world.gridSize
                s.rotation.y = ((Math.random() * 4) | 0) * (Math.PI * .5)
            }
        }

        world.sectorGenerator = (mk)=>{

            defaultSector(mk)
            /*
return localforage.getItem( ''+mk.key ).then(item=>{
        if(item==null)
             defaultSector(mk)
             else console.log("Bad sector")
}).catch( console.log );
*/

        }
        let layout
        let maxWidth = world.gridSize
        let rowHeight = 0
        let layX = 0
        let layY = 0

        ents.map(ef=>{
            let ent = ef[1]
            if (layX > maxWidth) {
                layX = 0;
                layY += rowHeight
                rowHeight = 0;
            }
            let margin = 1.3
            let odata = ent.object.userData
            rowHeight = Math.max(odata.size.z * margin, rowHeight)
            layX += odata.size.x * margin

            let odef = {
                src: ef[0],
                position: new nv3(layX,0,layY)
            }
            world.add(odef);
        }
        )
    }
}

/*
*/
Sim.fLocked = 0x80
