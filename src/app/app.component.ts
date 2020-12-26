import { Component, ViewChild, ElementRef, AfterViewInit, EventEmitter, OnDestroy, NgZone } from '@angular/core';
import { SettingsService } from './settings/settings.service';
import { WorkerMessagesEnum } from './paint/workerMessages.enum';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnDestroy {

  constructor(private ngZone: NgZone, private settingsService: SettingsService) {
    this.paintMainWorker = new Worker('./paint/paint-main.worker.ts', {
      type: 'module'
    });
  }

  @ViewChild('mainCanvas', { read: ElementRef }) mainCanvas: ElementRef;
  @ViewChild('predictCanvas', { read: ElementRef }) predictCanvas: ElementRef;

  private paintMainWorker: Worker;
  private animFrameGlobID;

  // Emits paint status to toolbar
  public statusEmitter: EventEmitter<string> = new EventEmitter<string>();

  private static NormalizePoint(event: PointerEvent): Float32Array {
    // TODO: multi-touch
    const point = new Float32Array([
      event.offsetX,
      event.offsetY
    ]);

    // Make sure the point does not go beyond the screen
    point[0] = point[0] > window.innerWidth ? window.innerWidth : point[0];
    point[0] = point[0] < 0 ? 0 : point[0];

    point[1] = point[1] > window.innerHeight ? window.innerHeight : point[1];
    point[1] = point[1] < 0 ? 0 : point[1];

    point[0] *= window.devicePixelRatio;
    point[1] *= window.devicePixelRatio;

    return point;
  }

  ngAfterViewInit(): void {

    // Setup canvas, remember to rescale on window resize
    this.mainCanvas.nativeElement.height = this.mainCanvas.nativeElement.parentElement.offsetHeight * window.devicePixelRatio;
    this.mainCanvas.nativeElement.width = this.mainCanvas.nativeElement.parentElement.offsetWidth * window.devicePixelRatio;
    this.predictCanvas.nativeElement.height = this.mainCanvas.nativeElement.height;
    this.predictCanvas.nativeElement.width = this.mainCanvas.nativeElement.width;

    const mainOffCanvas = this.mainCanvas.nativeElement.transferControlToOffscreen();
    const predictOffCanvas = this.predictCanvas.nativeElement.transferControlToOffscreen();

    this.paintMainWorker.postMessage({
      type: WorkerMessagesEnum.CanvasSetup,
      mainCanvas: mainOffCanvas,
      predictCanvas: predictOffCanvas,
      devicePixelRatio: window.devicePixelRatio
    }, [mainOffCanvas, predictOffCanvas]);

    this.predictCanvas.nativeElement.onpointermove = (event: PointerEvent) => {
      this.paintMainWorker.postMessage({
        type: WorkerMessagesEnum.PointerMove,
        point: AppComponent.NormalizePoint(event)
      });
    };

    this.predictCanvas.nativeElement.onpointerdown = (event: PointerEvent) => {
      this.paintMainWorker.postMessage({
        type: WorkerMessagesEnum.PointerDown,
        point: AppComponent.NormalizePoint(event)
      });
    };

    this.predictCanvas.nativeElement.onpointerup = (event: PointerEvent) => {
      this.paintMainWorker.postMessage({
        type: WorkerMessagesEnum.PointerUp,
        point: AppComponent.NormalizePoint(event)
      });
    };

    this.settingsService.settings.subscribe(newSettings => {
      this.paintMainWorker.postMessage({
        type: WorkerMessagesEnum.Settings,
        newSettings
      });
    });

    this.paintMainWorker.onmessage = ({ data }) => {
      console.log('From Web Worker:', data);
    };

    this.AnimationLoop();

    /*this.paint.statusEmitter.subscribe((value) => {
      this.statusEmitter.emit(value);
    });*/
  }

  private AnimationLoop(): void {

    this.paintMainWorker.postMessage({
      type: WorkerMessagesEnum.AnimationFrame
    });

    this.ngZone.runOutsideAngular(() => {
      this.animFrameGlobID = window.requestAnimationFrame(this.AnimationLoop.bind(this));
    });
  }

  ngOnDestroy(): void {
    // this.paint.statusEmitter.unsubscribe();
    this.settingsService.settings.unsubscribe();
    this.paintMainWorker.terminate();
    window.cancelAnimationFrame(this.animFrameGlobID);
  }

  public changeMode(value: string): void {
    this.paintMainWorker.postMessage({
      type: WorkerMessagesEnum.Mode,
      mode: value
    });
  }

  public undo(): void {

  }

  public redo(): void {

  }

  public clear(): void {
    this.paintMainWorker.postMessage({
      type: WorkerMessagesEnum.Clear
    });
  }

  public onResize(event: Event): void {
    // this.paint.OnResize(event);
  }

  public changeA(): void {

  }
}
