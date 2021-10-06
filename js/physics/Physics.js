/*import App3 from "../../App3.js"
let app = App3.getApp()
let {THREE} = app
*/

import PhysicsShapes from "./PhysicsShapes.js"
import PhysicsConstants from "./PhysicsConstants.js"
import PhysicsCollision from "./PhysicsCollision.js"
import RigidBody from "./RigidBody.js"

let Physics = {

    PhysicsShapes,
    PhysicsConstants,
    PhysicsCollision,
    RigidBody,
    processCollisions:()=>{}
}

class Simulator {
    constructor(app) {
        let {THREE}=app;

let DEBUG = 0;
let transformAux1;
let nv3 = (x,y,z)=>new THREE.Vector3(x,y,z)
let vbTo3 = (vb,v3)=>v3.set(vb.x(), vb.y(), vb.z())
let tv30 = new THREE.Vector3();



        transformAux1 = new Ammo.btTransform();

        var gravityConstant = 9.8//.8;
        let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        let dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
        let broadphase = new Ammo.btDbvtBroadphase();
        let solver = new Ammo.btSequentialImpulseConstraintSolver();
        let physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher,broadphase,solver,collisionConfiguration);

        let gravityVector = new Ammo.btVector3(0,-gravityConstant,0);
        physicsWorld.setGravity(gravityVector);
        Physics.world = physicsWorld;
Physics.setGravity = (gvector)=>{
gravityVector.setValue(gvector.x,gvector.y,gvector.z)
    physicsWorld.setGravity(gravityVector); //new Ammo.btVector3(0,-gravityConstant,0));
}

        const maxSubSteps = 6;
        const fixedTimeStep = 1. / 60.

        let rigidBodies = [];

        var objectsToRemove = [];
        for (var i = 0; i < 500; i++) {
            objectsToRemove[i] = null;
        }
        var numObjectsToRemove = 0;

        var margin = 0.05;

        app.physics = Physics;

        app.physics.fusedList = {
            nextFused: null
        }

        let bodyMap = {}
        function destroyObject(body) {
            let physics = Ammo.castObject(body.getUserPointer(), Ammo.btVector3).physicsData;
            physics.fuse = 0
        }
        Physics.destroyObject = destroyObject;

        function createRigidBody(object, physicsShape, mass, pos, quat, vel, angVel) {
            if (pos) {
                object.position.copy(pos);
            } else {
                pos = object.position;
            }
            if (quat) {
                object.quaternion.copy(quat);
            } else {
                quat = object.quaternion;
            }

            var transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.getOrigin().setValue(pos.x, pos.y, pos.z);
            //new Ammo.btVector3(pos.x,pos.y,pos.z));
            transform.getRotation().setValue(quat.x, quat.y, quat.z, quat.w);
            var motionState = new Ammo.btDefaultMotionState(transform);

            var localInertia = new Ammo.btVector3(0,0,0);
            physicsShape.calculateLocalInertia(mass, localInertia);

            var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass,motionState,physicsShape,localInertia);
            var body = new Ammo.btRigidBody(rbInfo);

            (vel) && body.setLinearVelocity(new Ammo.btVector3(vel.x,vel.y,vel.z));

            (angVel) && body.setAngularVelocity(new Ammo.btVector3(angVel.x,angVel.y,angVel.z));

            let pdata = object.userData.physics;
            pdata.body = body;

            app.scene.add(object);

            (mass > 0) && rigidBodies.push(object);

            // Disable deactivation
            //body.setActivationState(Physics.DISABLE_DEACTIVATION);
            //} else {//body.setCollisionFlags(Physics.CF_STATIC_OBJECT)
            //}

            var btVecUserData = new Ammo.btVector3(0,0,0);
            btVecUserData.physicsData = pdata;
            body.setUserPointer(btVecUserData)

            return body;
        }
        Physics.createRigidBody = createRigidBody;


/** 
* This is a description of the createObject function. 
* @param {object} params - Object parameters
      {boolean} rotationLocked - Pin the rotation of the object
      {vec3} position
      {quat4} quaternion
      {vec3} velocity
      {vec3} angularVelocity
      {Number} mass
      {object} material - alternate way of specifying {friction,restituion}
      {Number} friction
      {Number} restitution
      {Number} fuse
      {Number} collisionType
*/

        function createObject(root, shape, params={}) {
            let {rotationLocked=false, position, quaternion, velocity, angularVelocity, mass, material, friction,restitution,fuse, ghost, collisionType} = params
            material && ({restitution, friction} = material)
            let object = root;
            let ud = object.userData.physics = new RigidBody();
            ud.root = object;
            ud.mass = mass;
            ud.velocity = velocity ? new THREE.Vector3().copy(velocity) : new THREE.Vector3();
            ud.angularVelocity = angularVelocity ? new THREE.Vector3().copy(angularVelocity) : new THREE.Vector3();
            ud.collisionType = collisionType

            let body;
            let dynamic = !!mass
            {
                if ((!dynamic) || ghost)
                    body = app.physics.createRigidBody(object, shape,       0, undefined, undefined, 0          , 0);
                else
                    body = app.physics.createRigidBody(object, shape, ud.mass, position, quaternion, ud.velocity, ud.angularVelocity);

                physicsWorld.addRigidBody(body);

              //  var btVecUserData = new Ammo.btVector3(0,0,0);
              //  btVecUserData.physicsData = object.userData.physics;
              //  body.setUserPointer(btVecUserData)

                if (!ghost) {
                    restitution !== undefined && body.setRestitution(restitution);
                    friction !== undefined && body.setFriction(friction);
                    if (rotationLocked)
                        body.setAngularFactor(0)
                } else {
                    //let cf = body.getCollisionFlags();
                    body.setCollisionFlags(Physics.PhysicsConstants.CF_NO_CONTACT_RESPONSE);
                    // | Physics.CF_STATIC_OBJECT )
                }

                fuse && (ud.fuse = fuse)
            }
            return body;
        }
        Physics.createObject = createObject;
        function bindMeshObjectToBody(object, body) {
            // Set pointer back to the three object only in the debris objects
            var btVecUserData = new Ammo.btVector3(0,0,0);
            if (!object.userData.physics) {
                let ud = object.userData.physics = new RigidBody();
                ud.root = object
                ud.collisionType = 0
                ud.body = body
            }
            btVecUserData.physicsData = object.userData.physics;
            body.setUserPointer(btVecUserData);
        }

        Physics.bindMeshObjectToBody = bindMeshObjectToBody;

        function createDebrisFromBreakableObject(object) {
            object.castShadow = true;
            object.receiveShadow = true;

            var shape = createConvexHullPhysicsShape(object.geometry.attributes.position.array);
            shape.setMargin(margin);
            let pdata = object.userData.physics;
            var body = createRigidBody(object, shape, pdata.mass, null, null, pdata.velocity, pdata.angularVelocity);

            bindMeshObjectToBody(object, body)
        }

        let totalResourceCount = 0;
        function removeDebris(object) {
            app.scene.remove(object);
            physicsWorld.removeRigidBody(object.userData.physics.body);

            if (object.userData.physics.tracked) {
                let v;
                if ((v = object.userData.physics.vehicleObject)) {
                    app.physics.world.removeAction(v.vehicle);
                    v.wheelMeshes.forEach(wm=>wm.parent.remove(wm))
                    v.wheelMeshes.length = 0;

                    v.engineSound.playing = false;
                    v.engineSound.parent.remove(v.engineSound)
                }
                let ct = 0;
                let tr = object.userData.physics.tracked
                for (let i = tr.length - 1; i >= 0; i--) {
                    totalResourceCount--;
                    Ammo.destroy(tr[i]) || ct++
                }
                tr.length = 0;
            }
            let idx = rigidBodies.indexOf(object)
            if(idx>=0)
                rigidBodies.splice(idx, 1)
        }

        function collectGarbage(deltaTime) {

            let fused = app.physics.fusedList;
            while (fused.nextFused) {
                let pdata = fused.nextFused;
                if (pdata.fuse !== undefined) {
                    let nfuse = pdata.fuse - deltaTime;
                    if (nfuse <= 0) {
                        objectsToRemove[numObjectsToRemove++] = fused.nextFused.root;
                        fused.nextFused = pdata.nextFused;
                        pdata.fuse = undefined;
                        pdata.nextFused = undefined;
                    } else {
                        pdata.fuse = nfuse
                        fused = fused.nextFused;
                    }
                } else
                    fused = fused.nextFused;
            }

            for (var i = 0; i < numObjectsToRemove; i++) {
                removeDebris(objectsToRemove[i]);
            }
            numObjectsToRemove = 0;

        }

        function updatePhysics(deltaTime) {

            collectGarbage(deltaTime);

            // Step world
            physicsWorld.stepSimulation(deltaTime, maxSubSteps, fixedTimeStep);

            updateBodies()

            Physics.processCollisions(dispatcher)
        }

        function updateBodies() {

            // Update rigid bodies
            for (var i = 0, il = rigidBodies.length; i < il; i++) {

                var objThree = rigidBodies[i];
                var objPhys = objThree.userData.physics.body;
                var ms = objPhys.getMotionState();

                if (ms) {

                    ms.getWorldTransform(transformAux1);
                    let pdata = objThree.userData.physics
                    if (!pdata.kinematic) {
                        var p = transformAux1.getOrigin();
                        var q = transformAux1.getRotation();

                        objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
                        objThree.position.set(p.x(), p.y(), p.z());
                        if (objThree.userData.localOrigin) {
                            tv30.copy(objThree.userData.localOrigin)

                            tv30.x /= objThree.scale.x;
                            tv30.y /= objThree.scale.y;
                            tv30.z /= objThree.scale.z;
                            tv30.applyQuaternion(objThree.quaternion)

                            objThree.position.sub(tv30);
                        }
                    }
                    pdata.collided = false;
                }
            }
        }

        let hitPoint = nv3()
        let hitNormal = nv3()
        let hitBody
        let hitObject3

        let lastLog = 0;
        let doLog
        class CollisionResult {
            constructor() {
                this.cache = {}
                this.rayStart = new THREE.Vector3()
                this.rayEnd = new THREE.Vector3()
                this.rayNormal = new THREE.Vector3()
                this.rayLength = Infinity
            }
            get(i) {
                let r = this.cache[i]
                if (!r)
                    r = this.cache[i] = {
                        hitPoint: nv3(),
                        hitNormal: nv3(),

                    }
                let collision = this.collisions
                let o = collision.m_collisionObjects.at(i)
                vbTo3(collision.m_hitPointWorld.at(i), r.hitPoint);
                vbTo3(collision.m_hitNormalWorld.at(i), r.hitNormal);
                r.hitBody = collision.m_collisionObjects.at(i)
                r.hitObject3 = Ammo.castObject(r.hitBody.getUserPointer(), Ammo.btVector3).physicsData.root
                return r;
            }
            set(collisions) {
                this.collisions = collisions
                this.length = collisions.m_hitPointWorld.size ? collisions.m_hitPointWorld.size() : 1
            }
        }

        let collisionInterface = new CollisionResult()

        let fromPoint = new Ammo.btVector3(0,0,0)
        let toPoint = new Ammo.btVector3(0,0,0)

        let threeRBCBFN = (collision,callback)=>{

            if (collision.m_hitPointWorld.size) {

                collisionInterface.set(collision)
                collisionInterface.rayStart.set(fromPoint.x(), fromPoint.y(), fromPoint.z());
                collisionInterface.rayEnd.set(toPoint.x(), toPoint.y(), toPoint.z());
                collisionInterface.rayLength = collisionInterface.rayNormal.copy(collisionInterface.rayEnd).sub(collisionInterface.rayStart).length()
                collisionInterface.rayNormal.multiplyScalar(1 / collisionInterface.rayLength)
                callback(collisionInterface)

            } else {
                vbTo3(collision.get_m_hitPointWorld(), hitPoint);
                vbTo3(collision.get_m_hitNormalWorld(), hitNormal);
                hitBody = collision.get_m_collisionObject()
                hitObject3 = Ammo.castObject(hitBody.getUserPointer(), Ammo.btVector3).physicsData.root;
                callback(hitObject3, hitPoint, hitNormal);
            }
        }

        let raycast = (from,to,cb,nearest=true)=>{
            fromPoint.setValue(from.x, from.y, from.z);
            toPoint.setValue(to.x, to.y, to.z);
            let rtn = false;
            let rayCallback = nearest ? new Ammo.ClosestRayResultCallback(fromPoint,toPoint) : new Ammo.AllHitsRayResultCallback(fromPoint,toPoint)
            //rayCallback.set_m_collisionFilterGroup(4);
            //rayCallback.set_m_collisionFilterMask(4);
            rayCallback.set_m_rayFromWorld(fromPoint);
            rayCallback.set_m_rayToWorld(toPoint);
            physicsWorld.rayTest(fromPoint, toPoint, rayCallback);

            if (rayCallback.hasHit()) {
                threeRBCBFN(rayCallback, cb);
                rtn = true;
            }
            Ammo.destroy(rayCallback);
            return rtn;
        }
        Physics.raycast = raycast;
        this.stepSimulation = (dtsec)=>{            
            updatePhysics(dtsec);
        }
    }
}

Physics.Simulator = Simulator;

Physics.init=(app)=>{
    let {scene, camera, renderer, THREE} = app;
    PhysicsCollision.init(app)
    PhysicsShapes.init(app)
    RigidBody.init(app)
    Physics.defaultSimulator = new Simulator(app)
}

export default Physics;

/*
    let bpCallback = new Ammo.btBroadphaseAabbCallback()
        let boxQuery = (min,max,cb)=>{
            fromPoint.setValue(min.x,min.y,min.z)
            toPoint.setValue(max.x,max.y,max.z)
            let bp = physicsWorld.getBroadphase().aabbTest(fromPoint,toPoint, bpCallback)
            bp.aabTest(fromPoint.setValue(min.x,min.y,min.z))
        }
    */
//if(ghost){
//    body = createGhost( root , shape )
//}else

//let gpcb = new Ammo.btGhostPairCallback();
//physicsWorld.getPairCache().setInternalGhostPairCallback(gpcb);

// Create the terrain body

/*
        //groundShape = createTerrainShape( heightData );
        let groundShape = new Ammo.btBoxShape(new Ammo.btVector3(15,0.1,15));
        var groundTransform = new Ammo.btTransform();
        groundTransform.setIdentity();
        // Shifts the terrain, since bullet re-centers it on its bounding box.
        groundTransform.setOrigin(new Ammo.btVector3(0,-0.1,0));
        var groundMass = 0;
        var groundLocalInertia = new Ammo.btVector3(0,0,0);
        var groundMotionState = new Ammo.btDefaultMotionState(groundTransform);
        var groundBody = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(groundMass,groundMotionState,groundShape,groundLocalInertia));
        physicsWorld.addRigidBody(groundBody);
        groundBody.setRestitution(0.0);
    */

//fallRigidBody->setRestitution(0.6);
//updatePhysics(0);
/*
        let makeConvex = (mesh,position=nv3(-.5 + Math.random(), 3, -.5 + Math.random()),velocity=nv3(0, (Math.random() * 3) + 1, 0),angularVelocity=nv3(Math.random() - .5, 0, Math.random() - .5).multiplyScalar(10))=>{

            var shape = createConvexHullPhysicsShapeFromMesh(object);
            return object;
        }
    */

//Physics.createShape = createShape;
//app.RigidBody = RigidBody
/*

//HEX SHADER#define SQRT3 1.7320508

const vec2 s = vec2(1.0, SQRT3);
const vec2 ax0=vec2( .0  ,1.);
const vec2 ax1=vec2(-.866, .5);
const vec2 ax2=vec2( .866, .5);

vec4 getHex(vec2 p){
    //return xy = square 0-1 coords
    vec4 hC = floor(vec4(p, p - vec2(.5, 1))/s.xyxy) + .5;
    vec4 h = vec4(p - hC.xy*s, p - (hC.zw + .5)*s);
    return dot(h.xy, h.xy)<dot(h.zw, h.zw) ? vec4(h.xy, hC.xy) : vec4(h.zw, hC.zw + 9.73);
}

float distToNearestHexEdge(vec2 hv){
    vec3 adist = abs(vec3(dot(hv,ax0),dot(hv,ax1),dot(hv,ax2)));
    return 1.-(max(max(adist.x,adist.y),adist.z)*2.);
}

vec4 hexOutline(vec2 uv,float hexSize,float lineSize,float lineBlend){
	vec4 hex = getHex(uv/hexSize);
    //fragColor = vec4(abs(h.xy-.5), 0.,1.);
    float dist = distToNearestHexEdge(hex.yx);
    float linePower = smoothstep(lineSize,lineSize+lineBlend,dist);
    //fragColor=vec4(mix(1.,0.,linePower));
    hex.z = linePower;
	return hex;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float hexSize = .05;
    float lineSize = .01;
    float lineBlend = .02;
    vec2 uv = (fragCoord /iResolution.xx).yx;
    vec4 hex = hexOutline(uv,hexSize,lineSize,lineBlend);
    float linePower = hex.z;
    fragColor = mix(texture(iChannel0,hex.xy),vec4(1.),1.-linePower);
}

*/
