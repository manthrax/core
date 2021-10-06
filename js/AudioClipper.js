export default function AudioClipper(path = "crunch.ogg"){
//https://googledrive.com/host/0C2QKl-TsV6cVTE7wbWNOelRiRlk/filename.mp3
    //window.onload = init;
    let self = this;
    let context;
    let bufferLoader;
    let source1;
    let playContinuous = false;
    let canv = document.createElement("canvas");

    let cwidth = 8192;
    let cheight = 128;
    let cheight2 = cheight / 2;


    let buf = new Array(cwidth * 2);
    let lastRY = 0;
    let spanLen = 0;
    let wasInSpan = false;
    let spanStart = 0;
    let spans = [];

    function BufferLoader(context, urlList, callback) {
        this.context = context;
        this.urlList = urlList;
        this.onload = callback;
        this.bufferList = new Array();
        this.loadCount = 0;
    }

    BufferLoader.prototype.loadBuffer = function(url, index) {
        // Load buffer asynchronously
        let request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer";
        let loader = this;
        request.onload = function() {
            // Asynchronously decode the audio file data in request.response
            loader.context.decodeAudioData(request.response, function(buffer) {
                if (!buffer) {
                    alert('error decoding file data: ' + url);
                    return;
                }
                loader.bufferList[index] = buffer;
                if (++loader.loadCount == loader.urlList.length)
                    loader.onload(loader.bufferList);
            }, function(error) {
                console.error('decodeAudioData error', error);
            });
        }

        request.onerror = function() {
            alert('BufferLoader: XHR error');
        }

        request.send();
    }

    BufferLoader.prototype.load = function() {
        for (let i = 0; i < this.urlList.length; ++i)
            this.loadBuffer(this.urlList[i], i);
    }

    this.init=function init() {
        // Fix up prefixing
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        context = new AudioContext();
        bufferLoader = new BufferLoader(context,[path],finishedLoading);
        bufferLoader.load();
    }


    function finishedLoading(bufferList) {
        console.log("Loading...");
        let cdata = bufferList[0].getChannelData(0);

if(false)
    renderWave()


        let lastSampMag = 0;
        let averageSum = 0;
        let averageWindow=[];
        let averageWindowSize = 10000;
        let averageHead = 0;
        let ampThresh = 0.009;
        let minSpanLength = 1000;
        let averageAmp=0;

        function processRegion(startX, endX, rgnScale) {
            let bsx = startX * 2;
            let bex = endX * 2;
            for (let i = bsx; i < bex; i++)
                buf[i] = 0;
            let len = cdata.length * rgnScale;
            let startSamp = (startX * len / cwidth) | 0;
            let endSamp = (endX * len / cwidth) | 0;
            let abs = (v)=>v < 0 ? -v : v
            for (let i = startSamp; i < endSamp; i++) {
                let bucket = ((i * buf.length / len) | 0) & (~1);
                buf[bucket]++;
                let samp = abs(cdata[i]);
                buf[bucket + 1] = buf[bucket + 1] < samp ? samp : buf[bucket + 1];


                averageSum+=samp;
                if(averageWindow.length < averageWindowSize){
                    averageWindow.push(samp);
                }else{
                    let prv = averageWindow[averageHead];
                    averageWindow[averageHead]=samp;
                    averageHead = (averageHead+1)%averageWindow.length;
                    averageSum -= prv;
                }
                averageAmp = averageSum / averageWindow.length;

                if((lastSampMag>ampThresh) && (averageAmp<ampThresh)){
                    if (wasInSpan) {
                        wasInSpan = false;
                        let spanLen = (i - spanStart);
                        if (spanLen > minSpanLength)
                            spans.push(spanStart, i);
                        spanStart = i;
                    }
                }else if(averageAmp<ampThresh){
                    if (!wasInSpan) {
                        wasInSpan = true;
                        spanStart = i;
                    }
                }
                lastSampMag = averageAmp;
                //buf[bucket + 1] = averageAmp<ampThresh?0:0.5;
            }
            renderBuf(buf,startX,endX)
        }

        self.playRandomSample = ()=>{
            self.playSample((Math.random() * (spans.length-1))|0)
        }

        self.playSample = (sampleIndex)=>{

            if (source1) {
                source1.stop();
                source1 = null;
            }
            
            source1 = context.createBufferSource();
            let samp = source1.buffer = bufferList[0];
            source1.connect(context.destination);

            if (spans.length > 1) {
                let si = sampleIndex%(spans.length-1);
                let ss = (spans[si] / (samp.sampleRate ));
                let se = (spans[si + 1] / (samp.sampleRate ));
                source1.start(0, ss, se - ss);

                if (Math.random() > 0.9)
                    source1.detune.setValueAtTime((Math.random() - 0.85) * 1300, se - ss);

                let rxs = spans[si];
                let rxe = spans[si+1];



                if (playContinuous) {
                    setTimeout(()=>{
                        self.playRandomSample();
                    }
                    , (se - ss) * 1000);
                }

                renderSpan(ss,se,samp.duration)

            }
        }

        let onFinished = ()=>{
            //window.addEventListener("mousedown", mouseHandler);
            //playContinuous = true;
            //self.playRandomSample();
        }
        let rx = 0;
        let rgnSize = 150;
        let task = setInterval(()=>{
            let ex = rx + rgnSize;
            if (ex > cwidth)
                ex = cwidth;
            processRegion(rx, ex, 1);
            rx += rgnSize;
            if (ex >= cwidth) {
                clearInterval(task);

                ctx && renderSpans(spans,bufferList[0].sampleRate,bufferList[0].duration)
                
                if (onFinished)
                    onFinished();
            }
        }
        )
    }


/***** vis *******/

let ctx;
    function renderWave(){

        let domElement = document.createElement('div')
        document.body.appendChild(domElement)
        domElement.innerHTML = '<input id="checkBox" type="checkbox">MAGA</input>';
        let chk = domElement.children[0];
        chk.onchange = (val)=>{
            if (val.target.checked) {
                if (!playContinuous) {
                    playContinuous = true;
                    playRandomSample();
                }
            } else
                playContinuous = false;
        }
        domElement.style.overflow = "auto";

        canv.width = cwidth;
        canv.height = cheight;
        canv.style.width=cwidth+'px'
        canv.style.height = cheight+'px';
        //domElement.style.width=domElement.style.height = undefined;
         ctx = canv.getContext("2d");
        ctx.fillStyle = 'lightgrey';
        ctx.strokeStyle = 'black';
        ctx.fillRect(0, 0, canv.width, canv.height);
        domElement.appendChild(canv);

        ctx.lineWidth = 0.5;

    }

function renderBuf(buf,startX,endX){
if(!ctx)return
    let len = buf.length;
    ctx.beginPath();
    for (let i = startX; i < endX; i++) {
        let j = i * 2;
        if (buf[j])
            buf[j + 1] = buf[j + 1] * cheight2;
        let rx = i;
        let ry = buf[j + 1];

        ctx.moveTo(rx - 1, cheight2 - lastRY);
        ctx.lineTo(rx, cheight2 - ry);
        ctx.moveTo(rx - 1, cheight2 + lastRY);
        ctx.lineTo(rx, cheight2 + ry);

        lastRY = ry;
    }
    ctx.stroke();
}

        let renderSpan=(ss,se,duration)=>{
            if(!ctx)
                return;
            ctx.strokeStyle = 'rgba(0,255,0,.5)'
            //ctx.beginPath();
            let xratio = cwidth/duration;
            ctx.strokeRect(ss*xratio,4,(se-ss)*xratio,cheight-8);
//                    ctx.moveTo(rxs, 0);
//                    ctx.lineTo(rxs, cheight);
//                    ctx.stroke();
        }
        let renderSpans=(sampleRate,duration)=>{
            for(let i=0;i<(spans.length-1);i++){
                let ss = (spans[i] / sampleRate );
                let se = (spans[i + 1] / sampleRate );
                renderSpan( ss, se, duration)
            }

        }

}