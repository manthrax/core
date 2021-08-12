import Easing from "../math/Easing.js"

export default function PostFX(THREE,postProcessing){
    let ctx=postProcessing
    let easing = new Easing({
        THREE
    });
    let tweens = []
    function Tween(src) {
        let t = {
            to: (dst,duration)=>{
                t.dst = dst;
                t.duration = duration;
                return t;
            }
            ,
            easing: (e)=>{
                t.fn = easing.fns[e];
                return t;
            }
            ,
            onUpdate: (fn)=>{
                t.onUpdate = fn;
                return t;
            }
            ,
            onDone: (fn)=>{
                t.onDone = fn;
                return t;
            }
            ,
            start: ()=>{
                t.startTime = performance.now();
                t.endTime = t.startTime + t.duration;
                (!t.started) && (t.started = true) && tweens.push(t);
                t.isrc = {
                    ...src
                };
                return t;
            }
            ,
            src
        }

        return t;
    }

    document.addEventListener('before-render', ()=>{
        let t = performance.now();
        let top;
        for (let i = 0, tw; (i < tweens.length) && (tw = tweens[i]); i++) {
            let lt = (t - tw.startTime) / tw.duration;
            lt = tw.fn(lt);
            let ilt = 1. - lt;
            for (let f in tw.isrc)
                tw.src[f] = (tw.isrc[f] * ilt) + (tw.dst[f] * lt);

            tw.onUpdate && tw.onUpdate()
            if (t > tw.endTime) {
                top = tweens.pop();
                tweens[i] && (tweens[i] = top) && i--;
                tw.onDone && tw.onDone()
            }
        }
    }
    )

    ctx.tweenPost = function(passName, param, src, dst, msec) {
        var pass = this.passes[`${passName}Pass`];
        var vfrom = {};
        var vto = {};
        vfrom[param] = src;
        vto[param] = dst;
        this.activePasses[passName] = true;
        var tween = new Tween(vfrom).to(vto, msec).easing('OutExpo').onUpdate(()=>{
            if (pass.copyUniforms)
                pass.copyUniforms[param].value = vfrom[param];
            else
                pass.uniforms[param].value = vfrom[param];
        }
        ).start();
        return tween;
    }

    ctx.cutToBlack = function(disable) {
        if(disable)
            ctx.setPassParam('brightnessContrast');
        else{
            ctx.setPassParam('brightnessContrast', 'brightness', -1);
            ctx.setPassParam('brightnessContrast', 'contrast', 0);
        }
    }
    ctx.fadeWorld = function(fadeIn, ondone, fadeDurationMSec = 2000) {
        var src, dst;
        this.engine.renderingWasEnabled = this.engine.renderingEnabled;
        this.engine.renderingEnabled = true;

        //We now thaw physics when the welcome screen is dismissed
        // this.engine.simulationWasEnabled = this.engine.simulationEnabled;
        // this.engine.simulationEnabled = true;

        if (fadeIn) {
            // fading in..
            ctx.setPassParam('brightnessContrast', 'brightness', -1);
            ctx.setPassParam('brightnessContrast', 'contrast', 0);
        } else {
            ctx.setPassParam('brightnessContrast', 'brightness', 0);
            ctx.setPassParam('brightnessContrast', 'contrast', 0);
        }
        src = fadeIn ? -1 : 0;
        dst = fadeIn ? 0 : -1;
        ctx.tweenPost('brightnessContrast', 'brightness', src, dst, fadeDurationMSec);
        src = fadeIn ? 0 : 0;
        dst = fadeIn ? 0 : 0;
        ctx.tweenPost('brightnessContrast', 'contrast', src, dst, fadeDurationMSec).onDone(()=>{
            if (fadeIn) {
                ctx.setPassParam('brightnessContrast');
                // Disable the effects after fadein complete..
                this.engine.fadeState = 'faded';
            } else
                this.engine.fadeState = undefined;

            this.engine.renderingEnabled = this.engine.renderingWasEnabled;
            // this.engine.simulationEnabled = this.engine.simulationWasEnabled;
            if (ondone) {
                ondone();
            }
        }
        )
    }

    ctx.animatePass = function(passName, valueName, from, to, duration, ondone, disableWhenDone) {
        ctx.setPassParam(passName, valueName, from);
        ctx.tweenPost(passName, valueName, from, to, duration).onDone(()=>{
            if (disableWhenDone)
                ctx.setPassParam(passName);
            if (ondone) {
                ondone();
            }
        }
        )
    }
    ;
    ctx.blurWorld = function(fadeIn, ondone, fadeDurationMSec = 2000) {
        var blurAmt = 0.006 * 600 / this.engine.renderer.domElement.width;
        this.engine.renderingWasEnabled = this.engine.renderingEnabled;
        this.engine.renderingEnabled = true;
        this.engine.simulationWasEnabled = this.engine.simulationEnabled;
        this.engine.simulationEnabled = true;
        ctx.animatePass('verticalBlur', 'v', fadeIn ? blurAmt : 0, fadeIn ? 0.0 : blurAmt, fadeDurationMSec, ()=>{}
        , !!fadeIn);
        ctx.animatePass('horizontalBlur', 'h', fadeIn ? blurAmt : 0, fadeIn ? 0.0 : blurAmt, fadeDurationMSec, ()=>{
            this.engine.renderingEnabled = this.engine.renderingWasEnabled;
            this.engine.simulationEnabled = this.engine.simulationWasEnabled;
            if (ondone)
                ondone();
        }
        , !!fadeIn);
    }
    return ctx;
}