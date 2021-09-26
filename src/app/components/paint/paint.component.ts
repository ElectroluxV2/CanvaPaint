import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeWhile } from 'rxjs/operators';
import { ControlService } from '../../paint/control.service';

@Component({
  selector: 'app-paint',
  templateUrl: './paint.component.html',
  styleUrls: ['./paint.component.scss']
})
export class PaintComponent implements OnDestroy {
  private alive = true;

  constructor(private route: ActivatedRoute, private controlService: ControlService) {
    route.data.pipe(takeWhile(() => this.alive)).subscribe(({canvas}) => this.controlService.savedCanvas.next(canvas));
  }

  public ngOnDestroy(): void {
    this.alive = false;
  }
}
