export default function createGridPlane(options) {
    let {THREE} = options;
    let {Mesh, PlaneGeometry, CircleGeometry, ShaderMaterial, Vector4} = THREE;
    let {pow, round, log, PI} = Math;
    let defaults = {
        gridSpacing: .1,
        radius: 50,
        color: new Vector4(1,1,1,.25)
    }
    let params = {
        ...defaults,
        ...options,
    }
    let {color, gridSpacing, radius, camera} = params;
    let ffmt = (f)=>(f + '').indexOf('.') >= 0 ? f : f + '.'
    let gridMat = new ShaderMaterial({
        opacity: .5,
        transparent: true,
        //depthTest: false
        depthWrite: false,
        uniforms: {
            uColor: {
                value: params.color
            },
            uGridSpacing: {
                value: params.gridSpacing
            },
            uRadius: {
                value: params.radius
            }
        },
        extensions: {
            derivatives: true
        },
        fragmentShader: `
      varying vec3 vertex;
      varying vec3 vPosition;
      uniform vec4 uColor;
      uniform float uRadius;

      float computeGrid(vec2 vertex){
          vec2 grid = abs(fract(vertex - 0.5) - 0.5) / fwidth(vertex);
          return min(grid.x, grid.y);
      }

      void main() {
        float ring = 1.-min(1.,length(vPosition.xy) / uRadius);
        ring *= ring;

        float line = computeGrid(vertex.xz);
        line = (1.0 - min(line, 1.0))*.25;
        gl_FragColor = vec4( uColor.rgb , uColor.a * min(.5,min(ring,line)));


        float z = smoothstep(10.1,.0,gl_FragCoord.z / gl_FragCoord.w);
        gl_FragColor.a*=z;//fract(z);
        //line = max( line, line1 * .1 * ,z) );
      }
  `
    })
    gridMat.vertexShader = `
    varying vec3 vertex; varying vec3 vPosition;
    uniform float uGridSpacing;
  ` + gridMat.vertexShader.replace('gl_Position', `
    vPosition = position.xyz;
    vertex = (modelMatrix * vec4( position, 1.0 )).xyz / uGridSpacing;
    gl_Position`);
    //let grid = new Mesh(new PlaneGeometry(100,100),gridMat)
    let grid = new Mesh(new CircleGeometry(100,16),gridMat)
    grid.frustumCulled = false;
    function nearestPow2(aSize) {
        return pow(2, round(log(aSize) / log(2)));
    }
    if (camera)
        grid.onBeforeRender = function() {
            this.position.set(camera.position.x, 0, camera.position.z);
            let npot = nearestPow2(camera.position.y) * .1
            this.material.uniforms.uGridSpacing.value = npot;
        }
    grid.rotation.x = -PI * .5;



    let cnv = document.createElement('canvas').getContext('2d')
    let dim =256;
    cnv.canvas.width=cnv.canvas.height=128;
    cnv.clearRect(0,0,dim,dim);
    cnv.strokeStyle='white'
    cnv.moveTo(0,0)
    cnv.lineTo(0,dim)
    cnv.moveTo(0,0)
    cnv.lineTo(dim,0)
    cnv.stroke();
    let grid2 = new Mesh(new PlaneGeometry(1000,1000),new THREE.MeshBasicMaterial({
        map:new THREE.CanvasTexture(cnv.canvas)
    }))
    grid2.position.x += 500;
    let m=grid2.material.map
    m.repeat.multiplyScalar(100000)
    m.wrapS=m.wrapT=THREE.RepeatWrapping;
    m.magFilter=THREE.NearestFilter;
   //grid2.rotation.x = -PI * .5;
//    grid.add(grid2)

    return grid;
}
