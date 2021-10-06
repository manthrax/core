import App3 from "../../App3.js"
let app = App3.getApp()
let {THREE} = app;
let defPrimMaterial = new THREE.MeshStandardMaterial({
    color: "orange",
    transparent:true,
    opacity:.5,
    depthWrite:false
})
var unitPlane = new THREE.Mesh(new THREE.PlaneBufferGeometry(1,1),defPrimMaterial);
var unitCube = new THREE.Mesh(new THREE.BoxBufferGeometry(1,1,1,1,1),defPrimMaterial);
var unitSphere = new THREE.Mesh(new THREE.SphereBufferGeometry(0.5,32,32),defPrimMaterial);
var unitTorus = new THREE.Mesh(new THREE.TorusBufferGeometry(1,.2,12,60),defPrimMaterial);
let prims = {
    unitPlane,
    unitCube,
    unitTorus,
    unitSphere
};
for(let f in prims){prims[f].castShadow = prims[f].receiveShadow = true}
app.prims = prims;
export default prims;


