let Physics = {}
// js/BulletCollision/CollisionDispatch/btCollisionObject.h
Physics.INACTIVE_TAG = 0;
Physics.ACTIVE_TAG = 1;
Physics.ISLAND_SLEEPING = 2;
Physics.WANTS_DEACTIVATION = 3;
Physics.DISABLE_DEACTIVATION = 4;
Physics.DISABLE_SIMULATION = 5;

// CollisionFlags {
Physics.CF_STATIC_OBJECT = 1;
Physics.CF_KINEMATIC_OBJECT = 2;
Physics.CF_NO_CONTACT_RESPONSE = 4;
Physics.CF_CUSTOM_MATERIAL_CALLBACK = 8;
Physics.CF_CHARACTER_OBJECT = 16;
Physics.CF_DISABLE_VISUALIZE_OBJECT = 32;
Physics.CF_DISABLE_SPU_COLLISION_PROCESSING = 64;
// }

// enum    CollisionObjectTypes {
Physics.CO_COLLISION_OBJECT = 1;
Physics.CO_RIGID_BODY = 2;
Physics.CO_GHOST_OBJECT = 4;
Physics.CO_SOFT_BODY = 8;
Physics.CO_HF_FLUID = 16;
Physics.CO_USER_TYPE = 32;
Physics.CO_FEATHERSTONE_LINK = 64;
// }

Physics.ctTerrain = 0
Physics.ctPlayer = 1
Physics.ctTrigger = 2
Physics.ctPickup = 3
Physics.ctEnemy = 4
Physics.ctDebris = 5

Physics.materials = {
    ice:{
        restitution:0.01,
        friction:.01
    },
    asphalt:{
        restitution:0.5,
        friction:3.0        
    },
    wood:{
        restitution:0.25,
        friction:0.8
    },
    plastic:{
        restitution:0.5,
        friction:1.8
     },
    steel:{
        restitution:0.9,
        friction:0.2
    }
}    

Physics.bodyTypes = {
    box: {
        shape: {
            type: 'box',
        },
        collisionType:Physics.ctTerrain,
        material:Physics.materials.wood,
        mass: .1
    },
    box_static: {
        shape: {
            type: 'box',
            margin: .0001
        },
        collisionType: Physics.ctTerrain,
        material:Physics.materials.wood,
        mass: .0,
        margin: .0001
    },
    sphere: {
        shape: {
            type: 'sphere'
        },
        collisionType: Physics.ctTerrain,
        material:Physics.materials.wood,
        mass: .1,

    },
    mesh: {
        shape: {
            type: 'mesh'
        },
        collisionType: Physics.ctTerrain,
        material:Physics.materials.wood,
        mass: .0,
        margin: 0.01
    },
    heightfield: {
        shape: {
            shapeScale: {x:50,y:50,z:50},
            type: "heightfield",
            margin: 0.0001
        },
        collisionType: Physics.ctTerrain,
        material:Physics.materials.wood,
        mass: .0,
        margin: 0.01
    },
}

export default Physics;
