
let registry={
    Quadtree:'./math/Quadtree.js',
    Renderer:'./rendering/Renderer.js',
    CanvasRecorder:'./rendering/CanvasRecorder.js',
    ParticleFX:'./rendering/components/ParticleFX.js',
    MCMesher:'../../xun/src/js/MCMesher.js',
    FPSInteraction:'../../xun/src/js/app/FPSInteraction.js',
    FabrikSolver:'./math/FabrikSolver.js',
    Perfmon:'../../xun/src/js/app/Perfmon.js',
    Reticle:'../../xun/src/js/app/Reticle.js',
    Text: '../../xun/src/js/p3/troika-three-text.esm.js',
    UIText: '../../xun/src/js/app/UIText.js',
    Characters: './rendering/components/Characters.js',
    Comms:'../../xun/src/js/Comms.js',

}

export default class App{
    constructor(){
        let getreg = (k)=>{
            if(!registry[k])console.error('unknown module:', k);
            return registry[k]
        }
      this.components = new Proxy({},{
       get: async function(obj, prop) {
        
        return prop in obj ?
          obj[prop] : (obj[prop]=await import(getreg(prop)))
      }});
    }
}
