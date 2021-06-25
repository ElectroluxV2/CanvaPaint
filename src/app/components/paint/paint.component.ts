import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeWhile } from 'rxjs/operators';
import { ControlService } from '../../paint/control.service';
import { SavedCanvas } from '../../paint/saved-canvas.service';

@Component({
  selector: 'app-paint',
  templateUrl: './paint.component.html',
  styleUrls: ['./paint.component.scss']
})
export class PaintComponent implements OnDestroy {
  private alive = true;

  constructor(private route: ActivatedRoute, private controlService: ControlService) {
    route.params.pipe(takeWhile(() => this.alive)).subscribe((savedCanvas: SavedCanvas) => controlService.savedCanvas.next(savedCanvas));
  }

  public ngOnDestroy(): void {
    this.alive = false;
  }
}
