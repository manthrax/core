
import { GUI } from 'https://threejs.org/examples/jsm/libs/dat.gui.module.js';

export default function PostUI(THREE,postProcessing){
    let ctx=postProcessing;
    ctx.gui = new GUI();


    function uniformChanged(newValue) {
        let u = ctx.getUniform(this.path)
        let s= this.path.slice(-1)
        if(typeof u[s] !== 'object')
            u[s] = newValue;
        else
            u[s].setRGB(newValue.r/255,newValue.g/255,newValue.b/255);
        //console.log("UChange")
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
        var f1 = gui.addFolder('PostProcessing');

        f1.add(ctx, 'enabled', false,true, false).name('enabled').onChange((nv)=>{ });

        for (const i in ctx.activePasses) {
            if (!Object.prototype.hasOwnProperty.call(ctx.activePasses, i))
                continue;
            var fld = f1.addFolder(i);

            //Pass activation changed... Checkbox toggled...
            var chkbox = fld.add(ctx.activePasses, i).onChange(()=>{ctx.composerNeedsUpdate = true;});
            
            var pname = `${i}Pass`;
            let pass = postProcessing.passes[pname]
            let pun = {}

            let paths=[]
            
            for (let e in pass) {
                if (pass[e] && (typeof pass[e]=='object') && pass[e].isShaderMaterial && pass[e].uniforms) {
                    for (let i in pass[e].uniforms){
                        paths.push( [pname,e,'uniforms',i,'value'] );
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
                let f = fld.add( ctx.getUniform(path) , path.slice(-1), -arng, arng, 0.001).name(fieldName).onChange(uniformChanged);
                f.path = path;
                return f;
            }

            let buildParamUi=(p)=>{
                var un = ctx.getUniform(p);
                var u = p.slice(-2,-1)
                if (un.type === undefined) {
                    if (un.value === undefined) {
                        //console.log(`Undefined uniform value! s:${pname} u:${u} v:${un.value}`);
                        return;
                    }


                    //console.log(`s:${pname} u:${un.value}`);
                    if (typeof un.value == "number") {
                        createNumericField(u,p,un.value);
                    } else if (typeof un.value == "object") {
                        if (un.value instanceof THREE.Color) {
                            let f= fld.addColor(un, 'value').name(u).onChange(uniformChanged);
                            f.path = p;
                        } else if (un.value instanceof THREE.Vector3) {

                            createNumericField(u,p.slice(0).concat(['x']), un.value.x);
                            createNumericField(u,p.slice(0).concat(['y']), un.value.y);
                            createNumericField(u,p.slice(0).concat(['z']), un.value.z);
                        } else if (un.value instanceof THREE.Vector2) {
                            createNumericField(u,p.slice(0).concat(['x']), un.value.x);
                            createNumericField(u,p.slice(0).concat(['y']), un.value.y);
                        } //else
                          //  console.log("Unknown uniform type!:", un.value);
                    }

                } else if (un.type == 'f') {
                    createNumericField(u, p, un.value);
                    //fld.add(passes[pname].uniforms[u], 'value', -1, 1, 0.01).name(u).onChange(uniformChanged);
                } else if (un.type == 't') {// Texture channel... ignore
                } else if (un.type == 'c') {
                    //Color type...
                    let f = fld.addColor(un, 'value').name(u).onChange(uniformChanged);
                    f.path = p;
                } else {// console.log("pass:",pname,u,un.type);
                }
            }
            for (var p in paths) {
                buildParamUi(paths[p])
            }
        }
    }
    document.addEventListener('postprocessing-rebuilt',()=>{
        ctx.rebuildGUI()
    })
    return ctx;
}