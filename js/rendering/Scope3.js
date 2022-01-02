
export default class Scope3{
  destroy(){
    this.root && (this.root.node.parentElement.removeChild(this.root.node))
    this.root = null;
  }
  constructor({object,renderer}){
    let elem = (props)=>{
      let e={
        type:(v)=>e.node = document.createElement(v),
        width:(v)=>e.node.style.width=v,
        height:(v)=>e.node.style.height=v,
        left:(v)=>e.node.style.left=v,
        top:(v)=>e.node.style.top=v,
        background:(v)=>e.node.style.background=v,
        position:(v)=>e.node.style.position=v,
        fontFamily:(v)=>e.node.style.fontFamily=v,
        fontSize:(v)=>e.node.style.fontSize=v,
        color:(v)=>e.node.style.color=v,
        overflowY:(v)=>e.node.style.overflowY=v
      }
      e.type((props && props.type)||'div')
      props && Object.keys(props).forEach(p=>e[p](props[p]))
      return e;
    }
    let mcontainer = ()=>{
      let node = elem({
          type:'div',
          left:'0px',
          top:'0px',
          background:`rgba(0,0,0,.5)`,
          position:'absolute',
          fontFamily:'Verdana, sans-serif',
          fontSize:'12px',
          color:'white',
          overflowY:'auto'});
      return node;
    }
    let container = mcontainer()
    this.root = container
    renderer.domElement.parentElement.appendChild(container.node)
    let path=[]
    let trav=object;
    let root=object;
    while(trav.parent){path.push(root=trav);trav=trav.parent;}
    let str;
str=`<span>PRESS R TO REGENERATE </span>` 
    str += `<span>${root.type}</span></br>`
    while(path.length){
        let p  = path.pop();
        let ci=trav.children.indexOf(p);
        for(let l=trav.children.length,i=0;i<l;i++){
            let c = trav.children[i];
   
            str+=`<span>${i}:${c.type} n:${c.name} ro:${c.renderOrder} lyr:${c.layers.mask}`
            if(c.geometry)
                str+=' gtype:'+c.geometry.type + " vc:" + ((c.geometry.attributes.position&&c.geometry.attributes.position.count)||0)
            if(c.material){
                let m=c.material;
                if(m.length===undefined)m=[m]
                for(let i=0;i<m.length;i++){
                    let mm=m[i]
                    str+=`<span>${i} mat:${mm.type} </span>`
                }
            }
            str+='</br>'
            if(i==ci)
                str+=`<span>${i}+</span></br>`
        }
        str+=`</span></br>`
        trav=trav.children[ci];
    }
    container.node.innerHTML = str;
  }
}
