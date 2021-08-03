export default function CameraShake({THREE, camera}) {
    let {random, sin, cos} = Math;
    let saveCameraPos = new THREE.Vector3()
    let cameraWobble = new THREE.Vector3()
    let tmp = new THREE.Vector3()
    let time;

    let decay = 1.
    let speed = 1.3
    let magnitude = 1
    let endTime = Infinity;
    let beforeRender = (e)=>{
        time = performance.now() / 1000.;
        saveCameraPos.copy(camera.position)
        let wob = (freq,scale,p)=>{
            return p.set(sin(time * speed * freq), cos(time * freq * speed * 1.3), -sin(time * freq * speed * .8)).multiplyScalar(scale);
        }
        wob(20., magnitude * .01, cameraWobble).add(wob(50., magnitude * .005, tmp))
        camera.position.add(cameraWobble)
    }

    let afterRender = (e)=>{
        camera.position.copy(saveCameraPos)
        if(time>endTime){
            cs.enabled = false;
        }
        magnitude *= decay;
    }

    document.addEventListener('keydown',(e)=>{
        (e.code=='KeyG')&&cs.impact(10,1,.98,2)
    })

let isEnabled = false;
    let cs = {
        set enabled(tf) {
            let fn = tf ? 'addEventListener' : 'removeEventListener'
            if(isEnabled!=tf){
                document[fn]('before-render', beforeRender)
                document[fn]('after-render', afterRender)
            }
            isEnabled = tf;
        },
        impact:(_intensity,_speed,_decay,_duration)=>{
            magnitude = _intensity;
            speed = _speed;
            decay = _decay;
            endTime = performance.now() + _duration;
            cs.enabled = true;
        }
    }
    cs.enabled = true;
    return cs;
}
