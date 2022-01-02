//import { GUI } from 'https://threejs.org/examples/jsm/libs/dat.gui.module.js';
import {GUI} from 'https://threejs.org/examples/jsm/libs/lil-gui.module.min.js';

export default function PostUI(THREE, postProcessing) {
    let ctx = postProcessing;
    ctx.gui = new GUI();

    ctx.configurePass = function(name, pass) {

        let props = passWidgets[name]
        props.forEach(w=>{
            w.updateDisplay();
        })

    }

    function bindUniformChanged(path) {

        return function uniformChanged(newValue) {
            (!this.path) && (this.path = path);
            if (!this.path)
                return
            let u = ctx.getUniform(this.path)
            let s = this.path.slice(-1)
            if (typeof u[s[0]] !== 'object')
                u[s] = newValue;
            else
                u[s].setRGB(newValue.r / 255, newValue.g / 255, newValue.b / 255);
            //console.log("UChange")
        }

    }
    let checkBoxes = {}
    let folders = {}
    let passWidgets = {}
    let activeCheckBox;

    ctx.setPassActivation = function(pass, state) {
        let cb = checkBoxes[pass];
        if (cb) {
            if (cb.getValue() != state)
                cb.setValue(state);
            let f = folders[pass];
            //.name = pass + (state?'active':'');
            let nname = pass + (state ? '✅' : '');
            if (f.name !== undefined)
                f.name = nname;
            else
                f.title(nname);
            //ctx.gui.updateDisplay()

        }
    }
    ctx.setPostProcessingEnabled = function(state) {
        if (activeCheckBox && activeCheckBox.getValue() != state)
            activeCheckBox.setValue(state);
    }

    ctx.rebuildGUI = function() {
        // Init control Panel
        for (var i = 0; i < ctx.passList.length; i++)
            ctx.activePasses[ctx.passList[i]] = false;
        if (ctx.gui && !ctx.guiBuilt) {
            ctx.guiBuilt = true;
        } else {
            return;
        }
        var gui = ctx.gui;
        gui.root.close()
        var f1 = gui.addFolder('PostProcessing');
        f1.close();

        activeCheckBox = f1.add(ctx, 'enabled', false, true, false).name('enabled').onChange((nv)=>{//if(!nv)
        //f1.close();

        }
        );
        activeCheckBox.setValue(false)
        let allPaths = []

        for (const i in ctx.activePasses) {
            if (!Object.prototype.hasOwnProperty.call(ctx.activePasses, i))
                continue;

            var fld = f1.addFolder(i);
            folders[i] = fld;

            let isActive = ctx.activePasses[i]
            if (!isActive)
                fld.close();

            var chkbox = fld.add(ctx.activePasses, i).onChange((val)=>{
                if (postProcessing) {

                    postProcessing.composerNeedsUpdate = true;
                    if ((val == true) && (!postProcessing.enabled)) {
                        postProcessing.enabled = true;
                        postProcessing.passesNeedsUpdate = true
                        ctx.active = true
                    }
                }
                ctx.setPassActivation(i, val)
            }
            );

            //Pass activation changed... Checkbox toggled...
            checkBoxes[i] = chkbox;
            var pname = `${i}Pass`;
            let pass = postProcessing.passes[pname]
            let pun = {}

            let paths = []

            for (let e in pass) {
                if (pass[e] && (typeof pass[e] == 'object') && pass[e].isShaderMaterial && pass[e].uniforms) {
                    for (let i in pass[e].uniforms) {
                        paths.push([pname, e, 'uniforms', i, 'value']);
                    }
                }
            }

            //for( let u in pass.uniforms) paths.push([pname,'uniforms',u,'value'])
            //for( let u in pass.copyUniforms) paths.push([pname,'copyUniforms',u,'value'])

            ///pun[u]={pass,shader:pass,src:pass.uniforms[u],value:pass.uniforms[u].value}
            //pun[u]={pass,shader:pass,src:pass.copyUniforms[u],value:pass.copyUniforms[u].value}
            //pun[i+'_'+pname]={pass,shader:pass[e],src:pass[e].uniforms[i],value:pass[e].uniforms[i].value}

            var createNumericField = (fieldName,path,value)=>{
                var arng = Math.abs(value) * 2;
                if (arng < 10)
                    arng = 10;
                let f = fld.add(ctx.getUniform(path), path.slice(-1), -arng, arng, 0.001).name(fieldName).onChange(bindUniformChanged(path));
                f.path = path;
                return f;
            }
            let buildParamUi = (p,widgets)=>{
                var un = ctx.getUniform(p);
                var u = p.slice(-2, -1)

                let f;
                if (un.type === undefined) {
                    if (un.value === undefined) {
                        //console.log(`Undefined uniform value! s:${pname} u:${u} v:${un.value}`);
                        return;
                    }

                    //console.log(`s:${pname} u:${un.value}`);
                    if (typeof un.value == "number") {
                        f = createNumericField(u, p, un.value);
                        widgets.push(f)
                    } else if (typeof un.value == "object") {
                        if (un.value instanceof THREE.Color) {
                            f = fld.addColor(un, 'value').name(u).onChange(bindUniformChanged(p));
                            f.path = p;
                            widgets.push(f)
                        } else if (un.value instanceof THREE.Vector3) {

                            f = createNumericField(u, p.slice(0).concat(['x']), un.value.x);
                            widgets.push(f)

                            f = createNumericField(u, p.slice(0).concat(['y']), un.value.y);
                            widgets.push(f)

                            f = createNumericField(u, p.slice(0).concat(['z']), un.value.z);
                            widgets.push(f)
                        } else if (un.value instanceof THREE.Vector2) {
                            f = createNumericField(u, p.slice(0).concat(['x']), un.value.x);
                            widgets.push(f)
                            f = createNumericField(u, p.slice(0).concat(['y']), un.value.y);
                            widgets.push(f)
                        }
                        //else
                        //  console.log("Unknown uniform type!:", un.value);
                    }

                } else if (un.type == 'f') {
                    f = createNumericField(u, p, un.value);
                    widgets.push(f)
                    //fld.add(passes[pname].uniforms[u], 'value', -1, 1, 0.01).name(u).onChange(uniformChanged);
                } else if (un.type == 't') {// Texture channel... ignore
                } else if (un.type == 'c') {
                    //Color type...
                    let f = fld.addColor(un, 'value').name(u).onChange(bindUniformChanged(p));
                    f.path = p;
                    widgets.push(f)
                } else {
                    console.log("UNKNOWN pass datatype:", pname, u, un.type);
                }
            }

            let widgets = []

            for (var p in paths) {
                buildParamUi(paths[p], widgets)
            }
            passWidgets[pname] = widgets;
            allPaths = allPaths.concat(paths)
        }
    }
    document.addEventListener('postprocessing-rebuilt', ()=>{
        ctx.rebuildGUI()
    }
    )
    return ctx;
}
