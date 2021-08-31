import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SavedCanvasService } from '../../paint/saved-canvas.service';
import { Protocol } from '../../paint/protocol/protocol';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  public canvases = [];

  constructor(public router: Router, private savedCanvasService: SavedCanvasService) {
    (async () => {
      for await (const canvas of this.savedCanvasService.canvases()) {
        this.canvases.push(canvas);
      }
    })();
  }

  public settings(id: string): void {  }

  public async duplicate(id: string): Promise<void> {
    const canvas = await this.savedCanvasService.getCanvas(id);
    canvas.id = Protocol.generateId();
    this.canvases.push(canvas);
    this.savedCanvasService.saveCanvas(canvas);
  }

  public share(id: string): void {   }

  public async add(): Promise<void> {
    this.canvases.push(await this.savedCanvasService.getCanvas(Protocol.generateId()));
  }
}
