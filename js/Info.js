
export default class Info{
    constructor(THREE){
        this.textAreas=[]
        this.seconds = performance.now()/1000 
        let mkTxt=({name,lineCount=1,persistence=Infinity})=>{
            this[name+"Html"]=(txt)=>{
                let ti=this[name+'TextArea']
                ti.span.innerHTML = txt;
            }
            this[name]=(txt)=>{
                let ti=this[name+'TextArea']
                ti.span.innerText +=((ti.lines>0)?'\n':'')+txt
                ti.lastWrite = this.seconds
                ti.lines++;
                while(ti.lines>ti.lineCount)ti.shift()
            }
            let span = document.createElement('span')
            let txt = this[name+'TextArea'] = {span,lineCount,persistence,lines:0}
            txt.shift=function(){
                let id=this.span.innerText.indexOf('\n');
                this.span.innerText = (id>=0)?this.span.innerText.slice(id+1):''
                this.lines-=(id>=0)?1:0;
            }
            this.textAreas.push(txt);
            span.style.zIndex = 100;
            span.style.position = 'absolute';
            span.style.border = span.style.margin = span.style.padding = '0px';
            span.style.left = '0px'
            span.style.width = '100%';
            span.style.pointerEvents = 'none';
            let loadingCount = 0;
            let loadedCount = 0;
            let url = 0
            document.body.appendChild(span)
            return span
        }
        mkTxt({name:'display',lineCount:1,persistence:5}).style.top='0px'
        let t = mkTxt({name:'message',lineCount:1,persistence:2});
        t.style.bottom='55%'
        t.style.fontSize='200%'
        t=mkTxt({name:'chat',lineCount:1})
        t.style.bottom='0px'
        t.style.textAlign='left';
        t=mkTxt({name:'chatHistory',lineCount:10,persistence:2})
        t.style.bottom='16px'
        t.style.textAlign='left';


        t=mkTxt({name:'tools',lineCount:10})
        t.style.top='0px'
        t.style.textAlign='center';
        t.style.right='100%'
        t.style.width='8%'
//? ⚙️ 👁 🔀 
        let btns = `🆕 🔍 🧠 + - ⎌`.split(' ').map(e=>`<span>${e}</span>`).join('</br>');
        this.toolsHtml(btns);
        t.style.pointerEvents = 'all'
        t.style.pointerEvents = 'all'
        for(let i=0;i<t.childNodes.length;i+=2){
            let n=t.childNodes[i];
            n.style.pointerEvents = 'all'
            n.style.cursor= 'default';
//<div class="tooltip">Hover over me<span class="tooltiptext">Tooltip text</span></div>
            n.addEventListener('pointerdown',(e)=>{
                this.message ( e.target.innerText );
                document.dispatchEvent(new CustomEvent('toolButtonClicked',{detail:{e}}))
            })
        }


        let updateLoads=(url,num,count)=>{
            let str =  `loading ${url}:(${num})/${count})`
            this.display(url?str:'ready.')
        }
        THREE.DefaultLoadingManager.cacheEnabled = true;
        THREE.DefaultLoadingManager.onLoad = 
        THREE.DefaultLoadingManager.onStart =
        THREE.DefaultLoadingManager.onProgress = updateLoads
        this.message('rdy')
        this.chat('')//<enter to chat>')
        this.update = (newTimeSeconds=performance.now()/1000)=>{
            for(let i=0,ti;(i<this.textAreas.length)&&(ti=this.textAreas[i]);i++){
                if((newTimeSeconds-ti.lastWrite)>ti.persistence){
                    ti.shift()
                    ti.lastWrite = newTimeSeconds;
                }
            }
            this.seconds = newTimeSeconds
        }
    }
}