import {XRControllerModelFactory} from 'https://threejs.org/examples/jsm/webxr/XRControllerModelFactory.js';

class TeleportControls {
    constructor({THREE, renderer, scene, cameras, vrRoot}) {
        let {random, abs, PI, min, max} = Math;
        let teleporting = false;
        let teleportComplete = false;
        let teleportCountdown = 0;

        let tpPathSpline

        let remoteView = cameras.current.clone();
        //new THREE.PerspectiveCamera()
        remoteView.aspect = 1;
        remoteView.updateProjectionMatrix();
        scene.add(remoteView);
        let remoteRenderTarget = new THREE.WebGLRenderTarget(256,256,{
            wrapS: THREE.RepeatWrapping,
            wrapT: THREE.RepeatWrapping,
            minFilter: THREE.NearestFilter,
            //magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType,
            stencilBuffer: false,
            depthBuffer: true,
        })
        let mask = new THREE.TextureLoader().load('assets/circlemask.jpg');
        remoteRenderTarget.texture.encoding = THREE.sRGBEncoding;
        let remoteRenderProxy = new THREE.Sprite(new THREE.SpriteMaterial({
            map: remoteRenderTarget.texture,
            alphaMap: mask,
            transparent: true
        }))
        scene.add(remoteRenderProxy)
        remoteView.position.set(0, .5, 0);
        remoteRenderProxy.position.copy(remoteView.position)
        remoteRenderProxy.renderOrder = 50;



        this.startTeleport = ()=>{

            remoteRenderProxy.material.opacity = 1.;
            teleporting = true;
            teleportComplete = false;
            teleportCountdown = 1;

            let start = remoteRenderProxy.position.clone()
            let mid = cameras.current.localToWorld(new THREE.Vector3(0,0,-5.5));
            let end = cameras.current.localToWorld(new THREE.Vector3(0,0,cameras.current.near * -5.1))
            tpPathSpline = new THREE.CatmullRomCurve3([start, mid, end])
        }

        document.addEventListener('keydown', (e)=>{
            if (e.code == 'KeyT') {
                this.startTeleport()
            }
        }
        )
        let v0 = new THREE.Vector3()
        const fadeStartTime = .5;
        const teleportDist = .1;

        let renderRemoteProxy=()=>{
            remoteRenderProxy.visible = false;
            let saveTarg = renderer.getRenderTarget();
            renderer.setRenderTarget(remoteRenderTarget);
            renderer.xr.enabled = false
            renderer.render(scene, remoteView);
            renderer.xr.enabled = true
            renderer.setRenderTarget(saveTarg);
            remoteRenderProxy.visible = true;
        }

        renderRemoteProxy();
        this.update = (dts)=>{
            if (teleporting) {

                teleportCountdown -= dts * .7;
                if (!teleportComplete)
                    tpPathSpline.getPoint(max(0, (1 - teleportCountdown) / (1 - fadeStartTime)), remoteRenderProxy.position);

                if (teleportCountdown < fadeStartTime) {

                    if (teleportCountdown < teleportDist) {
                        teleporting = false;
                        remoteView.position.set((random() - .5) * 100, (random() * 5) + .5, (random() - .5) * 100);

                        remoteView.lookAt(scene.position)
                        //remoteView.rotation.y = random() * PI * 2;
                        remoteRenderProxy.material.opacity = 1;
                        remoteRenderProxy.position.copy(remoteView.position)



        renderRemoteProxy();
                        
                    } else {
                        remoteRenderProxy.material.opacity = teleportCountdown / fadeStartTime;
                    }
                    if (!teleportComplete) {
                        teleportComplete = true;
                        let root = vrRoot;
                        //cameras.current
                        root.attach(remoteRenderProxy);
                        let dist = cameras.orbitControls.target.distanceTo(root.position)
                        root.position.copy(remoteView.position);
                        root.rotation.copy(remoteView.rotation);
                        root.updateMatrixWorld(true);
                        root.localToWorld(cameras.orbitControls.target.set(0, 0, -dist))
                        if (renderer.xr.isPresenting) {
                            vrRoot.position.copy(remoteView.position)
                            vrRoot.rotation.copy(remoteView.rotation)
                        }
                        scene.attach(remoteRenderProxy);

                    }
                }
                remoteRenderProxy.position.add(v0)
            }
        }

    }
}

export default class VRControls {
    constructor({THREE, renderer, scene, cameras, gestureChanged}) {
        let controller0, controller1;

        let {random, abs, PI, min, max} = Math;

        let vrRoot = new THREE.Object3D();
        scene.add(vrRoot);

        let teleportControls = new TeleportControls({
            THREE,
            renderer,
            scene,
            cameras,
            vrRoot,
        })

        let tempMatrix = new THREE.Matrix4();
        let raycaster = new THREE.Raycaster();
        this.raycastTargets = [];//scene.children
        function buildController(data) {

            let geometry, material;

            switch (data.targetRayMode) {

            case 'tracked-pointer':

                geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -1],3));
                geometry.setAttribute('color', new THREE.Float32BufferAttribute([0.5, 0.5, 0.5, 0, 0, 0],3));

                material = new THREE.LineBasicMaterial({
                    vertexColors: true,
                    blending: THREE.AdditiveBlending,
                    transparent: true
                });

                return new THREE.Line(geometry,material);

            case 'gaze':

                geometry = new THREE.RingGeometry(0.02,0.04,32).translate(0, 0, -1);
                material = new THREE.MeshBasicMaterial({
                    opacity: 0.5,
                    transparent: true
                });
                return new THREE.Mesh(geometry,material);

            }
        }

        function onSelectStart() {

            this.userData.isSelecting = true;
            teleportControls.startTeleport()

        }

        function onSelectEnd() {

            this.userData.isSelecting = false;

        }
        let connectedGamePads = {}
        let initController = (id)=>{
            let controller = renderer.xr.getController(id);
            controller.addEventListener('selectstart', onSelectStart);
            controller.addEventListener('selectend', onSelectEnd);
            controller.addEventListener('connected', function(event) {

                this.add(buildController(event.data));

            });
            controller.addEventListener('disconnected', function(event) {
                //let gamepad = event.data.gamepad;
                //if(gamepad){
                //    delete connectedGamePads[gamepad.id];
                //}

                this.remove(this.children[0]);

            });
            vrRoot.add(controller);

            const controllerModelFactory = new XRControllerModelFactory();

            let controllerGrip = renderer.xr.getControllerGrip(id);
            controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));

            vrRoot.add(controllerGrip);

            return {
                controller,
                grip: controllerGrip
            }
        }

        const gestured = []
        const gesturedMaterials = []

        let selectedMaterial = new THREE.MeshBasicMaterial({
            opacity: .5,
            color: 'yellow',
            transparent: true
        })

        let gestureObject = (object,isGestured)=>{
            if ((!isGestured) && object.userData.gestured) {
                gestured.splice(gestured.indexOf(object), 1);
                object.material = gesturedMaterials[object.uuid];
                delete gesturedMaterials[object.uuid]
            } else {
                gestured.push(object)
                gesturedMaterials[object.uuid] = object.material;
                if (object.material.color) {
                    object.material = selectedMaterial
                }
            }
            object.userData.gestured = isGestured;
        }

        let updateController = (controller)=>{

            if (controller.userData.isSelecting === true) {
                if (false && room.children.length) {
                    const cube = room.children[0];
                    room.remove(cube);

                    cube.position.copy(controller.position);
                    cube.userData.velocity.x = (Math.random() - 0.5) * 0.02 * delta;
                    cube.userData.velocity.y = (Math.random() - 0.5) * 0.02 * delta;
                    cube.userData.velocity.z = (Math.random() * 0.01 - 0.05) * delta;
                    cube.userData.velocity.applyQuaternion(controller.quaternion);
                    room.add(cube);

                }
            }
            // find intersections

            tempMatrix.identity().extractRotation(controller.matrixWorld);
            raycaster.camera = cameras.current;
            raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
            raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

            const intersects = raycaster.intersectObjects(this.raycastTargets, false);

            for (; gestured.length; )
                gestureObject(gestured[0], false)
            if (intersects.length > 0) {
                gestureObject(intersects[0].object, true);
            }
        }

        let tv0 = new THREE.Vector3()
        let tv1 = new THREE.Vector3()
        let tq0 = new THREE.Quaternion()


const GP_STICK_X = 2
const GP_STICK_Y = 3

const GP_BUTTON_TRIGGER = 0
const GP_BUTTON_GRIP = 1
const GP_BUTTON_A = 4
const GP_BUTTON_B = 5

        this.update = (dts)=>{
            teleportControls.update(dts);
            if (renderer.xr.isPresenting) {

                if (cameras.current.parent != vrRoot) {
                    vrRoot.position.copy(cameras.current.position)
                    vrRoot.rotation.copy(cameras.current.rotation)
                    vrRoot.add(cameras.current)
                }

                let frame = renderer.xr.getFrame()
                let inputSources = frame.session.inputSources;
                if (inputSources.length > 0) {

                    inputSources.forEach(input=>{
                        let gp = input.gamepad;
                        if (gp) {
                            vrRoot.getWorldQuaternion(tq0)
                            //console.log(gp.axes)
                            let axes = gp.axes;
                            let buttons = gp.buttons;
                            //let bstr=''
                            //buttons.forEach((b,i)=>(b.pressed) && (bstr+='b'+i+':'+b.value))
                            //if(bstr.length>0)console.log(bstr)

                            tv0.set(1, 0, 0).multiplyScalar(axes[GP_STICK_X])
                            if(buttons[GP_BUTTON_GRIP].pressed)
                                tv1.set(0,-1, 0).multiplyScalar(axes[GP_STICK_Y])
                            else
                                tv1.set(0, 0, 1).multiplyScalar(axes[GP_STICK_Y])
                            vrRoot.position.add(tv0.add(tv1).applyQuaternion(tq0));
                        }

                    }
                    )
                }

            } else {
                if (cameras.current.parent === vrRoot) {
                    vrRoot.remove(cameras.current)
                    cameras.current.position.copy(vrRoot.position)
                    cameras.current.rotation.copy(vrRoot.rotation)
                }
            }

            updateController(controller0.controller);
            updateController(controller1.controller);
        }

        controller0 = initController(0)
        controller1 = initController(1)

    }
}
