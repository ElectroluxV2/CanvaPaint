import { Injectable } from '@angular/core';
import { CompiledObject } from './compiled-objects/compiled-object';

export interface SavedCanvas {
  id: string;
  title: string;
  image?: string;
  objects: Map<string, CompiledObject>;
}

@Injectable({
  providedIn: 'root'
})
export class SavedCanvasService {

  constructor() { }

  public async* canvases(): AsyncGenerator<SavedCanvas> {
    for (const key of Object.keys(localStorage)) {
      if (key[0] !== 'C') { continue; }
      yield this.getCanvas(key);
    }
  }

  public saveCanvas(canvas: SavedCanvas): void {
    if (canvas.id[0] !== 'C') {
      canvas.id = `C${canvas.id}`;
    }

    canvas.image = null;
    console.log(JSON.stringify(canvas))
    console.log(canvas)

    localStorage.setItem(canvas.id, JSON.stringify(canvas));
  }

  public async getCanvas(id: string): Promise<SavedCanvas> {
    if (id[0] !== 'C') {
      id = `C${id}`;
    }

    const json = localStorage.getItem(id);

    if (json === null) {
      const placeholder = await this.placeholderCanvas(id);
      this.saveCanvas(placeholder);
      return placeholder;
    }

    const canvas = JSON.parse(json);

    if (!(canvas.objects instanceof Map)) {
      console.log(canvas.objects);
      canvas.objects = new Map();
    }

    return canvas;
  }

  private async placeholderCanvas(id: string): Promise<SavedCanvas> {
    const canvas = { id } as SavedCanvas;

    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const offScreenCanvas = new OffscreenCanvas(64, 64);
    const context = offScreenCanvas.getContext('2d');
    const imageData = context.getImageData(0, 0, 64, 64);

    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = randomInt(0, 255);
      imageData.data[i + 1] = randomInt(0, 255);
      imageData.data[i + 2] = randomInt(0, 255);
      imageData.data[i + 3] = 255;
    }

    context.putImageData(imageData, 0, 0);
    const blob = await offScreenCanvas.convertToBlob();
    const base64 = await new Promise(resolve => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        resolve(String(reader.result));
      };
    }) as string;

    canvas.title = 'Untitled';
    canvas.image = base64;
    canvas.objects = new Map<string, CompiledObject>();

    return canvas;
  }
}
