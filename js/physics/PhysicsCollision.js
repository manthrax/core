/*import App3 from "../../App3.js"
let app = App3.getApp()
let {THREE} = app
*/

let THREE;

let impactPoint;
let averageImpactPoint;
let averageImpactNormal;
let impactNormal;

let PhysicsCollision = {}
PhysicsCollision.init=(app)=>{
    THREE = app.THREE; 
    impactPoint = new THREE.Vector3();
    averageImpactPoint = new THREE.Vector3();
    averageImpactNormal = new THREE.Vector3();
    impactNormal = new THREE.Vector3();        
}


let collisionDispatcher = PhysicsCollision.collisionDispatcher = {}
PhysicsCollision.setCollisionCallback = (a,b,cbfn)=>{
    let cd = collisionDispatcher[a];
    (!cd) && (cd = collisionDispatcher[a] = {});
    cd[b] = cbfn
}

PhysicsCollision.processCollisions = (dispatcher)=>{

    //Process all collisions
    for (var i = 0, il = dispatcher.getNumManifolds(); i < il; i++) {
        var contactManifold = dispatcher.getManifoldByIndexInternal(i);
        var rb0 = Ammo.castObject(contactManifold.getBody0(), Ammo.btRigidBody);
        var rb1 = Ammo.castObject(contactManifold.getBody1(), Ammo.btRigidBody);

        var threeObject0 = Ammo.castObject(rb0.getUserPointer(), Ammo.btVector3).physicsData.root;
        var threeObject1 = Ammo.castObject(rb1.getUserPointer(), Ammo.btVector3).physicsData.root;

        if (!threeObject0 && !threeObject1) {
            continue;
        }

        var userData0 = threeObject0 ? threeObject0.userData.physics : null;
        var userData1 = threeObject1 ? threeObject1.userData.physics : null;

        var collided0 = userData0 ? userData0.collided : false;
        var collided1 = userData1 ? userData1.collided : false;

        var breakable0 = userData0 ? userData0.breakable : false;
        var breakable1 = userData1 ? userData1.breakable : false;

        if (collided0 && collided1) {
            continue;
        }

        let response_a
        let response_b
        if (userData0 && userData1) {
            let c0 = userData0.collisionType || 0
            let c1 = userData1.collisionType || 0
            response_a = collisionDispatcher[c0]
            if (response_a)
                response_a = response_a[c1]
            response_b = collisionDispatcher[c1]
            if (response_b)
                response_b = response_b[c0]
        }
        var contact = false;
        var maxImpulse = 0.;
        var largestImpulseIndex = 0
        let pos, normal
        let primaryContact;
        for (var j = 0, jl = contactManifold.getNumContacts(); j < jl; j++) {
            var contactPoint = contactManifold.getContactPoint(j);

            if (contactPoint.getDistance() < 0) {
                contact = true;
                var impulse = contactPoint.getAppliedImpulse();
                if (impulse > maxImpulse) {
                    maxImpulse = impulse
                    largestImpulseIndex = j;
                    primaryContact = contactPoint;

                    pos = contactPoint.m_positionWorldOnA;
                    normal = contactPoint.get_m_normalWorldOnB();
                    impactPoint.set(pos.x(), pos.y(), pos.z());
                    impactNormal.set(normal.x(), normal.y(), normal.z());

                }
            }
        }

        // If no point has contact, abort
        if (!contact)
            continue;

        if (response_a) {
            pos = contactPoint.m_positionWorldOnA;
            normal = contactPoint.get_m_normalWorldOnB();
            impactPoint.set(pos.x(), pos.y(), pos.z());
            impactNormal.set(normal.x(), normal.y(), normal.z());
            response_a(threeObject0, threeObject1, impactPoint, impactNormal, maxImpulse);
            //This dies if the userData.physics isn't set up correctly.
        }
        if (response_b) {
            pos = contactPoint.m_positionWorldOnB;
            normal = contactPoint.get_m_normalWorldOnB();
            impactPoint.set(pos.x(), pos.y(), pos.z());
            impactNormal.set(normal.x(), normal.y(), normal.z()).multiplyScalar(-1);
            response_b(threeObject1, threeObject0, impactPoint, impactNormal, maxImpulse);
            //This dies if the userData.physics isn't set up correctly.
        }
        if (!breakable0 && !breakable1)
            continue
        // Subdivision

        var fractureImpulse = 250;

        if (breakable0 && !collided0 && maxImpulse > fractureImpulse) {
            var debris = convexBreaker.subdivideByImpact(threeObject0, impactPoint, impactNormal, 1, 2, 1.5);

            var numObjects = debris.length;
            for (var j = 0; j < numObjects; j++) {
                var vel = rb0.getLinearVelocity();
                var angVel = rb0.getAngularVelocity();
                var fragment = debris[j];
                fragment.userData.physics.velocity.set(vel.x(), vel.y(), vel.z());
                fragment.userData.physics.angularVelocity.set(angVel.x(), angVel.y(), angVel.z());

                createDebrisFromBreakableObject(fragment);
            }

            objectsToRemove[numObjectsToRemove++] = threeObject0;
            userData0.collided = true;
        }

        if (breakable1 && !collided1 && maxImpulse > fractureImpulse) {
            var debris = convexBreaker.subdivideByImpact(threeObject1, impactPoint, impactNormal, 1, 2, 1.5);

            var numObjects = debris.length;
            for (var j = 0; j < numObjects; j++) {
                var vel = rb1.getLinearVelocity();
                var angVel = rb1.getAngularVelocity();
                var fragment = debris[j];
                fragment.userData.physics.velocity.set(vel.x(), vel.y(), vel.z());
                fragment.userData.physics.angularVelocity.set(angVel.x(), angVel.y(), angVel.z());
                createDebrisFromBreakableObject(fragment);
            }

            objectsToRemove[numObjectsToRemove++] = threeObject1;
            userData1.collided = true;
        }
    }
}

export default PhysicsCollision
