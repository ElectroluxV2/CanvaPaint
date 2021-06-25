import { Injectable } from '@angular/core';

export interface SavedCanvas {
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class SavedCanvasService {

  public getSavedCanvas(id: string): SavedCanvas {
    const json = localStorage.getItem(id);

    if (json === null) {
      return {} as SavedCanvas;
    }

    return JSON.parse(json) as SavedCanvas;
  }
}
