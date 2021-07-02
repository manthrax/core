export default function GridMat({THREE}){
let gridMat = new THREE.ShaderMaterial({
        opacity: .5,
        transparent: true,
        //depthTest: false
        depthWrite: false,
        extensions:{derivatives:true},
        fragmentShader:`
varying vec3 vertex;
void main() {
  vec2 grid = abs(fract(vertex.xz - 0.5) - 0.5) / fwidth(vertex.xz);
  float line = min(grid.x, grid.y);
  gl_FragColor = vec4(vec3(1.,1.,0.), (1.0 - min(line, 1.0))*.25);
}
`
    })
gridMat.vertexShader = `varying vec3 vertex;
` + gridMat.vertexShader.replace('gl_Position','vertex = (modelMatrix * vec4( position, 1.0 )).xyz; gl_Position',);
    return gridMat;
}