import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SavedCanvas, SavedCanvasService } from './saved-canvas.service';

@Injectable({providedIn: 'root'})
export class SavedCanvasResolver implements Resolve<SavedCanvas> {
  constructor(private service: SavedCanvasService) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<SavedCanvas> | Promise<SavedCanvas> | SavedCanvas {
    return this.service.getCanvas(route.paramMap.get('id'));
  }
}
