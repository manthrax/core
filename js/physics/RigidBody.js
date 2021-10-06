/*
import App3 from "../../App3.js"
let app = App3.getApp()
let {THREE} = app
*/


let tbq40
let tbv30
let tbv31
let transformAux1;
let tv30;
let tv31;

class RigidBody {
    constructor() {
        this.collided = false
    }
    get fuse() {
        return this._fuse
    }
    set fuse(v) {
        this._fuse = v;
        this.onFuseChange && this.onFuseChange()

        if (this.nextFused === undefined) {
            this.nextFused = app.physics.fusedList.nextFused;
            app.physics.fusedList.nextFused = this;
        }
    }
    setAngularVelocity(pv3) {
        this.body.getAngularVelocity().setValue(pv3.x, pv3.y, pv3.z)
    }
    setPosition(pv3) {
        this.body.getMotionState().getWorldTransform(transformAux1)
        transformAux1.getOrigin().setValue(pv3.x, pv3.y, pv3.z)
        this.body.setWorldTransform(transformAux1)
    }
    setRotation(q4) {
        var transform = this.body.getCenterOfMassTransform();
        let ms = this.body.getMotionState()
        ms.getWorldTransform(transformAux1)
        tbq40.setValue(q4.x, q4.y, q4.z, q4.w)
        transformAux1.setRotation(tbq40)
        this.body.setWorldTransform(transformAux1);
        ms.setWorldTransform(transformAux1)
        //this.body.setCenterOfMassTransform(transform);
    }
    setLinearVelocity(v3) {
        let v = this.body.getLinearVelocity()
        v.setValue(v3.x, v3.y, v3.z)
        //this.body.setLinearVelocity(v)
    }

    getLinearVelocity(v3) {
      let v = this.body.getLinearVelocity()
      return v3.set(v.x(),v.y(),v.z())
    }


  applyBodyForce(body,impulse){
    tbv30.setValue(impulse.x,impulse.y, impulse.z);
    this.body.applyCentralForce(tbv30);
  }

  applyRelativeForceAtPoint(body,impulse,point){
    this.body.motionProxy.localToWorld(tv30.copy(impulse));
    this.body.motionProxy.worldToLocal(tv31.copy(point))
    this.applyBodyForceAtPoint(body,tv30,tv31);
  }

  applyBodyForceAtPoint(body,impulse,point){
    tbv30.setValue(impulse.x,impulse.y, impulse.z);
    tbv31.setValue(point.x,point.y, point.z);
    this.body.applyForce(tbv30,tbv31);
  }


    applyCentralForce(v3) {
        this.body.applyCentralForce(tbv30.setValue(v3.x, v3.y, v3.z))
    }
    applyCentralImpulse(v3) {
        this.body.applyCentralImpulse(tbv30.setValue(v3.x, v3.y, v3.z));
    }
    applyForce(v3force, at) {
        this.body.applyForce(tbv30.setValue(v3force.x, v3force.y, v3force.z), tbv31.setValue(at.x, at.y, at.z))
    }
    applyImpulse(v3impulse, at) {
        this.body.applyImpulse(tbv30.setValue(v3impulse.x, v3impulse.y, v3impulse.z), tbv31.setValue(at.x, at.y, at.z));
    }

}

RigidBody.init =  app=>{
    let {scene, camera, renderer, THREE} = app;
    tbq40 = new Ammo.btQuaternion();
    tbv30 = new Ammo.btVector3();
    tbv31 = new Ammo.btVector3();
    transformAux1 = new Ammo.btTransform();
    tv30 = new THREE.Vector3()
    tv31 = new THREE.Vector3()
}


export default RigidBody
