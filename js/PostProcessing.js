const THREEPath = 'https://threejs.org/'
const PostPath = "https://threejs.org/examples/jsm/postprocessing"
const ShaderPath = "https://threejs.org/examples/jsm/shaders"
//import * as THREE from "https://threejs.org//build/three.module.js"

import {EffectComposer} from "https://threejs.org/examples/jsm/postprocessing/EffectComposer.js"
import {RenderPass} from "https://threejs.org/examples/jsm/postprocessing/RenderPass.js"
import {TexturePass} from "https://threejs.org/examples/jsm/postprocessing/TexturePass.js"
import {AdaptiveToneMappingPass} from "https://threejs.org/examples/jsm/postprocessing/AdaptiveToneMappingPass.js"
import {BloomPass} from "https://threejs.org/examples/jsm/postprocessing/BloomPass.js"
import {BokehPass} from "https://threejs.org/examples/jsm/postprocessing/BokehPass.js"
import {ClearPass} from "https://threejs.org/examples/jsm/postprocessing/ClearPass.js"
import {CubeTexturePass} from "https://threejs.org/examples/jsm/postprocessing/CubeTexturePass.js"
import {DotScreenPass} from "https://threejs.org/examples/jsm/postprocessing/DotScreenPass.js"
import {FilmPass} from "https://threejs.org/examples/jsm/postprocessing/FilmPass.js"
import {GlitchPass} from "https://threejs.org/examples/jsm/postprocessing/GlitchPass.js"
import {MaskPass} from "https://threejs.org/examples/jsm/postprocessing/MaskPass.js"
import {OutlinePass} from "https://threejs.org/examples/jsm/postprocessing/OutlinePass.js"
import {SAOPass} from "https://threejs.org/examples/jsm/postprocessing/SAOPass.js"
import {SavePass} from "https://threejs.org/examples/jsm/postprocessing/SavePass.js"
import {ShaderPass} from "https://threejs.org/examples/jsm/postprocessing/ShaderPass.js"
import {SMAAPass} from "https://threejs.org/examples/jsm/postprocessing/SMAAPass.js"
import {SSAARenderPass} from "https://threejs.org/examples/jsm/postprocessing/SSAARenderPass.js"
import {SSAOPass} from "https://threejs.org/examples/jsm/postprocessing/SSAOPass.js"
import {TAARenderPass} from "https://threejs.org/examples/jsm/postprocessing/TAARenderPass.js"
import {UnrealBloomPass} from "https://threejs.org/examples/jsm/postprocessing/UnrealBloomPass.js"

import {CopyShader} from "https://threejs.org/examples/jsm/shaders/CopyShader.js"
import {ColorifyShader} from "https://threejs.org/examples/jsm/shaders/ColorifyShader.js"
import {BleachBypassShader} from "https://threejs.org/examples/jsm/shaders/BleachBypassShader.js"
import {BrightnessContrastShader} from "https://threejs.org/examples/jsm/shaders/BrightnessContrastShader.js"

import {ColorCorrectionShader} from "https://threejs.org/examples/jsm/shaders/ColorCorrectionShader.js"
import {FilmShader} from "https://threejs.org/examples/jsm/shaders/FilmShader.js"
import {DotScreenShader} from "https://threejs.org/examples/jsm/shaders/DotScreenShader.js"
import {FocusShader} from "https://threejs.org/examples/jsm/shaders/FocusShader.js"
import {HorizontalBlurShader} from "https://threejs.org/examples/jsm/shaders/HorizontalBlurShader.js"
import {HueSaturationShader} from "https://threejs.org/examples/jsm/shaders/HueSaturationShader.js"
import {KaleidoShader} from "https://threejs.org/examples/jsm/shaders/KaleidoShader.js"
import {LuminosityShader} from "https://threejs.org/examples/jsm/shaders/LuminosityShader.js"
import {LuminosityHighPassShader} from "https://threejs.org/examples/jsm/shaders/LuminosityHighPassShader.js"
import {MirrorShader} from "https://threejs.org/examples/jsm/shaders/MirrorShader.js"
import {RGBShiftShader} from "https://threejs.org/examples/jsm/shaders/RGBShiftShader.js"
import {SepiaShader} from "https://threejs.org/examples/jsm/shaders/SepiaShader.js"
import {VerticalBlurShader} from "https://threejs.org/examples/jsm/shaders/VerticalBlurShader.js"
import {VignetteShader} from "https://threejs.org/examples/jsm/shaders/VignetteShader.js"

import {FXAAShader} from "https://threejs.org/examples/jsm/shaders/FXAAShader.js"


import Easing from "./Easing.js"

import { GUI } from 'https://threejs.org/examples/jsm/libs/dat.gui.module.js';

export default function PostProcessing(engine) {

    var ctx = this;
    let THREE = engine.THREE;
    this.engine = engine;

    var camera, scene, renderer;
    var composer;
    var cube;
    var shaderTime = 0;
    var testParams, testPass;
    var passes;

    document.addEventListener('keydown', (e)=>{
        (e.code == 'KeyB') && (ctx.enabled = !ctx.enabled);
        (e.code == 'KeyN') && ctx.blurWorld(true);
        (e.code == 'KeyM') && ctx.blurWorld(false);

    }
    )
    ctx.uniformBindings = {};

    ctx.setScene = function(s) {
        ctx.scene = s;
        if (passes && passes.renderPass) {
            passes.renderPass.scene = s;
        }
    }
    ctx.setCamera = function(c) {
        ctx.camera = c;
        if (passes && passes.renderPass) {
            passes.renderPass.camera = c;
        }
    }
/*
    ctx.setPassActivation = function(passName, active) {
        //        active = false;
        if (this.activePasses[passName] != active) {
            this.activePasses[passName] = active;
            ctx.composerNeedsUpdate = true;
        }
    }

    ctx.setPassUniform = function(passName, param, val) {
        var b = doUniformBinding(passName, param, undefined, val);
    }

    ctx.getPassUniform = function(passName, param, val) {
        var pass = this.passes[passName];
        if (pass) {
            return pass.uniforms[param].value;
        }
    }
*/
    //-----------------------------------------------------------

    ctx.init = function init() {
        // POST PROCESSING
        // Create Shader Passes
        if (!engine.scene || !engine.camera.current) {
            throw "PostProcessing Init called with undefined scene or camera.";
        }
        this.scene = engine.scene;
        this.camera = engine.camera.current;
        engine.postProcessing = this;
        passes = this.passes = {};
        ctx.passList = ['bleach', 'bloom', 'brightnessContrast', 'colorCorrection', 'colorify', 'dotScreen', 'film', 'focus', 'horizontalBlur', 'hueSaturation', 'kaleido', 'luminosity', 'mirror', 'RGBShift', 'sepia', 'verticalBlur', 'vignette', 'outline', 'fxaa', 'unrealbloom', 'adaptiveToneMapping'];
        ctx.activePasses = {};

    }

    function applyBinding(b) {
        var pass = passes[b.passName];
        var uniform = pass.uniforms && pass.uniforms[b.uName];
        (!uniform) && (uniform=b.src);
        var prev;
        if (b.uField !== 'value') {
            prev = uniform.value[b.uField];
            uniform.value[b.uField] = b.value;
        } else {
            prev = uniform.value;
            uniform.value = b.value;
        }
        if (prev != uniform.value){
            //pass.uniformsNeedUpdate = true;
            //b.src.shader && (b.src.shader.needsUpdate = true);
        }
    }

    function doUniformBinding(passName, uName, uField, curValue, src) {
        var uField = uField ? uField : 'value';
        var key = passName + ":" + uName + ":" + uField;
        var b = ctx.uniformBindings[key];
        if (b) {
            b[uField] = curValue;
            applyBinding(b);
            return b;
        }
        b = ctx.uniformBindings[key] = {
            key: key,
            passName: passName,
            uName: uName,
            uField: uField,
            src
        }
        b.value = curValue;
        applyBinding(b);
        return b;
    }

    function uniformChanged(newValue) {
        var binding = this.object;
        applyBinding(binding);
        //console.log("UChange")
    }
    var blacklist = {
        "focusPass:screenHeight:value": 1,
        "focusPass:screenWidth:value": 1,
        "fxaaPass:resolution:x": 1,
        "fxaaPass:resolution:y": 1,
    }
    function reapplyBindings() {
        for (var i in ctx.uniformBindings)
            if (!blacklist[ctx.uniformBindings[i].key])
                applyBinding(ctx.uniformBindings[i]);
    }

engine.gui = new GUI();
    ctx.enabled = false;
    ctx.rebuildGUI = function() {
        // Init control Panel
        for (var i = 0; i < ctx.passList.length; i++)
            ctx.activePasses[ctx.passList[i]] = false;
        if (engine.gui && !ctx.guiBuilt) {
            ctx.guiBuilt = true;
        } else {
            return;
        }
        var gui = engine.gui;
        var f1 = gui.addFolder('PostProcessing');

        f1.add(ctx, 'enabled', false,true, false).name('enabled').onChange((nv)=>{ });

        for (const i in ctx.activePasses) {
            if (!Object.prototype.hasOwnProperty.call(ctx.activePasses, i))
                continue;
            var fld = f1.addFolder(i);

            //Pass activation changed... Checkbox toggled...
            var chkbox = fld.add(ctx.activePasses, i).onChange(()=>{ctx.composerNeedsUpdate = true;});
            
            var pname = `${i}Pass`;
            let pass = passes[pname]
            let pun = {}

            for( let u in pass.uniforms){
                console.log(pname+':uniforms:value')
                pun[u]={pass,shader:pass,src:pass.uniforms[u],value:pass.uniforms[u].value}
            }
            for (let e in pass) {
                if (pass[e] && (typeof pass[e]=='object') && pass[e].isShaderMaterial && pass[e].uniforms) {
                    for (let i in pass[e].uniforms){
                        console.log(pname+':'+e+':uniforms:value')
                        //console.log(e,i)
                        pun[i+'_'+pname]={pass,shader:pass[e],src:pass[e].uniforms[i],value:pass[e].uniforms[i].value}
                    }
                }
            }
            let buildParamUi=(p)=>{
                var un = p;

                if (un.type === undefined) {
                    if (un.value === undefined) {
                        //console.log(`Undefined uniform value! s:${pname} u:${u} v:${un.value}`);
                        return;
                    }

                    var numericField = (pass,uniform,field,value,src, shader)=>{
                        var arng = Math.abs(value) * 2;
                        if (arng < 10)
                            arng = 10;
                        var b = doUniformBinding(pass, uniform, field, value, src, shader);
                        var fieldName = field ? uniform + "." + field : uniform;
                        return fld.add(b, 'value', -arng, arng, 0.001).name(fieldName).onChange(uniformChanged);
                    }

                    //console.log(`s:${pname} u:${un.value}`);
                    if (typeof un.value == "number") {
                        numericField(pname, u, undefined, un.value, p.src);
                    } else if (typeof un.value == "object") {
                        if (un.value instanceof THREE.Color) {
                            var b = doUniformBinding(pname, u, 'value', un.value, p.src);
                            fld.addColor(b, 'value').name(u).onChange(uniformChanged);
                        } else if (un.value instanceof THREE.Vector3) {
                            numericField(pname, u, 'x', un.value.x, un);
                            numericField(pname, u, 'y', un.value.y, un);
                            numericField(pname, u, 'z', un.value.z, un);
                        } else if (un.value instanceof THREE.Vector2) {
                            numericField(pname, u, 'x', un.value.x, un);
                            numericField(pname, u, 'y', un.value.y, un);
                        } else
                            console.log("Unknown uniform type!:", un.value);
                    }

                } else if (un.type == 'f') {
                    numericField(pname, u, 'value', un.value, un);
                    //fld.add(passes[pname].uniforms[u], 'value', -1, 1, 0.01).name(u).onChange(uniformChanged);
                } else if (un.type == 't') {// Texture channel... ignore
                } else if (un.type == 'c') {
                    //Color type...
                    fld.addColor(un, 'value').name(u).onChange(uniformChanged);
                } else {// console.log("pass:",pname,u,un.type);
                }
            }
            for (var u in pun) {
                buildParamUi(pun[u])
            }
        }
    }
    ctx.rebuildComposer = function rebuildComposer() {
        if (!this.composer) {
            this.composer = composer = new EffectComposer(engine.renderer);
        } else {
            this.composer.passes = [];
        }
        // Add Shader Passes to Composer
        composer.addPass(passes.renderPass);
        //	var gui = new dat.GUI();
        ctx.isActive = false;
        var lastPass;
        for (var i = 0; i < ctx.passList.length; i++) {
            if (ctx.activePasses[ctx.passList[i]]) {
                var pass = passes[`${ctx.passList[i]}Pass`];
                //passes.fxaaPass.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );

                composer.addPass(pass);
                ctx.isActive = true;

                pass.renderToScreen = false;

                lastPass = pass;
            }
        }
        if (lastPass) {
            lastPass.renderToScreen = true;
            lastPass.needsSwap = false;
        } else {
            composer.addPass(passes.copyPass);
            // set last pass in composer chain to renderToScreen
            passes.copyPass.renderToScreen = true;
        }
        ctx.composerNeedsUpdate = false;
    }
    ctx.rebuildPasses = function rebuildPasses() {

        passes.renderPass = new RenderPass(this.scene,this.camera);
        passes.copyPass = new ShaderPass(CopyShader);
        var resolution = new THREE.Vector2(window.innerWidth,window.innerHeight)
        var outlinePass = passes.outlinePass = new OutlinePass(resolution,this.scene,this.camera,[]);
        /*var texture = outlinePass.patternTexture = new THREE.Texture(document.createElement('canvas'));
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
*/
        passes.fxaaPass = new ShaderPass(FXAAShader);
        passes.fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        //passes.fxaaPass.renderToScreen = true;

        passes.bloomPass = new BloomPass(1,25,4.0,256);
        passes.colorifyPass = new ShaderPass(ColorifyShader);
        passes.colorifyPass.uniforms.color.value = new THREE.Color(0xff0000);
        passes.bleachPass = new ShaderPass(BleachBypassShader);
        passes.bleachPass.uniforms.opacity.value = 3.0;
        passes.brightnessContrastPass = new ShaderPass(BrightnessContrastShader);
        passes.brightnessContrastPass.uniforms.contrast.value = 0.8;
        passes.colorCorrectionPass = new ShaderPass(ColorCorrectionShader);
        passes.filmPass = new ShaderPass(FilmShader);
        passes.filmPass.uniforms.sCount.value = 800;
        passes.filmPass.uniforms.sIntensity.value = 0.9;
        passes.filmPass.uniforms.nIntensity.value = 0.4;
        passes.dotScreenPass = new ShaderPass(DotScreenShader);
        passes.focusPass = new ShaderPass(FocusShader);
        passes.horizontalBlurPass = new ShaderPass(HorizontalBlurShader);
        passes.hueSaturationPass = new ShaderPass(HueSaturationShader);
        passes.hueSaturationPass.uniforms.hue.value = 0.5;
        passes.hueSaturationPass.uniforms.saturation.value = 0.5;
        passes.kaleidoPass = new ShaderPass(KaleidoShader);
        passes.luminosityPass = new ShaderPass(LuminosityShader);
        passes.luminosityHighPass = new ShaderPass(LuminosityHighPassShader);
        passes.mirrorPass = new ShaderPass(MirrorShader);
        passes.RGBShiftPass = new ShaderPass(RGBShiftShader);
        passes.sepiaPass = new ShaderPass(SepiaShader);
        passes.verticalBlurPass = new ShaderPass(VerticalBlurShader);
        passes.vignettePass = new ShaderPass(VignetteShader);
        passes.vignettePass.uniforms.darkness.value = 2.0;

        passes.adaptiveToneMappingPass = new AdaptiveToneMappingPass(true,256);
        //passes.adaptiveToneMappingPass.uniforms.darkness.value = 2.0;

        let params = passes.adaptiveToneMappingPass.params = {
            //bloomAmount: 1.0,
            //sunLight: 4.0,

            enabled: true,
            //avgLuminance:1.66,
            middleGrey: .2,
            minLuminance: .003,
            maxLuminance: 1.0,

            adaptionRate: 0.01
        };

        passes.adaptiveToneMappingPass.enabled = true
        passes.adaptiveToneMappingPass.needsSwap = false;
        /*
            passes.adaptiveToneMappingPass.setAdaptionRate( params.adaptionRate );
            passes.adaptiveToneMappingPass.setMinLuminance( params.minLuminance );
            passes.adaptiveToneMappingPass.setMaxLuminance( params.maxLuminance );
            passes.adaptiveToneMappingPass.setMiddleGrey( params.middleGrey );
*/

        /*		toneMappingGui.add( params, 'enabled' );
				toneMappingGui.add( params, 'middleGrey', 0, 12 );
				toneMappingGui.add( params, 'maxLuminance', 1, 30 );
*/

        //resolution, strength, radius, threshold
        passes.unrealbloomPass = new UnrealBloomPass(resolution,1.0,0.3,0.25);
        //1.0,5.3,0.15);//1.0,0.3,0.25);//1.5, 0.4, 0.85 ); 
        reapplyBindings();

        if (ctx.onPassesRebuilt)
            ctx.onPassesRebuilt();

        ctx.passesNeedsUpdate = false;
    }

    var onToggleShaders = function onToggleShaders() {
        ctx.passesNeedsUpdate = ctx.composerNeedsUpdate = true;
    }
    .bind(this);
    ctx.onToggleShaders = onToggleShaders;
    ctx.isActive = true;
    ctx.setSize = function(wid, height) {
        ctx.composer.setSize(wid, height);
        onToggleShaders();
        //for(var i in passes)
        //    passes[i].setSize(wid,height);
    }

    let rsize = engine.renderer.getSize(new THREE.Vector2());
    let nsize = rsize.clone()

    ctx.render = function() {
        engine.renderer.getSize(nsize)
        if ((nsize.x != rsize.x) || (nsize.y != rsize.y)) {
            rsize.copy(nsize);
            ctx.setSize(nsize.x, nsize.y)
        }

        if (ctx.passesNeedsUpdate)
            this.rebuildPasses();

        if (ctx.composerNeedsUpdate)
            this.rebuildComposer();
let saveEncoding = engine.renderer.outputEncoding;
let saveExposure = engine.renderer.toneMappingExposure;
engine.renderer.toneMappingExposure = .1
        composer.render(0.1);
        
engine.renderer.toneMappingExposure = saveExposure;
engine.renderer.outputEncoding = saveEncoding;
        // stats.update();
    }
    .bind(this);

    document.addEventListener('glCreated', ()=>{
        this.init();
        this.rebuildPasses();
        this.rebuildComposer();
        this.rebuildGUI();
    }
    )
    //    if (!this.scene)
    //        this.init();

    // client space effects -- this should probably be broken out into a separate module

    ctx.setPassParam = function(passName, param, val) {
        var pass = this.passes[`${passName}Pass`];
        var isactive = this.activePasses[passName];
        if (!param) {
            if (isactive) {
                this.activePasses[passName] = false;
                ctx.onToggleShaders();
            }
            return;
        } else if (param && (!isactive)) {
            this.activePasses[passName] = true;
            ctx.onToggleShaders();
        }
        if (pass.copyUniforms)
            pass.copyUniforms[param].value = val;
        else
            pass.uniforms[param].value = val;
    }
    .bind(this);

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
