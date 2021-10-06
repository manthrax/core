let PhysicsShapes = {}
let DEBUG = 0

PhysicsShapes.init = app=>{
    let {THREE, scene} = app
    let tempBtVec3_1 = new Ammo.btVector3(0,0,0);
    function createConvexHullPhysicsShape(coords) {
        var shape = new Ammo.btConvexHullShape();

        for (var i = 0, il = coords.length; i < il; i += 3) {
            tempBtVec3_1.setValue(coords[i], coords[i + 1], coords[i + 2]);
            var lastOne = i >= il - 3;
            shape.addPoint(tempBtVec3_1, lastOne);
        }

        return shape;
    }

    function Float32Concat(first, second) {
        var firstLength = first.length
          , result = new Float32Array(firstLength + second.length);
        result.set(first);
        result.set(second, firstLength);
        return result;
    }

    function createConvexHullPhysicsShapeFromMesh(obj) {
        let allTris = flattenedGeometry(obj)
        let raw = []
        for (let i = 0; i < allTris.length; i++) {
            raw.push(allTris[i].x, allTris[i].y, allTris[i].z)
        }
        return createConvexHullPhysicsShape(raw)
    }
    let btv30 = new Ammo.btVector3(0,0,0)

    function createGhost(object, physicsShape) {
        let ghostObj = new Ammo.btGhostObject()
        ghostObj.setCollisionShape(physicsShape);
        physicsWorld.addCollisionObject(ghostObj);
        var btVecUserData = new Ammo.btVector3(0,0,0);
        btVecUserData.physicsData = object.userData.physics;
        ghostObj.setUserPointer(btVecUserData)
    }

    let mkV3 = ()=>new THREE.Vector3();

    let mkTBtV3 = (mat,vt)=>{
        tv30.copy(vt);
        tv30.applyMatrix4(mat);
        return new Ammo.btVector3(tv30.x,tv30.y,tv30.z);
    }
    ;
    let mkBtV3 = vt=>{
        return new Ammo.btVector3(vt.x,vt.y,vt.z);
    }
    
    let v32ToBt3 = vt=>{
        return new Ammo.btVector3(vt.x,vt.y,vt.z);
    }
    

    let vv0 = mkV3();
    let vv1 = mkV3();
    let vv2 = mkV3();
    let va = mkV3();
    let vb = mkV3();
    let array2v3 = (arr,vec)=>vec.set(arr[0], arr[1], arr[2]);
    let cross = mkV3();
    let triangleArea = (v0,v1,v2)=>{
        array2v3(v0, vv0);
        array2v3(v1, vv1);
        array2v3(v2, vv2);
        va.copy(vv1).sub(vv0);
        vb.copy(vv2).sub(vv0);
        va.cross(vb);
        return va.length();
    }
    ;
    let tvpos = new THREE.Vector3();
    let tvscale = new THREE.Vector3()
    let tvrot = new THREE.Quaternion()

    let triangleIterator = (geometry)=>{
        return {
            geometry,
            get numFaces() {
                return (this.geometry.isBufferGeometry) ? ((this.geometry.index ? this.geometry.index.array.length : this.geometry.attributes.position.array.length) / 3) | 0 : geometry.faces.length
            },
            get numVertices() {
                return (this.geometry.isBufferGeometry) ? this.geometry.attributes.position.array.length : this.geometry.vertices.length
            },
            getVertex(idx, v) {
                if (this.geometry.isBufferGeometry) {
                    let vp = this.geometry.attributes.position.array;
                    idx *= 3;
                    v.set(vp[idx], vp[idx + 1], vp[idx + 2])
                } else
                    v.copy(this.geometry.vertices[idx])
            },
            getFace(idx, va, vb, vc) {
                if (this.geometry.isBufferGeometry) {
                    if (this.geometry.index) {
                        let index = this.geometry.index.array
                        idx *= 3;
                        this.getVertex(index[idx], va);
                        this.getVertex(index[idx + 1], vb);
                        this.getVertex(index[idx + 2], vc);
                    } else {
                        idx *= 3;
                        this.getVertex(idx, va);
                        this.getVertex(idx + 1, vb);
                        this.getVertex(idx + 2, vc);
                    }
                } else {
                    let f = this.geometry.faces[idx];
                }
            },
            getAllTriangles() {
                let nfaces = this.numFaces
                let arry = new Array(nfaces * 3)
                for (let i = 0; i < arry.length; i++)
                    arry[i] = new THREE.Vector3()
                for (let i = 0, v = 0; i < nfaces; i++,
                v += 3)
                    this.getFace(i, arry[v], arry[v + 1], arry[v + 2])
                return arry;
            }
        }
    }

    class bt3Vec {
        get x() {
            return bt.x()
        }
        get y() {
            return bt.y()
        }
        get x() {
            return bt.z()
        }
        get array() {
            return [this.x, this.y, this.z]
        }
        constructor(bt) {
            this._bt = bt;
        }
    }

    let tva = new THREE.Vector3();
    let tvb = tva.clone()
    let tvc = tva.clone()

    let flattenedGeometry = (root)=>{
        let save = {
            position: root.position.clone(),
            rotation: root.rotation.clone(),
            scale: root.scale.clone(),
            parent: root.parent
        }
        if (root.parent)
            root.parent.remove(root)
        root.position.set(0, 0, 0)
        root.rotation.set(0, 0, 0, 'XYZ')
        root.scale.set(1, 1, 1)
        root.updateMatrixWorld();
        let bb = new THREE.Box3().setFromObject(root);
        bb.getCenter(root.position).multiplyScalar(-1)
        //let btData = srcMesh.userData.physics;
        let allTris = []
        root.traverse(e=>{
            if (e.isMesh) {
                let srcMesh = e;
                var geo = srcMesh.geometry;
                srcMesh.matrixWorld.decompose(tvpos, tvrot, tvscale)
                let tris = triangleIterator(geo).getAllTriangles()
                for (let i = 0, len = tris.length; i < len; i++)
                    tris[i].applyMatrix4(srcMesh.matrixWorld)
                allTris = allTris.concat(tris)
            }
        }
        )
        if (save.parent)
            save.parent.add(root)
        root.position.copy(save.position)
        root.rotation.copy(save.rotation)
        root.scale.copy(save.scale)
        root.updateMatrixWorld();
        return allTris;
    }

    let indexTriangles = (tris)=>{
        let index = []
        let map = {}
        let vertices = []
        for (let i in tris) {
            let v = tris[i]
            let key = `${v.x}|${v.y}|${v.z}`
            let f = map[key]
            if (f)
                index.push(f)
            else
                map[key] = vertices.push(v) - 1;

        }
        let fvertices = new Float32Array(vertices.length * 3)
        let w = 0;
        for (let i in vertices) {
            let v = vertices[i]
            fvertices[w++] = v.x
            fvertices[w++] = v.y
            fvertices[w++] = v.z
        }
        return {
            index: new Uint32Array(index),
            vertices: fvertices
        }
    }

    let totalTime = 0;

    let makeBvhTriangleMesh = ({root, use32bitIndices=true, use4componentVertices=false, isStatic=true, areaMinThreshhold=0, areaThreshhold=Infinity, margin})=>{
        let tstart = performance.now()
        let allTris = flattenedGeometry(root)
        let indexed = indexTriangles(allTris)
//console.log(allTris.length,indexed)
//btTriangleIndexVertexArray (int numTriangles, int *triangleIndexBase, int triangleIndexStride, int numVertices, btScalar *vertexBase, int vertexStride)
//let tiva = new Ammo.btTriangleIndexVertexArray(indexed.index.length/3,indexed.index ,4,indexed.vertices.length/3,indexed.vertices,12) 
/*
let triMesh = new Ammo.btTriangleMesh(use32bitIndices,use4componentVertices);
triMesh.preallocateVertices(allTris.length)
triMesh.preallocateIndices(allTris.length)
rtn = new Ammo.btBvhTriangleMeshShape(tiva,true,false);
*/

        let triMesh = new Ammo.btTriangleMesh(use32bitIndices,use4componentVertices);
        let nbt3 = (vt)=>new Ammo.btVector3(vt.x,vt.y,vt.z)

        if (false && triMesh.findOrAddVertex && triMesh.addIndex) {
            //this doesnt work.
            let vts = indexed.vertices;
            for (let i = 0, il = vts.length; i < il; i += 3)
                triMesh.findOrAddVertex(new Ammo.btVector3(vts[i],vts[i + 1],vts[i + 2]));

            let index = indexed.index;
            for (let i = 0, il = index.length; i < il; i++)
                triMesh.addIndex(index[i])

        } else {

            allTris = allTris.map(vt=>nbt3(vt))
            for (let i = 0; i < allTris.length; i += 3)
                triMesh.addTriangle(allTris[i], allTris[i + 1], allTris[i + 2])
        }

        let quantize = false;
        let buildBVH = true;
        let rtn = new Ammo.btBvhTriangleMeshShape(triMesh,quantize,buildBVH);

        totalTime += performance.now() - tstart;
        //console.log(totalTime)

        rtn.setLocalScaling(nbt3(root.scale));

        return rtn
    }
let {max,min}=Math;

let debugPrimitive
    function createTerrainShape(params) {
        let {shapeScale,terrainWidth,terrainDepth,heightFn=(x,y,p)=>{heightData[p]}}=params;
        // This parameter is not really used, since we are using PHY_FLOAT height data type and hence it is ignored
        var heightScale = 1;
        // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
        var upAxis = 1;
        // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
        var hdt = "PHY_FLOAT";
        // Set this to your needs (inverts the triangles)
        var flipQuadEdges = false;
        // Creates height data buffer in Ammo heap
        let ammoHeightData = Ammo._malloc( 4 * terrainWidth * terrainDepth );
        // Copy the javascript height data array to the Ammo one.
        var p = 0;
        var p2 = 0;
        let terrainMinHeight=Infinity;
        let terrainMaxHeight=-Infinity;
        for ( var j = 0; j < terrainDepth; j ++ ) {
            for ( var i = 0; i < terrainWidth; i ++ ) {
                // write 32-bit float data to memory
                let height = heightFn(i,j,p)
                terrainMinHeight = min(terrainMinHeight,height)
                terrainMaxHeight = max(terrainMaxHeight,height)
                Ammo.HEAPF32[ammoHeightData + p2 >> 2] = height;//heightData[ p ];
                p ++;
                // 4 bytes/float
                p2 += 4;
            }
        }
        //terrainMinHeight = 0
        //terrainMaxHeight = 32767
        terrainMinHeight = 0
        terrainMaxHeight = 1
        var scaleX = params.shapeScale.x / ( terrainWidth - 1 );
        var scaleZ = params.shapeScale.z / ( terrainDepth - 1 );

        if(DEBUG){
            let g = new THREE.PlaneBufferGeometry(1,1,terrainWidth-1,terrainDepth-1)
            debugPrimitive = new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'green',flatShading:true}))
            g.rotateX(Math.PI*-.5)
            let v = g.attributes.position.array
            let wr=1;
            let yoffset = terrainMaxHeight-terrainMinHeight
            let hbase = (ammoHeightData>>2)
            for(let i=0;i<terrainWidth;i++)
            for(let j=0;j<terrainDepth;j++,wr+=3)
            v[wr]=Ammo.HEAPF32[hbase + ((i*terrainWidth)+j) ];// - yoffset
            g.computeVertexNormals();
            g.computeFaceNormals();
        }
        // Creates the heightfield physics shape
        var heightFieldShape = new Ammo.btHeightfieldTerrainShape(

            terrainWidth,
            terrainDepth,

            ammoHeightData,

            heightScale,
            terrainMinHeight,
            terrainMaxHeight,

            upAxis,
            hdt,
            flipQuadEdges
        );

        // Set horizontal scale
        heightFieldShape.setLocalScaling( new Ammo.btVector3( scaleX, params.shapeScale.y, scaleZ ) );

        heightFieldShape.setMargin( 0.05 );


        return heightFieldShape;

    }

    let saveRot = new THREE.Euler()
    let savePos = new THREE.Vector3()
    let saveParent;

    
    let createCapsuleShape = (radius,height,axis='y')=>new Ammo[axis=='y'?'btCapsuleShape':axis=='x'?"btCapsuleShapeX":"btCapsuleShapeZ"](radius,height);
    let createSphereShape = (radius)=>new Ammo.btSphereShape(radius)
    let createBoxShape = (width,height,depth)=>new Ammo.btBoxShape(new Ammo.btVector3(width,height,depth))

    let dbgBox = new THREE.Mesh(new THREE.BoxBufferGeometry(),new THREE.MeshStandardMaterial({
        color: 'teal',
        transparent: true,
        depthWrite: false,
        opacity: .5
    }))

    function createShape(root, params={}) {
        let {type='box', margin=0.005, shapeScale=new THREE.Vector3(1,1,1), areaMinThreshhold=0.0, areaThreshhold=Infinity, //areaMinThreshhold=0.0001,
        //areaThreshhold=0.005,
        shape} = params

        savePos.copy(root.position);
        saveRot.copy(root.rotation);
        root.position.set(0, 0, 0)
        root.rotation.set(0, 0, 0);
        root.updateMatrixWorld();
        let bx = new THREE.Box3().setFromObject(root);
        let center = bx.getCenter(root.userData.localOrigin = new THREE.Vector3());
        root.matrixWorld.decompose(tvpos, tvrot, tvscale)
        center.x *= tvscale.x;
        center.y *= tvscale.y;
        center.z *= tvscale.z;
        center.add(tvpos);

        if (type == 'convex') {
            shape = createConvexHullPhysicsShapeFromMesh(root);
        } else if (type == 'box') {
            shape = createBoxShape((bx.max.x - bx.min.x) * .5, (bx.max.y - bx.min.y) * .5, (bx.max.z - bx.min.z) * .5);
        } else if (type == 'sphere') {
            shape = createSphereShape((bx.max.sub(bx.min).length() / 2) / 1.7320508075688772);
        } else if (type == 'capsule') {
            shape = createCapsuleShape(params.radius || (bx.max.y - bx.min.y), params.height || .25, params.axis);
        } else if (type == 'mesh') {
            shape = makeBvhTriangleMesh({
                root,
                areaMinThreshhold,
                areaThreshhold
            });
        } else if (type == 'heightfield') {
            shape = createTerrainShape({
                scale:root.scale,
                shapeScale,
                terrainWidth:params.terrainWidth||32,
                terrainDepth:params.terrainHeight||32,
                heightFn:params.heightFn||((x,y,p)=>{
                    let v =  (Math.sin(x*.23)*Math.cos(y*.24)*4)
                    return v;
                })//Math.sin(x/(y+1)*10.0001)*3.;}
            });
        }else{
            console.warn("Unknown physics object type:",type)
        }
        //delete root.userData.localOrigin;
        root.userData.bounds = bx.clone();
        root.position.copy(savePos);
        root.rotation.copy(saveRot);
        root.updateMatrixWorld();

        if (DEBUG) {
            let m;
            if(debugPrimitive){
                m = debugPrimitive
                m.castShadow = m.receiveShadow= true
            }else{
                 m = dbgBox.clone()
                bx.getSize(m.scale).multiplyScalar(1.03)
                bx.getCenter(m.position)
            }
            root.add(m)
            m.updateMatrix()
            m.updateMatrixWorld()
            debugPrimitive = null
        }
        // shape.setMargin(margin);
        return shape;
    }

    app.physicsShapes = PhysicsShapes;
    PhysicsShapes.createShape = createShape

}

export default PhysicsShapes;

