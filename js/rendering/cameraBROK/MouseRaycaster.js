export default function MouseRaycaster(THREE){
    const mouse = new THREE.Vector2();
    let raycaster = new THREE.Raycaster()
    this.raycast = ({event,camera,root,recursive=true})=>{
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera)
        if(typeof root === 'array')
            return  raycaster.intersectObjects(root, recursive);
        return raycaster.intersectObject(root, recursive);
    }
}
