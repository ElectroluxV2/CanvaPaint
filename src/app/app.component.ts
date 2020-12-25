import { Component, ViewChild, ElementRef, AfterViewInit, EventEmitter, OnDestroy } from '@angular/core';
import { SettingsService } from './settings/settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mainCanvas', { read: ElementRef }) mainCanvas: ElementRef;
  @ViewChild('predictCanvas', { read: ElementRef }) predictCanvas: ElementRef;

  private paintMainWorker: Worker;

  // Emits paint status to toolbar
  public statusEmitter: EventEmitter<string> = new EventEmitter<string>();

  constructor(private settingsService: SettingsService) {
    this.paintMainWorker = new Worker('./paint/paint-main.worker.ts', {
      type: 'module'
    });
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
      mainCanvas: mainOffCanvas,
      predictCanvas: predictOffCanvas,
      devicePixelRatio: window.devicePixelRatio
    }, [mainOffCanvas, predictOffCanvas]);

    this.paintMainWorker.onmessage = ({ data }) => {
      console.log('From Web Worker:', data);
    };


    // this.paint = new Paint(this.mainCanvas.nativeElement, this.predictCanvas.nativeElement);

    /*this.paint.statusEmitter.subscribe((value) => {
      this.statusEmitter.emit(value);
    });*/
  }

  ngOnDestroy(): void {
    // this.paint.statusEmitter.unsubscribe();
    this.paintMainWorker.terminate();
  }

  public changeMode(value: string): void {
    // this.paint.OnModeChange(value);
  }

  public undo(): void {

  }

  public redo(): void {

  }

  public clear(): void {
    // this.paint.OnClear();
  }

  public onResize(event: Event): void {
    // this.paint.OnResize(event);
  }

  public changeA(): void {

  }
}
