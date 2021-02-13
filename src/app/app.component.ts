import { Component, ViewChild, ElementRef, AfterViewInit, EventEmitter, OnDestroy, NgZone } from '@angular/core';
import { ControlService } from './settings/control.service';
import { Paint } from './paint/paint';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mainCanvas', { read: ElementRef }) mainCanvas: ElementRef;
  @ViewChild('predictCanvas', { read: ElementRef }) predictCanvas: ElementRef;

  public paint: Paint;
  public statusEmitter: EventEmitter<string> = new EventEmitter<string>();

  constructor(private ngZone: NgZone, private settingsService: ControlService) { }

  ngAfterViewInit(): void {
    this.paint = new Paint(this.ngZone, this.mainCanvas.nativeElement, this.predictCanvas.nativeElement, this.settingsService);

    this.paint.statusEmitter.subscribe((value) => {
      this.statusEmitter.emit(value);
    });
  }

  ngOnDestroy(): void {
    this.paint.statusEmitter.unsubscribe();
  }
}
