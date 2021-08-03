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
document.addEventListener('define-commands',(e)=>{
    e.detail.commands.post=(p)=>{ctx.enabled = p[1] == true;}    
    e.detail.commands.blur=(p)=>{ctx.blurWorld(p[1] == true);}
})

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

    ctx.uniformBindings = {};
    ctx.setPassActivation = function(passName, active) {
        if (this.activePasses[passName] != active) {
            this.activePasses[passName] = active;
            ctx.composerNeedsUpdate = true;
        }
    }

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
        ctx.passList = ['bleach', 'bloom', 'brightnessContrast', 'colorCorrection', 'colorify', 'dotScreen', 'film', 'focus', 'horizontalBlur', 'hueSaturation', 'kaleido', 'luminosity', 'mirror', 'RGBShift', 'sepia', 'verticalBlur', 'vignette', 'outline', 'fxaa', 'unrealBloom', 'adaptiveToneMapping'];
        ctx.activePasses = {};

    }

    var blacklist = {
        "focusPass.material.screenHeight.value": 1,
        "focusPass.material.screenWidth:value": 1,
        "fxaaPass:resolution:x": 1,
        "fxaaPass:resolution:y": 1,
    }

    let getUniform = ctx.getUniform = (path)=>{
        let root = passes;
        if (path)
            for (let i = 0; i < path.length - 1; i++)
                root = root[path[i]]
        return root;
    }

    ctx.enabled = false;

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
        passes.unrealBloomPass = new UnrealBloomPass(resolution,1.0,0.3,0.25);
        //1.0,5.3,0.15);//1.0,0.3,0.25);//1.5, 0.4, 0.85 ); 
        //reapplyBindings();

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
        document.dispatchEvent(new CustomEvent("postprocessing-rebuilt"))
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

    return ctx;

}
