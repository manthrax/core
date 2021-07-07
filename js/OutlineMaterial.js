
export default function OutlineMaterial(material) {
    let uniforms={outlineThickness: {
        value: .5,
        type: "float"
    }}
    material.onBeforeCompile = shader=>{
        let ublock = "\n";
        for (var i in uniforms) {
            ublock += "uniform " + uniforms[i].type + " " + i + ";\n";
            shader.uniforms[i] = uniforms[i];
        }
        shader.vertexShader = ublock + shader.vertexShader;
        const token = `#include <begin_vertex>`;//(normalMatrix * 
        const customTransform = `\nvec3 transformed = position + normal * outlineThickness;\n`;
        shader.vertexShader = shader.vertexShader.replace(token, customTransform);
    }
    return material;
}
