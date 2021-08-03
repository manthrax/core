export default function RenderUtils(THREE)
{
   let gradientCanvas=(colorStops,width=32)=>{
        let c = document.createElement('canvas').getContext('2d')
        c.canvas.width = width;
        c.canvas.height = width;
        var g = c.createLinearGradient(0, 0, width, 0);
        colorStops.forEach(e=>{
            let cs = (e[1]|0x1000000).toString(16).slice(1);
            g.addColorStop(e[0],"#"+cs )
            });
        c.fillStyle = g;
        c.fillRect(0,0, width,width);
        /*
        document.body.appendChild(c.canvas)
        c.canvas.style.pointerEvents = 'none'
        c.canvas.style.zIndex = 100;
        c.canvas.style.position = 'absolute'
        c.canvas.style.left = c.canvas.style.top = '0px'
        */
        return c.canvas;
   }
   
   return{
    gradientCanvas
   } 
}