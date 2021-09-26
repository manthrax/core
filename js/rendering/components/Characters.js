
import * as SkeletonUtils from "https://threejs.org/examples/jsm/utils/SkeletonUtils.js";


let meshCache = {}
let THREE;
let loader;

class Character{
    set targetAnimation(v){
        this.targetAnim = this.actionMap[v]
    }
    set targetSpeed(v){
        this.targetAnimSpeed=v;
    }
    constructor(glb,track){
        let sm = SkeletonUtils.clone(glb.scene)
        sm.traverse(e=>e.isSkinnedMesh&&(e.castShadow=e.receiveShadow = true))
        let root = new THREE.Object3D();
        root.add(sm);
        //root.position.y -= 2;
        //root.rotation.x = Math.PI*.5;
        
        console.log(glb.animations)
        let mixer = new THREE.AnimationMixer(root)
        let actions = glb.animations.map(a=>mixer.clipAction(a));
//Idle,Run,TPose,Walk
        this.actionMap={idle:0,run:1,tpose:2,walk:3}
        actions.forEach(e=>e.play());
    let self = this;
        self.targetAnim = 0;
        //Vector3 {x: -0.04109997082250352, y: -0.5, z: -0.2660267104636135}
        let lookDir = new THREE.Vector3()
        let lookTarg = new THREE.Vector3()
        let lastTrackPosition=track.position.clone()
        let moveDelta=new THREE.Vector3()
        this.targetSpeed = 1;
        
        document.addEventListener('before-render', (e)=>{
            let dt=e.detail.dts;//1/60;
            mixer.update(dt);
            root.position.set(0,-1.5,0).add(track.position);
            lookDir.set(0,-.5,1).applyQuaternion(track.quaternion)
            lookDir.y = 0;
            lookDir.normalize();
            root.lookAt(lookTarg.copy(lookDir).add(root.position))

          //  root.position.add(lookDir.multiplyScalar(.35)); // 
            root.position.add(lookDir.multiplyScalar(.35));//

            moveDelta.copy(track.position).sub(lastTrackPosition);
            let yvel = moveDelta.y;
            moveDelta.y = 0;
            let lateralVel = moveDelta.length()
            this.targetSpeed = Math.max(.2,Math.min(2,lateralVel*20.));
            if((lateralVel<.1) || (Math.abs(yvel>.1)))
                this.targetAnimation = 'idle'
            else if(lateralVel<.3)
                this.targetAnimation = 'walk'
            else this.targetAnimation = 'run'
            lastTrackPosition.copy(track.position);
        })
        document.addEventListener('sim-tick', (e)=>{
            let targetSpeed = this.targetAnimSpeed;
            actions.forEach((a,i)=>{
                if(i==self.targetAnim)a.weight = Math.min(1,a.weight+.1)
                else a.weight = Math.max(0,a.weight-.1)
                a.timeScale+=(targetSpeed-a.timeScale)*.1;
            })
            //if(Math.random()<.05)self.targetAnim=(Math.random()*actions.length)|0;
        }
        );
        root.scale.multiplyScalar(.92)
        this.root=root;
        this.targetAnimation = 'run'
        this.targetAnimSpeed = 1;
    }
}

export default class Characters
{
    constructor(_THREE, _loader){
        THREE=_THREE;
        loader=_loader;
    }

    loadDef(  name, path ){
        return new Promise((resolve,reject)=>loader.load(path, (glb)=>(meshCache[name]=glb)&&resolve(glb)))
    }
    instantiate( name, track ){
        let glb = meshCache[name];
        let character = new Character(glb,track);
        return character;
    }
}