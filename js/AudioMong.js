export default function AudioMong(){
//https://googledrive.com/host/0C2QKl-TsV6cVTE7wbWNOelRiRlk/filename.mp3
    var path = "crunch.ogg";
    window.onload = init;
    var context;
    var bufferLoader;
    var source1;
    var playContinuous = false;
    var canv = document.createElement("canvas");

    var cwidth = 8192;
    var cheight = 512;
    var cheight2 = cheight / 2;


    var buf = new Array(cwidth * 2);
    var lastRY = 0;
    var spanLen = 0;
    var wasInSpan = false;
    var spanStart = 0;
    var spans = [];

    function BufferLoader(context, urlList, callback) {
        this.context = context;
        this.urlList = urlList;
        this.onload = callback;
        this.bufferList = new Array();
        this.loadCount = 0;
    }

    BufferLoader.prototype.loadBuffer = function(url, index) {
        // Load buffer asynchronously
        var request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer";
        var loader = this;
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
        for (var i = 0; i < this.urlList.length; ++i)
            this.loadBuffer(this.urlList[i], i);
    }

    function init() {
        // Fix up prefixing
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        context = new AudioContext();
        bufferLoader = new BufferLoader(context,[path],finishedLoading);
        bufferLoader.load();
    }
    
    function finishedLoading(bufferList) {
        console.log("Loading...");
        var cdata = bufferList[0].getChannelData(0);
        document.body.innerHTML = '<input id="checkBox" type="checkbox">MAGA</input>';
        var chk = document.body.children[0];
        chk.onchange = (val)=>{
            if (val.target.checked) {
                if (!playContinuous) {
                    playContinuous = true;
                    playRandomSample();
                }
            } else
                playContinuous = false;
        }
        document.body.style.overflow = "auto";

        canv.width = cwidth;
        canv.height = cheight;
        var ctx = canv.getContext("2d");
        ctx.fillStyle = 'lightgrey';
        ctx.strokeStyle = 'black';
        ctx.fillRect(0, 0, canv.width, canv.height);
        document.body.appendChild(canv);

        ctx.lineWidth = 0.5;

        var lastSampMag = 0;
        var averageSum = 0;
        var averageWindow=[];
        var averageWindowSize = 10000;
        var averageHead = 0;
        var ampThresh = 0.009;
        var minSpanLength = 1000;
        var averageAmp=0;

        function processRegion(startX, endX, rgnScale) {
            var bsx = startX * 2;
            var bex = endX * 2;
            for (var i = bsx; i < bex; i++)
                buf[i] = 0;
            var len = cdata.length * rgnScale;
            var startSamp = (startX * len / cwidth) | 0;
            var endSamp = (endX * len / cwidth) | 0;
            var abs = (v)=>v < 0 ? -v : v
            for (var i = startSamp; i < endSamp; i++) {
                var bucket = ((i * buf.length / len) | 0) & (~1);
                buf[bucket]++;
                var samp = abs(cdata[i]);
                buf[bucket + 1] = buf[bucket + 1] < samp ? samp : buf[bucket + 1];


                averageSum+=samp;
                if(averageWindow.length < averageWindowSize){
                    averageWindow.push(samp);
                }else{
                    var prv = averageWindow[averageHead];
                    averageWindow[averageHead]=samp;
                    averageHead = (averageHead+1)%averageWindow.length;
                    averageSum -= prv;
                }
                averageAmp = averageSum / averageWindow.length;

                if((lastSampMag>ampThresh) && (averageAmp<ampThresh)){
                    if (wasInSpan) {
                        wasInSpan = false;
                        var spanLen = (i - spanStart);
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
            len = buf.length;
            ctx.beginPath();
            for (var i = startX; i < endX; i++) {
                var j = i * 2;
                if (buf[j])
                    buf[j + 1] = buf[j + 1] * cheight2;
                var rx = i;
                var ry = buf[j + 1];

                ctx.moveTo(rx - 1, cheight2 - lastRY);
                ctx.lineTo(rx, cheight2 - ry);
                ctx.moveTo(rx - 1, cheight2 + lastRY);
                ctx.lineTo(rx, cheight2 + ry);

                lastRY = ry;
            }
            ctx.stroke();
        }

        var playRandomSample = ()=>{

            if (source1) {
                source1.stop();
                source1 = null;
            }
            
            source1 = context.createBufferSource();
            source1.buffer = bufferList[0];
            source1.connect(context.destination);

            if (spans.length > 1) {
                var si = (Math.random() * spans.length) & (~1);
                var ss = (spans[si] / (bufferList[0].sampleRate ));
                var se = (spans[si + 1] / (bufferList[0].sampleRate ));
                source1.start(0, ss, se - ss);

                if (Math.random() > 0.9)
                    source1.detune.setValueAtTime((Math.random() - 0.85) * 1300, se - ss);

                var rxs = spans[si];
                var rxe = spans[si+1];
                ctx.strokeStyle = 'green'
                ctx.beginPath();
                ctx.strokeRect(rxs,4,rxe-rxs,cheight-8);
//                    ctx.moveTo(rxs, 0);
//                    ctx.lineTo(rxs, cheight);
//                    ctx.stroke();

                if (playContinuous) {
                    setTimeout(()=>{
                        playRandomSample();
                    }
                    , (se - ss) * 1000);
                }
            }
        }

        var mouseHandler = (evt)=>{

        }

        var onFinished = ()=>{
            window.addEventListener("mousedown", mouseHandler);
            playContinuous = true;
            playRandomSample();
        }
        var rx = 0;
        var rgnSize = 150;
        var task = setInterval(()=>{
            var ex = rx + rgnSize;
            if (ex > cwidth)
                ex = cwidth;
            processRegion(rx, ex, 1);
            rx += rgnSize;
            if (ex >= cwidth) {
                clearInterval(task);
                if (onFinished)
                    onFinished();
            }
        }
        )
    }
    return {init};
}