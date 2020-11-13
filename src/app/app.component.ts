import {Component, ViewChild, ElementRef, AfterViewInit, EventEmitter, OnDestroy, NgZone} from '@angular/core';
import { Paint } from './paint';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mainCanvas', { read: ElementRef }) mainCanvas: ElementRef;
  @ViewChild('predictCanvas', { read: ElementRef }) predictCanvas: ElementRef;

  private paint: Paint;

  public statusEmitter: EventEmitter<string> = new EventEmitter<string>();

  constructor(private ngZone: NgZone) { }

  ngAfterViewInit(): void {
    this.paint = new Paint(this.ngZone, this.mainCanvas.nativeElement, this.predictCanvas.nativeElement);

    this.paint.statusEmitter.subscribe((value) => {
      this.statusEmitter.emit(value);
    });
  }

  ngOnDestroy(): void {
    this.paint.statusEmitter.unsubscribe();
  }

  public changeMode(value: string): void {
    this.paint.OnModeChange(value);
  }

  public changeColor(value: string): void {
    this.paint.OnColorChange(value);
  }

  public undo(): void {

  }

  public redo(): void {

  }

  public clear(): void {
    this.paint.OnClear();
  }

  public onResize(event: Event): void {
    this.paint.OnResize(event);
  }

  public changeA(): void {

  }
}
