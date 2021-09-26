
    let  scene, renderer, controls;//camera,
    let clock;
    let aspect = window.innerWidth / window.innerHeight;
    



    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        //alpha: true,
        //logarithmicDepthBuffer:true
    });

    //renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMapping = THREE.LinearToneMapping;
   //renderer.toneMapping = THREE.ReinhardToneMapping;
    //CineonToneMapping;//ReinhardToneMapping// 
    //LinearEncoding;//sRGBEncoding;

    //renderer.toneMapping = THREE.ACESFilmicToneMapping;
    //CineonToneMapping;//ReinhardToneMapping// 
    //LinearEncoding;//sRGBEncoding;
    renderer.toneMappingExposure = .5;

    //renderer.toneMappingExposure = .25;
    renderer.outputEncoding = THREE.sRGBEncoding

    renderer.setClearColor("black", 1);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

/*
    camera = new THREE.PerspectiveCamera(90,window.innerWidth / window.innerHeight,0.1,10000);
    let csz = 640
    //camera = new THREE.OrthographicCamera(-csz,csz,csz,-csz,-1000,1000);
    camera.position.copy({
        x: -0.7965422346052364,
        y: 1.656460008711307,
        z: -0.8481421792924781
    });
    camera.position.set(10, 10, 10);
*/

    let cameraControls = new CameraControls({scene,renderer})

    //camera = cameraControls.multiCamera.camera;
    
    controls = cameraControls.orbitControls;
