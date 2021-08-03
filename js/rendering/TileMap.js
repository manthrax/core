import {InstanceGroup, InstanceCache} from './InstanceGroup.js'

function TileMap(THREE, atlas) {

    class Sprite extends THREE.Object3D {
        constructor(igroup) {
            super()
            this.instanceGroup = igroup;
            //this.instancedMesh = igroup.mesh;
            //this.updateInstanceMatrix();

            this.userData.instanceIndex = igroup.alloc();
        }
        updateInstanceMatrix() {
            this.instanceGroup.mesh.setMatrixAt(this.userData.instanceIndex, this.matrix);
            this.instanceGroup.mesh.instanceMatrix.needsUpdate = true;
        }
        setInstanceColor(cr) {
            let id = this.userData.instanceIndex * 3;
            let ca = this.instanceGroup.mesh.instanceColor.array
            if (typeof cr === 'number') {
                ca[id] = ((cr / 65536) & 255) / 255
                ca[id + 1] = ((cr / 256) & 255) / 255
                ca[id + 2] = (cr & 255) / 255
            } else {
                ca[id] = cr.x;
                ca[id + 1] = cr.y;
                ca[id + 2] = cr.z;
            }
            this.instanceGroup.mesh.instanceColor.needsUpdate = true;
        }

    }

    let tm = {
        atlas,
        Sprite
    }
    let plane = new THREE.PlaneGeometry(1.001,1.001);
    let tileMat = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        color: 0xffffff,//'red',
        depthWrite:false,
        
    })
    tm.cache = new InstanceCache(plane,tileMat,1024)

let sv = console.error;
console.error = function(){

    sv(...arguments)
if(arguments[0].indexOf("THREE.WebGLProgram: shader error: ")==0){
 let err = arguments[6]
 let cks=err.split(':')
 let errcol = cks[2]
 let errlineno = cks[3]
 let eline=err.slice(err.lastIndexOf(Math.max(1,errlineno-2)+": "))
 let ergn = eline.split('\n').slice(0,5).join('\n')
    sv("Shader error:\n",err.slice(0,err.indexOf('1:'))+ergn);
    //console.error = sv;
}else{
}
}
    tm.cache.mesh.material.onBeforeCompile=function(shader,renderer){
        //shader.vertexShader = shader.vertexShader + 'xxxx'
    }
    tm.update = function() {
        if (this.needsUpdate) {
        }
    }
    return tm;
}

export default TileMap;
