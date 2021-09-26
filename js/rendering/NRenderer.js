
class NRenderer
{
    constructor(app){
        let {THREE}=app;
        let gbuffer = new THREE.RenderTarget();
    
        //fp render target
        /*
        r = matIndex;
        g = u*texX | fract(y)
        b = normal angle 0 to 1, + int(mag*1000); 
        a = depth;
        */
        

    }
}
