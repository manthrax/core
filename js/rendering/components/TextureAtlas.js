
import potpack from '../../3p/potpack.js';

/**
 * Dynamic texture atlas
 *
 */
let __DEV__ = false;
let shouldDebug;

let RENDERER_TYPE_GPU_DESKTOP=1;
let RENDERER_TYPE_GPU_MOBILE = 2;
let rendererType = RENDERER_TYPE_GPU_DESKTOP

export default class TextureAtlas {
  constructor(_THREE, _shouldDebug) {
    shouldDebug=_shouldDebug
    let THREE = _THREE;
    //const { three: THREE, type: rendererType } = renderer;
    let renderer={}
    let DATA_TEXTURE_SIZE = this.indexWidth = 2048;
    const data = new Float32Array(DATA_TEXTURE_SIZE * 4);
    const ctx = (this.ctx = document.createElement('canvas').getContext('2d'));
    const { canvas } = ctx;

    this.shouldDebug = shouldDebug;
    //this.rendererType = rendererType;
    this.indexData = data;
    this.canvas = canvas;
    this.entries = [];

    if (rendererType === RENDERER_TYPE_GPU_DESKTOP) {
      this.atlasIndex = new THREE.DataTexture(
        data,
        DATA_TEXTURE_SIZE,
        1,
        THREE.RGBAFormat,
        THREE.FloatType
      );
    }

    canvas.width = canvas.height = DATA_TEXTURE_SIZE;

    this.atlasTexture = new THREE.CanvasTexture(canvas);
    this.atlasTexture.flipY = false;

  }

  /**
   * Logs to the console when in dev mode.
   *
   */
  log(...args) {
    if (!__DEV__) {
      return;
    }

    console.log(...args);
  }

  /**
   * Debugs the texture atlas by rendering it to a canvas in the DOM.
   *
   */
  debug() {
    const { canvas, ctx } = this;
    const halfmax = canvas.width;
/*
    ctx.fillStyle = 'purple';
    ctx.fillRect(0, 0, halfmax, halfmax);
    ctx.fillStyle = 'green';
    ctx.fillRect(0, halfmax, halfmax, halfmax);
    ctx.fillStyle = 'blue';
    ctx.fillRect(halfmax, 0, halfmax, halfmax);
    ctx.fillStyle = 'orange';
    ctx.fillRect(halfmax, halfmax, halfmax, halfmax);
    ctx.fillStyle = 'yellow';
    ctx.font = ((canvas.width*.1)|0) + 'px Verdana';
    ctx.fillText('top row', 100, 500);
    ctx.fillStyle = 'pink';
    ctx.fillText('bottom row', 100, 1500);
*/
    canvas.style.position = 'absolute';
    canvas.style.width = canvas.style.height = '1024px' //canvas.width+'px';
    canvas.style.left = canvas.style.top = '0px';
    canvas.style.zIndex = 100;

    //document.body.appendChild(canvas);
  }

  /**
   * Adds a texture to the texture atlas and flags that the atlas needs to be updated.
   *
   */
  addTexture(texture) {
    this.log('Adding texture to atlas:', texture.uuid);

    texture.textureIndex = this.entries.length;
    this.entries.push({ texture: texture });
    this.needsUpdate = true;
  }

  /**
   * Updates the texture atlas. Will only rebuild the atlas if all images are loaded.
   *
   */
  update() {
    if (!this.needsUpdate) {
      return;
    }

    const {
      entries,
      canvas,
      indexData,
      ctx,
      atlasIndex,
      atlasTexture,
   //   rendererType,
    } = this;

    for (let i = 0; i < entries.length; i++) {
      if (!entries[i].texture.image) {
        return;
      }
    }

    this.needsUpdate = false;

    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const { texture } = e;
      const { width, height } = texture.image;

      e.w = width;
      e.h = height;
    }

    const stats = potpack(entries);

    this.log('Rebuilt atlas:', stats);

    if (canvas.width != stats.w || canvas.height != stats.h) {
      canvas.width = stats.w;
      canvas.height = stats.h;
    }

    for (let i = 0; i < entries.length; i++) {
      const e = this.entries[i];
      const ii = e.texture.textureIndex * 4;

      if (rendererType === RENDERER_TYPE_GPU_DESKTOP) {
        indexData[ii + 0] = e.x / canvas.width;
        indexData[ii + 1] = e.y / canvas.height;
        indexData[ii + 2] = (e.x + e.w) / canvas.width;
        indexData[ii + 3] = (e.y + e.h) / canvas.height;
      }

      if (rendererType === RENDERER_TYPE_GPU_MOBILE) {
        indexData[ii + 0] = e.x / (canvas.width + 1);
        indexData[ii + 1] = e.y / (canvas.height + 1);
        indexData[ii + 2] = (e.x + e.w) / (canvas.width + 1);
        indexData[ii + 3] = (e.y + e.h) / (canvas.height + 1);
      }

      ctx.drawImage(e.texture.image, e.x, e.y, e.w, e.h);
    }

    if (rendererType === RENDERER_TYPE_GPU_DESKTOP) {
      atlasIndex.needsUpdate = true;
    }

    atlasTexture.needsUpdate = true;

    if (shouldDebug) {
      this.debug(canvas, ctx);
    }

  }

  /**
   * Disposes of the textures used by the texture atlas.
   *
   * @return void
   */
  destroy() {
    const { atlasIndex, atlasTexture, canvas } = this;

    atlasTexture.dispose();
    atlasIndex && atlasIndex.dispose();

    if (this.shouldDebug) {
      canvas.remove();
    }

    this.entries = [];
  }
}