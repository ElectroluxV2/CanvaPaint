import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { SavedCanvas, SavedCanvasService } from './saved-canvas.service';

@Injectable({providedIn: 'root'})
export class SavedCanvasResolver implements Resolve<SavedCanvas> {
  constructor(private service: SavedCanvasService) { }

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<SavedCanvas> {
    return this.service.getCanvas(route.paramMap.get('id'));
  }
}
