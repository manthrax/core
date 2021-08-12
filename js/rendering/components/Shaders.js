import Util from '../../Util.js'
export default class Shaders {
    static getFile(url) {
        return new Promise((resolve,reject)=>{
            if (!Shaders.fileCache)
                Shaders.fileCache = {};
            /*if(cNebula.fileCache[url])
                resolve(cNebula.fileCache[url]);
            else*/
            Util.loadFileAsText(url).then((data)=>{
                Shaders.fileCache[url] = data;
                resolve(data);
            }
            );
        }
        )
    }

    static async load(path, symOverrides) {
        var src = await Shaders.getFile(path);
        var incmap = {
            "noise4d": "classic-noise-4d.snip"
        }
        if (symOverrides)
            for (var i in symOverrides)
                incmap[i] = symOverrides[i];
        var vsfs = src.split("__split__");

        var vs = vsfs[0].split("__");
        var fs = vsfs[1].split("__");
        var i = 1;
        async function mapOverrides(fs) {
            while (i < fs.length) {
                var snip = incmap[fs[i]]
                if (!snip)
                    snip = fs[i] + ".snip";
                fs[i] = await Shaders.getFile("../../core/assets/glsl/"+snip);
                i += 2;
            }
        }
        await mapOverrides(vs);
        await mapOverrides(fs);
        vs = vs.join("");
        fs = fs.join("");
        return {
            uniforms: {},
            vertexShader: vs,
            fragmentShader: fs,
            extensions: {//derivatives: true
            }
        }
    }
}
