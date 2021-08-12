export default function Easing({THREE}) {
    let self = {}

    self.fns = function() {
        var x = Math.pow
          , C = Math.sqrt
          , T = Math.sin
          , q = Math.cos
          , B = Math.PI
          , F = 1.70158
          , M = 1.525 * F
          , Q = 2 * B / 3
          , j = 2 * B / 4.5;
        function N(t) {
            var e = 7.5625
              , n = 2.75;
            return t < 1 / n ? e * t * t : t < 2 / n ? e * (t -= 1.5 / n) * t + .75 : t < 2.5 / n ? e * (t -= 2.25 / n) * t + .9375 : e * (t -= 2.625 / n) * t + .984375
        }
        return {
            InQuad: t=>t * t,
            OutQuad: t=>1 - (1 - t) * (1 - t),
            InOutQuad: t=>t < .5 ? 2 * t * t : 1 - x(-2 * t + 2, 2) / 2,
            InCubic: t=>t * t * t,
            OutCubic: t=>1 - x(1 - t, 3),
            InOutCubic: t=>t < .5 ? 4 * t * t * t : 1 - x(-2 * t + 2, 3) / 2,
            InQuart: t=>t * t * t * t,
            OutQuart: t=>1 - x(1 - t, 4),
            InOutQuart: t=>t < .5 ? 8 * t * t * t * t : 1 - x(-2 * t + 2, 4) / 2,
            InQuint: t=>t * t * t * t * t,
            OutQuint: t=>1 - x(1 - t, 5),
            InOutQuint: t=>t < .5 ? 16 * t * t * t * t * t : 1 - x(-2 * t + 2, 5) / 2,
            InSine: t=>1 - q(t * B / 2),
            OutSine: t=>T(t * B / 2),
            InOutSine: t=>-(q(B * t) - 1) / 2,
            InExpo: t=>0 === t ? 0 : x(2, 10 * t - 10),
            OutExpo: t=>1 === t ? 1 : 1 - x(2, -10 * t),
            InOutExpo: t=>0 === t ? 0 : 1 === t ? 1 : t < .5 ? x(2, 20 * t - 10) / 2 : (2 - x(2, -20 * t + 10)) / 2,
            InCirc: t=>1 - C(1 - x(t, 2)),
            OutCirc: t=>C(1 - x(t - 1, 2)),
            InOutCirc: t=>t < .5 ? (1 - C(1 - x(2 * t, 2))) / 2 : (C(1 - x(-2 * t + 2, 2)) + 1) / 2,
            InBack: t=>2.70158 * t * t * t - F * t * t,
            OutBack: t=>1 + 2.70158 * x(t - 1, 3) + F * x(t - 1, 2),
            InOutBack: t=>t < .5 ? x(2 * t, 2) * (2 * (M + 1) * t - M) / 2 : (x(2 * t - 2, 2) * ((M + 1) * (2 * t - 2) + M) + 2) / 2,
            InElastic: t=>0 === t ? 0 : 1 === t ? 1 : -x(2, 10 * t - 10) * T((10 * t - 10.75) * Q),
            OutElastic: t=>0 === t ? 0 : 1 === t ? 1 : x(2, -10 * t) * T((10 * t - .75) * Q) + 1,
            InOutElastic: t=>0 === t ? 0 : 1 === t ? 1 : t < .5 ? -x(2, 20 * t - 10) * T((20 * t - 11.125) * j) / 2 : x(2, -20 * t + 10) * T((20 * t - 11.125) * j) / 2 + 1,
            InBounce: t=>1 - N(1 - t),
            OutBounce: N,
            InOutBounce: t=>t < .5 ? (1 - N(1 - 2 * t)) / 2 : (1 + N(2 * t - 1)) / 2
        }
    }()

    self.tv30 = new THREE.Vector3()
    self.tv31 = new THREE.Vector3()
    self.tv32 = new THREE.Vector3()
    self.tq40 = new THREE.Quaternion()
    self.tq41 = new THREE.Quaternion()
    self.te0 = new THREE.Euler()
    self.te1 = new THREE.Euler()
    self.tc0 = new THREE.Color()
    self.tc1 = new THREE.Color()

    
    self.tweenPosition = (t,a,b,c)=>{
        var v0 = self.tv30.copy(a)
        var v1 = self.tv31.copy(b)
        v0.multiplyScalar(t);
        v1.multiplyScalar(1 - t);
        c.copy(v0).add(v1)
    }

    self.tweenScale = (t,a,b,c)=>{
        self.tweenPosition(t, a, b, c)
        c.x = Math.max(0.1, c.x)
        c.y = Math.max(0.1, c.y)
        c.z = Math.max(0.1, c.z)
    }

    self.tweenQuaternion = (t,a,b,c)=>{
        var r0 = self.tq40.copy(a)
        var r1 = self.tq41.copy(b)
        c.copy(r0.rotateTowards(r1, t))
    }

    self.tweenColorHSL = (t,a,b,c)=>{
        var c0 = self.tc0.copy(a)
        var c1 = self.tc1.copy(b)
        c.copy(c0).lerpHSL(c1, t)
    }

    self.tweenEuler = (t,a,b,c)=>{
        var r0 = self.tv30.copy(a)
        var r1 = self.tv31.copy(b)
        r0.multiplyScalar(t);
        r1.multiplyScalar(1 - t);
        r0.add(r1);
        c.set(r0.x, r0.y, r0.z, a.order);
    }

    //--------------- actions *********

    class Key {
        constructor(params) {
            var {channel, easer, start, end} = params
        }
    }

    class Track {
        constructor(channel, keys) {
            this.channel = channel;
            this.keys = keys

        }
    }

    class Action {
        constructor(params) {
            this.tracks = {}
            this.track(params)
        }
        track(params) {
            for (var i in params) {
                if (!this.tracks[i])
                    this.tracks[i] = []
                this.tracks[i].push(new Track(i,params[i]));
            }
            return this;
        }
        play(target) {
            var ai = new ActionInstance(this,target)
            ActionInstance.active.push(ai);
            return ai;
        }
    }

    Action.channelInterpolators = {
        position: self.tweenPosition,
        scale: self.tweenScale,
        rotation: self.tweenEuler,
        color: self.tweenColorHSL,
    }

    class ActionInstance {
        constructor(action, target) {
            this.cursors = {};
            this.action = action;
            for (var i in action.tracks) {
                this.cursors[i] = {
                    frameTime: 0.0,
                }
            }
        }
        static update(time) {
            var active = ActionInstance.active;
            for (var i = 0; i < active.length; i++) {
                var ai = active[i];
            }

            /*
            var fn = self.fns[this.target.userData.easer];
            var val = fn(t)
            self.tweenPosition(val,mm.userData.startPosition,mm.userData.endPosition,mm.position)
            self.tweenScale(val,mm.userData.startScale,mm.userData.endScale,mm.scale)
            //self.tweenQuaternion(val,mm.userData.startRotation,mm.userData.endRotation,mm.quaternion)
            self.tweenEuler(val,mm.userData.startRotation,mm.userData.endRotation,mm.rotation)
            self.tweenColorHSL(val,mm.userData.startColor,mm.userData.endColor,mm.material.color)
            mm.material.needsUpdate = true;
*/
        }

    }

    ActionInstance.active = []

    Action.openShutAction = new Action().track({
        position: [{
            t0: 0,
            t1: 1,
            start: new THREE.Vector3(0,0,0),
            end: new THREE.Vector3(10,0,0)
        }]
    })

    self.ActionInstance = ActionInstance;
    self.Action = Action;

    // ----- test
    /*
self.ease=(from,to,fn)=>{
    new Action().track({position:[
        {t0:0,t1:1,start:from,end:to}
    ]})
}
var tween = new TWEEN.Tween(vfrom).to(vto, msec).easing(TWEEN.self.Exponential.Out).onUpdate(()=>{
    if (pass.copyUniforms)
        pass.copyUniforms[param].value = vfrom[param];
    else
        pass.uniforms[param].value = vfrom[param];
}
*/

    self.test = function(app) {
        var nfns = 0;
        var geom = new THREE.BoxBufferGeometry(1,1,1)
        var mesh = new THREE.Mesh(geom,new THREE.MeshStandardMaterial({
            roughness: 0.7,
            metalness: 0.7
        }))
        var meshes = []
        mesh.castShadow = mesh.receiveShadow = true;
        for (var fns in self.fns) {

            var fn = self.fns[fns]
              , canv = document.createElement('canvas')
            //document.body.appendChild(canv)
            canv.width = 256;
            canv.height = 256;
            canv.style = `position:absolute;left:${nfns * 32}px;top:${nfns * 24}px;z-index:1000;`
            var ctx = canv.getContext('2d')
            var dx = 1.0 / canv.width;
            var dy = 1.5 / canv.height;
            var oy = 0 | (canv.height * 0.25);
            ctx.fillStyle = 'rgba(255,255,255,1)'
            ctx.fillRect(0, 0, canv.width, canv.height)
            ctx.fillStyle = 'black'
            ctx.font = "30px Arial";
            ctx.fillText(fns, 10, 35)
            ctx.strokeStyle = 'red'
            ctx.beginPath();
            ctx.moveTo(0, oy + (0 | (fn(0) / dy)))
            for (var x = 0; x < 1.0; x += dx) {
                if (x > 1.0)
                    x = 1.0;
                ctx.lineTo(0 | ((x / dx) + 1), oy + (0 | (fn(x + dx) / dy)))
            }
            ctx.stroke();
            var m = mesh.clone();
            m.material = mesh.material.clone()
            m.material.map = new THREE.CanvasTexture(canv);
            meshes.push(m)

            var spacingx = 3.0;
            var spacing = 2.4;
            var px = ((((nfns % 3) | 0) - 1) * spacingx);
            var py = ((((nfns / 3) | 0) - 4) * spacing);
            m.position.x = px;
            m.position.z = py;
            app.scene.add(m);
            m.userData.easer = fns;

            m.userData.startPosition = m.position.clone()
            m.userData.endPosition = m.position.clone()
            m.userData.endPosition.y = 4.0;

            m.userData.startScale = m.scale.clone()
            m.userData.endScale = m.scale.clone().multiplyScalar(2)

            m.userData.startQuaternion = m.quaternion.clone()
            m.userData.endQuaternion = m.quaternion.clone().setFromAxisAngle(new THREE.Vector3(0,1,0), 90)
            m.userData.startRotation = m.rotation.clone()
            m.userData.endRotation = m.rotation.clone()
            m.userData.endRotation.y = Math.PI * 2;

            m.userData.startColor = m.material.color.clone();
            m.userData.endColor = m.material.color.clone();
            m.userData.startColor.setHSL(Math.random(), 1.0, 0.5)
            //        m.userData.endColor.setHSL(Math.random(),1.0,0.5)
            nfns++;
        }
        app.scene.add(mesh)
        mesh.scale.set(10, 0.25, 26)
        mesh.position.set(0, -0.65, 0)

        app.scene.traverse((e)=>{
            console.log(e.name)
        }
        )

        app.listen('frameTick', function(app) {
            var scene = app.scene;

            var frScale = 1.0 / 320;
            var t = (Math.abs(app.currentFrame * frScale) % 1)

            //use clipped sawtooth wave to drive tween tests
            t = (Math.abs((t - 0.5) * 4.0)) - 0.5
            t = Math.max(Math.min(1, t), 0);
            //console.log(t)

            for (var i = 0; i < meshes.length; i++) {
                var mm = meshes[i];
                var fn = self.fns[mm.userData.easer];
                var val = fn(t)
                self.tweenPosition(val, mm.userData.startPosition, mm.userData.endPosition, mm.position)
                self.tweenScale(val, mm.userData.startScale, mm.userData.endScale, mm.scale)
                //self.tweenQuaternion(val,mm.userData.startRotation,mm.userData.endRotation,mm.quaternion)
                self.tweenEuler(val, mm.userData.startRotation, mm.userData.endRotation, mm.rotation)
                self.tweenColorHSL(val, mm.userData.startColor, mm.userData.endColor, mm.material.color)
                mm.material.needsUpdate = true;
                //  mm.position.y = val*2;
            }

            ActionInstance.update(t)
        })
    }

    //self.test();
    return self;
}
