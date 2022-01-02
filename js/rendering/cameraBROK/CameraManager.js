
let THREE;

class FCameraBehavior{
    weight=1
    camera = new THREE.PerspectiveCamera(15,1,.01,3)
    headOffset = new THREE.Vector3( 0, 0.1, 0)
    fromOffset = new THREE.Vector3( 0, 0.3, .7)
    constructor(mgr){
        this.mgr = mgr;
        this.target = new THREE.Object3D()
        mgr.app.scene.add(this.camera)
        mgr.app.scene.add(this.target)        


    }
    update(){
    }
    debug=false
    setDebug = (ndebug)=>{
        if(ndebug!=this.debug){
            this.debug=ndebug;
            if(ndebug){
                this.camera.add(this.debugBox  = CameraBehavior.box.clone())
                this.mgr.app.scene.add(this.camHelper = new THREE.CameraHelper(this.camera))
                this.camHelper.material.transparent = true;
                this.camHelper.material.opacity = .25;

            }else{
                if(this.camHelper){
                    this.debugBox.parent.remove(this.debugBox)
                    this.camHelper.parent.remove(this.camHelper)
                }
                this.camHelper = this.debugBox = null;
            }
        }
    }
}

class TrackBehavior extends CameraBehavior{
    headOffset = new THREE.Vector3( 0, 0.02, 0)
    fromOffset = new THREE.Vector3( 0, 0, .3)
    constructor(mgr){
        super(mgr)

        this.targetAnchor = new THREE.Object3D()
        this.targetAnchor.position.add(this.headOffset)
        this.camera.position.add(this.fromOffset)        
        this.target.add(this.targetAnchor)
        this.targetAnchor.add(this.camera)
        this.camera.lookAt( this.targetAnchor.localToWorld(mgr.tv0.copy(this.headOffset)) )
    }
    update(target){
        super.update()
        this.target.position.copy(target.position)
        this.target.rotation.copy(target.rotation)
        this.target.updateMatrixWorld();
    }
}

class AtFromBehavior extends CameraBehavior{
    constructor(mgr){
        super(mgr)
    }
    update(target){
        super.update()
        this.camera.position.set(2,.1,2).add(target.position)
        this.camera.lookAt( this.mgr.tv0.copy(this.headOffset).add(target.position) )
    }
}

class BallChainBehavior extends CameraBehavior{
    minRadius = 0.2
    constructor(mgr){
        super(mgr)
        this.fromOffset.z = 0.5
    }
    update(target){
        super.update()
        
        var v = this.mgr.tv0;
        var at = this.mgr.tv1;

        v.copy(this.camera.position)
        at.copy(target.position).add(this.headOffset)
        v.sub(at)
  //     v.y=0;
        var len = v.length()
        if(len>this.fromOffset.z)
            v.multiplyScalar(this.fromOffset.z / len)
        else if(len < this.minRadius){
            var sy = v.y;
            v.multiplyScalar(this.minRadius / len)
            v.y = sy;
        }
 //       v.y=this.camera.position.y-at.y;
        this.camera.position.copy(at).add(v)
        this.camera.lookAt(at)
    }
}


class OrbitControlsBehavior extends CameraBehavior{
    constructor(mgr){
        super(mgr)
        this.mgr.app.controls.enabled = false;
    }
    update(target){
        this.camera.position.copy(this.mgr.app.controls.object.position)
        this.camera.quaternion.copy(this.mgr.app.controls.object.quaternion)
    }
}

class CameraManager{
    activeBehaviors=[]
    cameraIndex = 0
    debug=false
    qscl(q,v){
        q.x*=v
        q.y*=v
        q.z*=v
        q.w*=v
    }
    qadd(a,b){
        a.x+=b.x;
        a.y+=b.y;
        a.z+=b.z;
        a.w+=b.w;
    }
    updateBehaviors( target ){

        var abhv =this.activeBehaviors;
        var t= this.tmpTfm;
        var v0=this.tv0
        var q0=this.tq0
        var sumWeight = 0;
        t.position.set(0,0,0)
        t.quaternion.set(0,0,0,1)
        var tweenVel = 0.02;
        var clamp=(v,min,max)=>(v < min) ? min : ((v > max) ? max : v)
        for(var i=0;i<abhv.length;i++){
            var ab = abhv[i];

            ab.weight = clamp(ab.weight+((i==this.cameraIndex)? tweenVel : -tweenVel),0,1)
            sumWeight += ab.weight
        }
        if(sumWeight>0.0001){
            for(var i=0;i<abhv.length;i++){
                var ab = abhv[i];
                ab.update(target)
                if(ab.weight<=0)continue;
                ab.camera.updateMatrixWorld();
                q0.setFromRotationMatrix(ab.camera.matrixWorld)

                var r = ab.weight/sumWeight
                q0.slerp(t.quaternion,1-r)
                ab.camera.localToWorld(v0.set(0,0,0)).multiplyScalar(ab.weight);
                t.position.add(v0)
                t.quaternion.copy(q0)
                if(ab.camHelper)ab.camHelper.updateMatrixWorld()
            }
        }else{
            return;
        }
        t.position.multiplyScalar(1/sumWeight)
        t.quaternion.normalize()
        this.currentTarget.position.copy(t.position)
        this.currentTarget.quaternion.copy(t.quaternion)
        this.currentTarget.updateMatrixWorld()
    }
    selectNextCamera(){
        this.cameraIndex = (this.cameraIndex+1)%this.activeBehaviors.length
    }
    updateCamera(camera){
       //return;
        camera.position.copy(this.blendCam.position)
        camera.quaternion.copy(this.blendCam.quaternion)
        camera.updateMatrixWorld();
    }
    update(){

        var t = performance.now() * .0001

        var vv = this.wave(t)

        var target = this.app.playerObject

        if(target && target.renderable){
            target.renderable.position.copy(target.position)

            this.updateBehaviors((target.vehicle && target.vehicle.renderable)?target.vehicle.renderable:target.renderable)

            this.blendCam.position.copy(this.currentTarget.position)
            this.blendCam.quaternion.copy(this.currentTarget.quaternion)

        }
    }
    setDebug(ndebug){
        var abhv =this.activeBehaviors;
        this.debug=ndebug;
        for(var i=0;i<abhv.length;i++)
            abhv[i].setDebug(ndebug);
    }

    constructor(app){
THREE = app.THREE


    CameraBehavior.box = function(){
        var m = new THREE.Mesh(new THREE.BoxGeometry(.2,.03,.4))
        for(var i=0;i<m.geometry.vertices.length;i++)m.geometry.vertices[i].z+=.2
        return m;
    }()

        this.tmpTfm = new THREE.Object3D()
        this.tq0 = new THREE.Quaternion()
        this.tv0 = new THREE.Vector3()
        this.tv1 = new THREE.Vector3()
        this.app = app;
        this.currentTarget =  new THREE.Object3D();
        app.scene.add(this.currentTarget);

        this.activeBehaviors.push(this.ballChainBehavior = new BallChainBehavior(this))
        this.activeBehaviors.push(this.trackBehavior = new TrackBehavior(this))
        this.activeBehaviors.push(this.atFromBehavior = new AtFromBehavior(this))
        this.activeBehaviors.push(this.orbitControlsBehavior = new OrbitControlsBehavior(this))
        
        this.blendCam = CameraBehavior.box.clone();
        this.blendCam.material = new THREE.MeshBasicMaterial();
        app.scene.add(this.blendCam)
        
        this.wave = (time) => ((Math.sin(time*Math.PI)+1)*.5)
        app.listen("cameraDebugToggle",()=>{ this.setDebug(this.debug?false:true) });
    
        if(app.state && app.state.cameraManager)
            this.cameraIndex = app.state.cameraManager.cameraIndex
        app.listen('saveState',(state)=>{
            state.cameraManager={cameraIndex:this.cameraIndex}
        })

    }
}


export default {CameraManager}