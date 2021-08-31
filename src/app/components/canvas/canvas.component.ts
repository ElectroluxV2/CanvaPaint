import { AfterViewInit, Component, ElementRef, EventEmitter, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Paint } from '../../paint/paint';
import { ControlService } from '../../paint/control.service';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements AfterViewInit, OnDestroy {

  @ViewChild('mainCanvas', {read: ElementRef}) mainCanvas: ElementRef;
  @ViewChild('predictCanvas', {read: ElementRef}) predictCanvas: ElementRef;
  @ViewChild('predictCanvasNetwork', {read: ElementRef}) predictCanvasNetwork: ElementRef;
  @ViewChild('selectionCanvas', {read: ElementRef}) selectionCanvas: ElementRef;

  public paint: Paint;
  public statusEmitter: EventEmitter<string> = new EventEmitter<string>();

  constructor(private ngZone: NgZone, private settingsService: ControlService) {
  }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.paint = new Paint(this.mainCanvas.nativeElement, this.predictCanvas.nativeElement, this.predictCanvasNetwork.nativeElement, this.selectionCanvas.nativeElement, this.settingsService);
    });

    this.paint.statusEmitter.subscribe(value => {
      this.statusEmitter.emit(value);
    });
  }

  ngOnDestroy(): void {
    this.paint.destroy();
  }

}
