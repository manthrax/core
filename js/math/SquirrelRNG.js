
import {createCanvas} from '../rendering/CanvasUtil.js'

function sqNoise1(positionX, seed=0) {
    let BIT_NOISE1 = 0x68E31DA4;
    let BIT_NOISE2 = 0xB5297A4D;
    let BIT_NOISE3 = 0x1B56C4E9;
    let mangle = positionX & 0x7fffffff;
    mangle *= BIT_NOISE1;
    mangle += seed;
    mangle ^= mangle >> 8;
    mangle += BIT_NOISE2;
    mangle ^= mangle << 8;
    mangle *= BIT_NOISE3;
    mangle ^= mangle >> 8;
    return mangle & (0xffffffff);
}
let sqNoise2 = (x,y,seed)=>sqNoise1(x, sqNoise1(y, seed))

function sqrng(_seed=0) {
    this.seed = _seed;
    this.i = 0;
    this.krnd = (i)=>sqNoise1(this.i = i)
    this.ru32 = ()=>sqNoise1(this.i++, this.seed);
    this.rs32 = ()=>sqNoise1(this.i++, this.seed) - 0x8000000;
    this.ruf32 = ()=>sqNoise1(this.i++, this.seed) / 0x7FFFFFFF;
    this.rsf32 = ()=>(sqNoise1(this.i++, this.seed) - 0x8000000) / 0x8000000;
}

let test = ()=>{
    let rng = new sqrng(1234)

    // for(let i=-100;i<100;i++)console.log(sqNoise1( i, 1234));

    let sz = 1024;
    let canv = createCanvas(sz, sz);
    let pix = canv.getPixels()

    let seed = 1234;
    setInterval(()=>{
        let ctr = 0;
        let msk32 = 0xffffffff
        let scl = 1;
        //.1
        for (let x = 0; x < sz; x++)
            for (let y = 0; y < sz; y++) {
                let v = sqNoise2(x * scl, y * scl, seed);
                pix[ctr++] = //(v>>24)&255;
                pix[ctr++] = //(v>>16)&255;
                pix[ctr++] = (v >> 8) & 255;
                pix[ctr++] = 255;
                //(v>>0 )&255;
            }
        canv.setPixels(pix)
        seed++
        console.log(seed)
    }
    , 200)
    console.log(sqNoise1(0, 1234));
    let px = canv.pixels;

    document.body.appendChild(canv)

}
