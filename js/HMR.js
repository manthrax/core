
let ws = new WebSocket(((location.protocol=="http:")?'ws://':'wss://')+location.host);
ws.onopen = ()=>{
  console.log("HMR CONNECTED")
  ws.onmessage=(event)=>{
    console.log("WSS ",event.data)
    if(typeof event.data === 'string'){
      if(event.data.indexOf('hmr ')==0){
        let path = event.data.slice(4).replaceAll('\\','/');
        if((path.indexOf('core/')==0)||(path.indexOf(location.pathname.slice(1).split('/')[0])==0))
            location.reload();
      }
    }
  }
}
