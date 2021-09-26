import {TransformControls} from "https://threejs.org/examples/jsm/controls/TransformControls.js";
import * as SkeletonUtils from "https://threejs.org/examples/jsm/utils/SkeletonUtils.js";

export default function FabrikSolverInit(app) {
    let {THREE, scene, camera, renderer} = app;
    let {Vector3, Mesh, Object3D, SphereGeometry, MeshStandardMaterial, AxesHelper, AnimationMixer} = THREE;


    let {cos, sin, abs, PI,random} = Math;

    const dir = new Vector3()
    const distanceToTarget = new Vector3()

    function solveFabrik(_points, _target, maxIterations=20) {
        let points = _points
        let lengths = Array(_points.length - 1).fill(null)

        const origin = points[0].clone()
        const target = _target.clone()

        for (let i = 0; i < lengths.length; i++) {
            lengths[i] = dir.subVectors(points[i], points[i + 1]).length()
        }

        for (let iterations = 0; iterations < maxIterations; iterations++) {
            const direction = iterations % 2 === 0

            points = points.reverse()
            lengths = lengths.reverse()
            points[0] = direction ? target : origin
            for (let i = 1; i < points.length; i++) {
                dir.subVectors(points[i], points[i - 1]).normalize()
                points[i].copy(points[i - 1]).add(dir.multiplyScalar(lengths[i - 1]))
            }

            /*        if (!direction) {
          distanceToTarget.subVectors(target, points).length()
          if (distanceToTarget <= 0.1) {
            return
          }
        }*/

        }
        return []
    }

    solveFabrik.solve = (()=>{
        let nv3 = (x,y,z)=>new Vector3(x,y,z);
        let lens = []
        let v0 = nv3();
        let origin = nv3();
        let dir = nv3()
        return function(_bones, _points, _target, _pole, maxIterations=20, maxTargetDist=.001) {
            let bones = _bones;
            let points = _points;
            let target = _target;
            let pole=_pole;
            let segs = lens.length = bones.length - 1;
            for (let i = 0; i < segs; i++)
                lens[i] = v0.subVectors(points[i + 1], points[i]).length();

            origin.copy(bones[0].position);

            for (let iter = 0, direction = 0; iter < maxIterations; iter++,
            direction = iter & 1) {

                bones[0].position.copy(origin);
                for (let i = 0; i < segs; i++) {
                    dir.subVectors(points[i + 1], points[i]).normalize()
                    points[i + 1].copy(points[i]).add(dir.multiplyScalar(lens[i]))
                }

                let d2t = distanceToTarget.subVectors(target, points[segs]).length()
                if (d2t < maxTargetDist) {
                    //points[segs].copy(target)
                    return
                }

                points[segs].copy(target);

                for (let i = segs - 1; i >= 0; i--) {
                    dir.subVectors(points[i], points[i + 1]).normalize()
                    points[i].copy(points[i + 1]).add(dir.multiplyScalar(lens[i]))
                }

            }
            // Pole
            if (pole) {
                for (let i = 1; i < points.length - 1; i++) {
                    const nextPoint = points[i + 1]
                    const prevPoint = points[i - 1]
                    const currentPoint = points[i]

                    normal.subVectors(nextPoint, prevPoint).normalize()
                    plane.setFromNormalAndCoplanarPoint(normal, currentPoint)

                    plane.projectPoint(points[i], projectedPoint)
                    plane.projectPoint(pole, projectedPole)

                    projectedPointMinusPreviousPoint.subVectors(projectedPoint, prevPoint)
                    projectedPoleMinusPreviousPoint.subVectors(projectedPole, prevPoint)

                    const angle = projectedPoleMinusPreviousPoint.angleTo(projectedPointMinusPreviousPoint)

                    rotationQuaternion.setFromAxisAngle(normal, angle)

                    const g = dir.subVectors(currentPoint, prevPoint)
                    g.applyQuaternion(rotationQuaternion)
                    g.add(prevPoint)
                    points[i].copy(g)
                }
            }
        }
    }
    )()

    //let points = [];
    let objs = []
    let g = new SphereGeometry(.15)
    let mat = new MeshStandardMaterial({
        metalness: .95,
        roughness: .1
    })
    let mesh = new Mesh(g,mat);
    //let bones;
    mesh.castShadow = mesh.receiveShadow = true;
    let nv3 = (x,y,z)=>new Vector3(x,y,z);
    /*if(0)for (let i = 0; i < 22;i++) {
        let m = mesh.clone();
        scene.add(m);
        m.position.set(i, 0, 0)
        //objs.push(m);
        points.push(m.position)
    }*/
    //let tmesh = mesh.clone();
    //scene.add(tmesh)
    //let target = tmesh.position;
    //let target = nv3();
    let target1 = nv3();
    let wanderRad = 8;
    let rad;
    let fixAxis = nv3(1, 0, 0);
    let fixAxis1 = nv3(0, 1, 0);

    let ntarget = nv3();
    let nmove = nv3();
    let ntmp = nv3();
    let redMat = mesh.material.clone();
    let greenMat = mesh.material.clone();
    redMat.color.set('red');
    greenMat.color.set('green');


    let constrainedMove = (position,movedir)=>{
        let sz = .45;
        let vsz = -.0;
        let blocked = false;
        ntarget.copy(position).add(movedir);
        ntmp.copy(ntarget);
        if (app.checkObstructed(ntmp, sz, vsz)) {
            blocked = true;
            movedir.copy(position);
            movedir.y += .03;
            return blocked;
        }
        ntmp.add(movedir);
        if (app.checkObstructed(ntmp, sz, vsz)) {
            nmove.set(0, 0, 0)
            ntmp.copy(ntarget);
            ntmp.x += movedir.x;
            if (!app.checkObstructed(ntmp, sz, vsz)) {
                nmove.x += movedir.x;
                ntarget.x += movedir.x;
            }
            ntmp.copy(ntarget);
            ntmp.y += movedir.y;
            if (!app.checkObstructed(ntmp, sz, vsz)) {
                nmove.y += movedir.y;
                ntarget.y += movedir.y;
            }
            ntmp.copy(ntarget);
            ntmp.z += movedir.z;
            if (!app.checkObstructed(ntmp, sz, vsz)) {
                nmove.z += movedir.z;
                ntarget.z += movedir.z;
            }
            movedir.copy(nmove);
            blocked = true;
        }
        movedir.add(position);
        return blocked;
    }
    let creatures = []
    function solveLimb(limb)
    {
        let {bones,points,target} = limb;
        //line.current.geometry.setFromPoints(points)
        // meshLine.current.geometry.setPoints(line.current.geometry.attributes.position.array)
        if (bones) {

            let b = bones[bones.length - 1];

            target.applyQuaternion(b.quaternion);

            let blocked = limb.blocked = constrainedMove(b.position, target);

            let k = b.children[0];

            //k.scale.z = 2;
            k && (k.material = blocked ? redMat : greenMat) && (k.position.z = blocked ? 1 : 2);
            //target.set(target1.x , target.y+b.position.y, target1.z)

            // if(blocked){

            // }

            solveFabrik.solve(bones,points, target, false, 1)
            //if(0)
            for (let i = 0; i < bones.length; i++) {
                let b = bones[i];

                //    target1.copy(target);``
                //       b.worldToLocal(target1);
                //      target1.set(target1.y,target1.z,target1.x);




                b.lookAt(i ? bones[i - 1].position : target);
                //    objs[i].position.copy(points[i])
                
                if(limb.boneFix)
                    limb.boneFix(bones[i])
                else{
                    bones[i].rotateOnAxis(fixAxis, Math.PI * -.5)
                    bones[i].rotateOnAxis(fixAxis1, Math.PI)
                }
            }
            //}
        }
    }
    function test() {

        creatures.forEach(e=>{
            
            e.limbs.forEach(limb=>{
                limb.target.set(0,0,0);
                limb.update(limb.target,limb.blocked,limb.bones[0]);
                solveLimb(limb)
            })
        })
        //solveLimb({bones,points,target})

    }
    solveFabrik.test = test;
let ground = 0;//-40;
    app.gltfLoader.load('assets/spdrmeta2.glb', (glb)=>{
        glb.scene.traverse(e=>(e.isSkinnedMesh) && (e.frustumCulled = false));
        scene.add(glb.scene)



        //let bones = []
        let meshes = []
        //glb.scene.traverse(e=>(e.type == "Bone") && (bones.push(e)))
        //glb.scene.traverse(e=>(e.type == "SkinnedMesh") && meshes.push(e))
        glb.scene.traverse(e=>(e.type == "Mesh") && (meshes.push(e)))
        meshes.forEach(m=>(m.castShadow = m.receiveShadow = true))

let body = glb.scene.getObjectByName('Mball004')
        body.position.y = ground+1.0;


body.scale.multiplyScalar(.1)

        
        let tc = new TransformControls(camera,renderer.domElement);
        body.localToWorld(tc.position.set(0,0,0));
        tc.attach(body);
        scene.add(tc);
        app.fpsInteraction.pointerLockControls.addEventListener('lock', (e)=> tc.enabled = tc.visible = false)
        app.fpsInteraction.pointerLockControls.addEventListener('unlock', (e)=>tc.enabled = tc.visible = true)
        
/*
        let ankles = [18, 17, 16, 15, 22, 26, 30, 34].map(i=>glb.scene.getObjectByName('Bone0' + i))
        let feet = [36,38, 41,42,   40, 39, 37, 35 ].map(i=>glb.scene.getObjectByName('Bone0' + i))
        console.log(feet);
        let c;
        let fmesh = mesh.clone();
        //fmesh.position.y = 1.2;
        feet.forEach((b,i)=>b.add(c = fmesh.clone()) && (c.scale.z = i + 1.1) && (c.scale.x = c.scale.y = .1))
        //&&b.add(mesh.clone()));
        //glb.scene);
        (!meshes[0]) && console.error("No meshes found...")
        tc.position.copy(meshes[0].position)

        
        tc.attach(body);

        meshes[0].parent.position.y = ground+.5;
        
//[f.parent.parent,f.parent, f] ,f.parent.parent.parent
        let limbs = feet.map(f=>{return {bones:[f,f.parent,f.parent.parent,f.parent.parent.parent],target:nv3(0,0,0)}}) //f.localToWorld()
        bones.forEach(b=>scene.attach(b))


        bones.forEach(b=>b.up.set(0,0,-1).applyQuaternion(b.quaternion));

        limbs.forEach(l=>l.points=l.bones.map(b=>b.position));

        let spdrMotion=(target,blocked)=>{
            let t=performance.now()*.00001

            target.set(sin(t),cos(t),0.0).multiplyScalar(0.001)
        }               
        let boneFix=(bone)=>{
            bone.rotateOnAxis(fixAxis, Math.PI*.5)
          
                  // bone.rotateOnAxis(fixAxis, Math.PI * -.5)
                 //   bone.rotateOnAxis(fixAxis1, Math.PI)
        }

        limbs.forEach(l=>l.update=spdrMotion);
        limbs.forEach(l=>l.boneFix=boneFix);
       creatures.push({
            limbs
        })
        */

    }
    );

    app.gltfLoader.load('assets/radbat.glb', (glb)=>{
        scene.add(glb.scene);
        glb.scene.position.y += 10;
        glb.scene.scale.multiplyScalar(.1)
        let mixer = new AnimationMixer(glb.scene);
        mixer.clipAction(glb.animations[0]).play();

        document.addEventListener('before-render',()=>{
            mixer.update(1.0/30);
        })
    })

    app.gltfLoader.load('assets/snek2.glb', (glb)=>{

       //glb.scene.scale.multiplyScalar(.1)
        let makeSnake=(glb)=>{

            let sscene = SkeletonUtils.clone(glb.scene);//.clone(true)
            let rootBone =sscene.getObjectByName("Bone")
            let snek = sscene.getObjectByName("Snek")
            snek.frustumCulled = false;
            scene.attach(rootBone)
            scene.attach(snek)
            snek.material.roughness = .2;
            snek.material.metalness = .1;
            //snek.material.metalness = .95;
            snek.castShadow = snek.receiveShadow = true;
            snek.material.envMapIntensity = .4;
            //.6;
            let bones = []
            rootBone.traverse(e=>(e.type == "Bone") && (bones.push(e)))

    rootBone.position.y=ground;
    rootBone.position.set((random()-.5)*15,ground,(random()-.5)*5);
            bones.forEach((b,i)=>scene.attach(b))
            //bones.forEach((b,i)=>points[i] = b.position);

            bones.forEach(b=>b.up.set(0,0,-1).applyQuaternion(b.quaternion));
            //dbg
            //bones.forEach((b,i)=>b.add(c = mesh.clone()) && (c.scale.z=i+1)&&(c.scale.x = c.scale.y = .1) ) //&&b.add(mesh.clone()));

            //bones.forEach((b,i)=>console.log('bon:', b.name))
            //&&b.add(mesh.clone()));
            let creature = {
                limbs:[{bones,points:bones.map(b=>b.position),target:bones.at(-1).position.clone()}]
            }
            creatures.push(creature)
            
            let snakeMotion=(target,blocked,bone)=>{
                let t = performance.now()+(creature.seed*400000) / (300+creature.seed);
                let c = sin(t);
                let s = cos(t);
                if(bone&&(!blocked)) dir.set(0,0,1).applyQuaternion(bone.quaternion)
                target.set((s * .2) - .002, .1, blocked ? -.001 : dir.z<-0.25?-.01:.03);
                //        target1.set(Math.cos(t * 15.7) , Math.sin(t * 18.3), -Math.cos(t *19.2)).multiplyScalar(.3);
                //      target.add(target1)
                let maxVel = .3;
                if (target.length() > maxVel)
                    target.setLength(maxVel) 
            }
            creature.limbs[0].update = snakeMotion;
            creature.seed = (random()+1.0)*3;
        }
        for(let i=0;i<1;i++)makeSnake(glb)
        //makeSnake(glb)
    }
    )

    return solveFabrik;
}
