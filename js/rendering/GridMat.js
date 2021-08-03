export default function GridMat({THREE}){
let gridMat = new THREE.ShaderMaterial({
        opacity: .5,
        transparent: true,
        //depthTest: false
        depthWrite: false,
        extensions:{derivatives:true},
        fragmentShader:`
varying vec3 vertex;
varying vec3 vPosition;
void main() {
  vec2 grid = abs(fract(vertex.xz - 0.5) - 0.5) / fwidth(vertex.xz);
  float line = min(grid.x, grid.y);
  float ring = 1.-min(1.,length(vPosition.xy)/30.);
  line = (1.0 - min(line, 1.0))*.25;
  gl_FragColor = vec4(vec3(1.,1.,0.),  min(.5,min(ring,line)));
}
`
    })
gridMat.vertexShader = `varying vec3 vertex; varying vec3 vPosition;
` + gridMat.vertexShader.replace('gl_Position',`
vPosition = position.xyz;
vertex = (modelMatrix * vec4( position, 1.0 )).xyz;
gl_Position`);
    return gridMat;
}