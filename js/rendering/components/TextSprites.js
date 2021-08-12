
class GlyphPage{

    cursorY = 3
    dim = 1024
    constructor(app) {
        var canvas = this.canvas = document.createElement('canvas')
        this.material = new THREE.SpriteMaterial({map: new THREE.CanvasTexture(canvas,undefined,undefined,undefined),transparent:true,alphaTest:.15})
        canvas.width = canvas.height = this.dim;
        var ctx = this.ctx = canvas.getContext('2d')
        ctx.fillStyle = 'rgba(0,0,0,0)'
        ctx.fillRect(0, 0, this.dim, this.dim)
        ctx.font = `24px Helvetica`;
        ctx.fillStyle = 'white'
        ctx.strokeStyle = 'black'
    }
}

class TextSprites {
    add(params) {}
    pages=[]
    constructor(app) {
        var self = this;
        this.app = app;
        this.activeSprites = new Collection()

        this.overlayElement=(elem,anchor,layer)=>{
            anchor = anchor || 'topleft'
            layer = layer || 0;
            elem.style.position = 'absolute';
            if(anchor == 'topleft')
                elem.style.left = elem.style.top = `${layer*10}px`;
            else if(anchor == 'topright')
                elem.style.right = elem.style.top = `${layer*10}px`;
            else if(anchor == 'bottom')
                elem.style.bottom = '0px';
            else if(anchor == 'center'){
                //elem.style.left = elem.style.top = `${layer*10}px`;
                //elem.style.margin = '0 auto';//inline-block'
                //document.body.style.textAlign = 'center'
            }
            
            elem.style.zIndex = 100+layer;
            document.body.appendChild(elem);            
        }
        var pages = this.pages;
        var page = new GlyphPage()
        this.pages.push(page)

//        this.overlayElement(page.canvas,"topleft",this.pages.length)
        
        var ctx = page.ctx;

        ctx.fillStyle = 'white'
        ctx.strokeStyle = 'black'



        function drawShout(ctx, x, y, width, height, radius, fill, stroke) {
            stroke = stroke || true
            fill = fill || true
            radius = radius || 5;

            var pts = [[x, y], [x + width, y], [x + width, y + height], [x, y + height]]
            var subd = (maxlen)=>{
                var npts = []
                for (var i = 0; i < pts.length; i++) {
                    var pi = i % pts.length
                    var pb = (i + 1) % pts.length
                    npts.push(pts[pi])
                    var dx = pts[pb][0] - pts[pi][0]
                    var dy = pts[pb][1] - pts[pi][1]
                    var len = Math.sqrt((dx * dx) + (dy * dy))
                    if (len > maxlen){
                        var nsub = (len/maxlen)|0
                        dx/=nsub+1
                        dy/=nsub+1
                        for(var j=0;j<nsub;j++){
                            npts.push([pts[pi][0]+(dx*(j+1)),pts[pi][1]+(dy*(j+1))])
                        }
                    }

                }
                pts = npts;
            }

            subd(height*0.15)

            var centx = (width * .5) + x
            var centy = (height * .5) + y
            var abs = Math.abs;
            var npts=[]
            var inset = 6;
            for (var i = 0; i < pts.length; i++) {
                var ib = (i+1)%pts.length
                var dx = pts[ib][0]-pts[i][0];
                var dy = pts[ib][1]-pts[i][1];
                var poy = (abs(dy)>abs(dx)?0:dx>0?inset:-inset)*.5
                var pox = (abs(dx)>abs(dy)?0:dy<0?inset:-inset)*.5

                var dx = pts[i][0]-centx;
                var dy = pts[i][1]-centy;
                var ilen = 1/Math.sqrt((dx*dx)+(dy*dy));
                var ox = (dx*ilen*-inset)+pox;
                var oy = (dy*ilen*-inset)+poy;
                if(i&1)npts.push(pts[i])
                else npts.push([pts[i][0]+ox,pts[i][1]+oy]);
            }
            pts = npts;

            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (var i = 1; i <= pts.length; i++) {
                var pi = i % pts.length
                ctx.lineTo(pts[pi][0], pts[pi][1])
            }
            ctx.closePath();

            if (stroke)
                ctx.stroke();
            if (fill)
                ctx.fill();
        }

        function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
            stroke = stroke || true
            fill = fill || true
            radius = radius || 5;
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            if (stroke)
                ctx.stroke();
            if (fill)
                ctx.fill();
        }

            var radius = 6;
            var rad2 = radius * 2
        function computeSize(text,style){
            style=style||'normal'
            var mt = ctx.measureText(text);
            //mt.height = mt.actualBoundingBoxAscent+mt.actualBoundingBoxDescent

            var fontSize = parseInt(ctx.font)
            var sz ={
                width: mt.width+rad2,
                height: (((fontSize + rad2) | 0) + 4.)
            }

            if(style=='shout'){
                sz.width+=16;
                sz.height+=16;
            }
            return sz;
        }

        function renderTextBalloon( text,style) {

            var ctx = page.ctx;        

            var fontSize = parseInt(ctx.font)
            var maxWidth = ctx.canvas.width

            var x=4;
            var y=page.cursorY;

            var mt = computeSize(text,style);
            
            if((y + mt.height)>page.dim){
                page = new GlyphPage()
                pages.push(page)
                y = page.cursorY;
                ctx = page.ctx;
                self.overlayElement(page.canvas,"topleft",pages.length)
            }

            var textWidth = mt.width;
            var boxWidth = textWidth;// + rad2
            if (boxWidth > maxWidth) {
                boxWidth = maxWidth;
                textWidth = boxWidth - rad2;
            }

            if (style=='shout')
                drawShout(ctx, x, y, boxWidth | 0, (fontSize + radius) | 0, radius, true, true)
            else
                roundRect(ctx, x, y, boxWidth | 0, (fontSize + radius) | 0, radius, true, true)
            var saveFill = ctx.fillStyle
            ctx.fillStyle = 'black'
            ctx.fillText(text, x + radius, (y + fontSize) | 0, textWidth | 0)
            ctx.fillStyle = saveFill;
            var rtn = {bottom:(((fontSize + (rad2 * 0.5)) | 0) + 4.)+y,top:y-radius,left:x,right:boxWidth+x+rad2}
            rtn.width = rtn.right-rtn.left
            rtn.height=rtn.bottom-rtn.top

            page.cursorY+=rtn.height;
            rtn.page = page;


            return rtn
        }

        //ctx.font = `${fontSize}px sans serif`;

        var textGeom = (width,height,txdim,x,y,scl,vertoffset)=>{
            var geometry = new THREE.BufferGeometry();
            var cx = width*.5*scl
            var cy = height*.5*scl
            var u1=0
            var u2=width/txdim
            var v1=1-(y/txdim)
            var v2=1-((y+height)/txdim)
            var verts = new Float32Array([-cx, -cy, 0, u1, v2, cx, -cy, 0, u2, v2, cx, cy, 0, u2, v1, -cx, cy, 0, u1, v1]);

            var interleavedBuffer = new THREE.InterleavedBuffer(verts,5);
            vertoffset = vertoffset || 0
            for(var a=0;a<verts.length;a+=5)
                verts[a+1] += vertoffset
            geometry.setIndex([0, 1, 2, 0, 2, 3]);
            geometry.addAttribute('position', new THREE.InterleavedBufferAttribute(interleavedBuffer,3,0,false));
            geometry.addAttribute('uv', new THREE.InterleavedBufferAttribute(interleavedBuffer,2,3,false));
            return geometry
        }
        

        this.makeTextSprite=(text, style, scale, vertoffset)=>{
            scale = scale || .1
            //var sspos = app.radar.updateSingleObject(obj,obj.radarObj)




            var textParams = renderTextBalloon(text, style)
            var page = textParams.page
            page.material.map.needsUpdate = true;
            var spr = new THREE.Sprite(page.material)
            spr.geometry = textGeom(textParams.width,textParams.height,page.dim,textParams.left,textParams.top,scale, vertoffset)
            var vdat = spr.geometry.attributes.position.data;
            var varr = vdat.array;
            //for(var i=0;i<spr.geometry.attr)
            spr.userData.textParams = textParams;
            spr.userData.activeSpriteRef = this.activeSprites.add(spr)
            
            return spr;
        }
    }
}


App.declareModule('textSprites', (app)=>{
    app.textSprites = new TextSprites(app);

    var str = "The quick brown fox jumped over the 🛠 lazy dog!The quick brown fox jumped over the 🛠 lazy dog!"
    var rstr = ()=>str.slice((Math.random() * str.length) | 0)
    for (var i = 0; i < 20; i++) {
        var spr = app.textSprites.makeTextSprite( rstr(), 'normal' , 0.01 );
        app.scene.add(spr)
        var pos = new THREE.Vector3( -51.92238885779334, 1.5353014956065436, -3.2161246036809192)
        spr.position.set(app.srnd(10)+pos.x, 3+app.srnd(2)+pos.y, app.srnd(10)+pos.z);
    }


    var chatWindow;
    app.listen("appKeyEvent", (e)=>{
        if(e.type!=='keydown')return
        if (e.code == 'Enter') {
            if(chatWindow){
                var str = chatWindow.innerText;
                chatWindow.parentElement.removeChild(chatWindow);
                chatWindow = undefined;
                app.renderer.domElement.focus();
                var spr = app.textSprites.makeTextSprite( str, e.shiftKey?'shout':'normal' , 0.003 ,.2);
                app.scene.add(spr)
                if(app.playerObject){
                    spr.userData.target = app.playerObject.position
                }
            }else{
                var div = chatWindow = document.createElement('div')
                div.contentEditable = true;
                app.textSprites.overlayElement( div , 'bottom', 0 )
                div.style.width='80%'
                div.style.left='10%'
                div.style.bottom='2%'
                div.style.font = `24px Helvetica`
                div.style.height='32px'
                div.style.background='rgba(0,0,0,0.5)'
                div.focus();
            }
            e.stopPropagation()
            e.preventDefault()
            return false;
        }
    }
    )


    app.listen("onBeforeRender", (e)=>{
        app.textSprites.activeSprites.iterate((s)=>{
            if(s.userData.target)
                s.position.copy(s.userData.target)
        })
    })

    function reportClickBehavior(renderer,scene,camera){
        var mouseVec = new THREE.Vector3();
        var mouse2D = new THREE.Vector3();
        var rawMouse2D = new THREE.Vector3();
        var raycaster = new THREE.Raycaster();
        var intersections;
        app.listen('mouseEvent',(event)=>{
            if(event.type!='mousedown') return
            if(!event.ctrlKey) return
            if(event.target !== renderer.domElement.parentElement) return
            var mx = event.layerX;
            var my = event.layerY;
            rawMouse2D.set(mx, my, 0);
            mouse2D.x = (mx / renderer.domElement.width) * 2 - 1;
            mouse2D.y = -(my / renderer.domElement.height) * 2 + 1;
            mouseVec.set(mouse2D.x, mouse2D.y, 0.5);
            raycaster.setFromCamera(mouseVec,camera);
            intersects = raycaster.intersectObject(scene, true);
            intersects.filter((e)=>e.object.type!=='Mesh')
            var hit = intersects[0]
            if(hit){
                var str = `${hit.point.x.toFixed(2)},${hit.point.y.toFixed(2)},${hit.point.z.toFixed(2)}`
                var spr = app.textSprites.makeTextSprite( str, 'normal', 0.01 );
                scene.add(spr)
                spr.position.copy(hit.point)
                spr.position.y+=0.3
                console.log(str)
            }
        })
    }
    reportClickBehavior(app.renderer,app.scene,app.camera)


}
)
