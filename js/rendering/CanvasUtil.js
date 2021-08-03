
function createCanvas(w,h){
    let canv = document.createElement('canvas')
    canv.width = w;
    canv.height = h;

    canv.ctx = canv.getContext('2d');//,{alpha:false}
    canv.idat = ()=>canv.ctx.getImageData(0, 0, w, h);
    let idat;
    canv.getPixels=()=>(idat = canv.idat()).data;
    canv.setPixels=(data)=>{
        let idata=(idat||(idat=canv.idat())).data;
         if(idata!==data)
            idata.set(data); 
         canv.ctx.putImageData(idat,0,0);
    }
    canv.style.position = 'absolute'
    canv.style.left = canv.style.top = '0px';
    canv.style.width = w + 'px';
    canv.style.height = h + 'px';
    canv.style.zIndex = 100;
    return canv;
}

export {createCanvas}