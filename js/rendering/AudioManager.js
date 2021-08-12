import AudioClipper from '../AudioClipper.js'

function AudioManager(THREE) {

    let gotGesture = false;
    let samples = {}
    let playQueue = []
    let channels = []
    let MAX_CHANNELS = 4;
    let audioSlicer = new AudioClipper('./assets/kenney_ui_audio.ogg')
    let audioListener = new THREE.AudioListener();
    for(let i=0;i<MAX_CHANNELS;i++)
        channels.push(new THREE.Audio(audioListener));

    let mousedown = (e)=>{
        gotGesture = true;
        document.removeEventListener('mousedown', mousedown)
        document.dispatchEvent(new CustomEvent('audio-ready'))

        audioSlicer.init()
    }
    document.addEventListener('mousedown', mousedown)

    this.load = (url,name)=>{
        new THREE.AudioLoader().load(url, buffer=>samples[name] = buffer)
    }

    this.loadClips=( url, baseName )=>{
        
    }
    this.play = (name)=>{
        playQueue.push({
            name
        })
    }

    this.update = ( camera )=>{
        if(audioListener.parent!==camera)
            camera.add(audioListener);
        if (!gotGesture)
            return
        if (!playQueue.length)
            return
        let freeChannels = channels.filter(c=>!c.isPlaying)
        if (!freeChannels.length)
            return
        let c = freeChannels[0]
        let q = playQueue[0]
        let samp = samples[q.name]
        if(!samp)
            return
        playQueue.shift()
        if(c.parent)c.parent.remove(c)
        if(c.parent!=q.parent)q.parent.add(c)
        if(q.position)c.position.copy(q.position)
        c.setBuffer(samp);
        c.setLoop(false);
        c.setVolume(1.);
        c.play();
    }
}

export default AudioManager;
