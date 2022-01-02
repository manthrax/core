
class Input
{
    constructor(){
        this.eventFrame = 1;

        let activatedInputs = {}
        let deactivatedInputs = {}

        this.bindings={}

        let bind = (bindings,events,to)=>{
            events=events instanceof Array ? events : [events]
            for(let i=0;i<events.length;i++){
                let b=bindings[events[i]]
                b = b ? b : []
                b.push(to);
                bindings[events[i]]=b;
            }
        }
        let fireBindings = (bindings,event,value)=>{
            let b=bindings[event];
            if(b)for(let i=0;i<b.length;i++)b[i](value);
        }
        this.bind=(events,toevent)=>{
            bind(this.bindings,events,toevent)
        }
        this.changeBindings = {}
        this.onChanged=(inputs,fn)=>{
            bind(this.changeBindings,inputs,fn)
        }
        let activate=(key)=>{
            if( activatedInputs[key] ) return;
            activatedInputs[key] = activatedInputs[key] || this.eventFrame;
            deactivatedInputs[key]=0;
            if(activatedInputs[key] == this.eventFrame){
                fireBindings(this.changeBindings,key,true)
                let b=this.bindings[key];
                if(b)for(let i=0;i<b.length;i++)activate(b[i])
            }
        }
        let deactivate=(key)=>{
            if( deactivatedInputs[key] ) return
            deactivatedInputs[key] = deactivatedInputs[key] || this.eventFrame;
            activatedInputs[key]=0;
            if(deactivatedInputs[key] == this.eventFrame){
                fireBindings(this.changeBindings,key,false)
                let b=this.bindings[key];
                if(b)for(let i=0;i<b.length;i++)deactivate(b[i])
            }
        }
        document.addEventListener('keydown',(e)=>{
            activate(e.code)
        })
        document.addEventListener('keyup',(e)=>{
            deactivate(e.code)
        })

        this.checkActive=(keys)=>{
            keys = keys instanceof Array ? keys:[keys]
            for(let i=0;i<keys.length;i++)
                if(activatedInputs[keys[i]])return true;
        }

        this.checkActivated=(k)=>{
            k = k instanceof Array ? k : [k]
            for(let i=0;i<k.length;i++){
                if(activatedInputs[k[i]] === this.eventFrame){
                    //pressedKeys[k]=false
                    return true;
                }
            }
            return false;
        }
        this.checkDeactivated=(k)=>{
            k = k instanceof Array ? k : [k]
            for(let i=0;i<k.length;i++){
                if(deactivatedInputs[k[i]] === this.eventFrame){
                    //pressedKeys[k]=false
                    return true;
                }
            }
            return false;
        }
        this.endFrame = ()=>this.eventFrame++;
        


    }
}

export default Input;
