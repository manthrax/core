export default function CameraShake({THREE, camera}) {
    let {random, sin, cos} = Math;
    let saveCameraPos = new THREE.Vector3()
    let cameraWobble = new THREE.Vector3()
    let tmp = new THREE.Vector3()
    let time;

    let decay = 0.98
    let speed = 3.3
    let magnitude = 4
    let endTime = Infinity;
    let isEnabled = false;
    let beforeRender = (e)=>{
        if(magnitude<.001) return;
        time = performance.now() / 1000.;
        saveCameraPos.copy(camera.position)
        let wob = (freq,scale,p)=>{
            return p.set(sin(time * speed * freq), cos(time * freq * speed * 1.3), -sin(time * freq * speed * .8)).multiplyScalar(scale);
        }
        wob(20., magnitude * .01, cameraWobble).add(wob(50., magnitude * .005, tmp))
        camera.position.add(cameraWobble)
    }

    let afterRender = (e)=>{
        if(magnitude<.001) return;

        camera.position.copy(saveCameraPos)
        if(time>endTime){
            cs.enabled = false;
        }
        magnitude *= decay;
    }

    document.addEventListener('keydown',(e)=>{
        (e.code=='KeyG') && cs.impact(10,5,.98,2)
    })

    let cs = {
        set camera(c) {
            camera = c;
        },
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

    cs.enabled = false;
    return cs;
}
