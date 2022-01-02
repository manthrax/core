let THREE,renderer,camera

    function GPUBuffer(size, isFloat=true) {
        this.renderTarget = new THREE.WebGLRenderTarget(size,size,{
            wrapS: THREE.RepeatWrapping,
            wrapT: THREE.RepeatWrapping,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: isFloat ? THREE.FloatType : THREE.UnsignedByteType,
            stencilBuffer: false,
            depthBuffer: false,
        })
    }
    function GPUOp(params) {
        let u = this.uniforms = params.uniforms
        let udef = '';
        if (u)
            for (let k in u)
                udef += `uniform ${u[k].type} ${k};
`
        this.shader = new THREE.RawShaderMaterial({
            uniforms: params.uniforms || {},
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false,
            vertexShader: `
precision highp float;

attribute vec3 position;
attribute vec2 uv;
${udef}
varying vec2 vUv;
varying vec4 vPosition;
${params.libv || ''}
void main(){
    vec4 pos=vec4(vUv = (uv-.5)*2.,0.,1.);
    ${params.v || ''}
    gl_Position = vPosition = pos;
}`,
            fragmentShader: `
precision highp float;
${udef}
varying vec2 vUv;
varying vec4 vPosition;
${params.libf || ''}
void main(){
    vec4 position = vPosition;
    vec2 uv = vUv;
    vec4 result;
    ${params.f || ''}
    gl_FragColor = result;
}
`
        });
    }

GPUBuffer.init=function(_THREE,_renderer,_camera){
    THREE=_THREE;
    renderer=_renderer;
    camera = _camera;
    GPUBuffer.prototype.renderMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(1,1))

    GPUBuffer.prototype.readPixels = function(left, top, right, bottom, out) {
        let w = right - left;
        let h = bottom - top;
        let sz = w * h * ((this.renderTarget.texture.format == THREE.RGBAFormat) ? 4 : 3);
        if (this.renderTarget.texture.type == THREE.FloatType) {
            if ((!out.data) || (out.data.length !== sz)) {
                out.data = new Float32Array(sz);
            }
        } else {
            if ((!out.data) || (out.data.length !== sz)) {
                out.data = new Uint8Array(sz);
            }
        }
        renderer.readRenderTargetPixels(this.renderTarget, left, top, w, h, out.data)
    }
    GPUBuffer.prototype.execute = function(op) {
        this.saveTarget = renderer.getRenderTarget()
        this.renderMesh.material = op.shader;
        this.renderMesh.frustumCulled = false;
        renderer.setRenderTarget(this.renderTarget);
        renderer.setClearColor('red')
        renderer.render(this.renderMesh, camera)
        renderer.setRenderTarget(this.saveTarget);
    }

}
export {GPUBuffer,GPUOp}