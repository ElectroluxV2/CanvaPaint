import { Component, ViewChild, ElementRef, AfterViewInit, EventEmitter, OnDestroy, NgZone } from '@angular/core';
import { SettingsService } from './settings/settings.service';
import { PublicApi } from './paint/public-api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mainCanvas', { read: ElementRef }) mainCanvas: ElementRef;
  @ViewChild('predictCanvas', { read: ElementRef }) predictCanvas: ElementRef;

  public statusEmitter: EventEmitter<string> = new EventEmitter<string>();

  constructor(private ngZone: NgZone, private settingsService: SettingsService) { }

  ngAfterViewInit(): void {
    PublicApi.Create(this.ngZone, this.mainCanvas.nativeElement, this.predictCanvas.nativeElement, this.settingsService);

    /*this.paint.statusEmitter.subscribe((value) => {
      this.statusEmitter.emit(value);
    });*/
  }

  ngOnDestroy(): void {
    // this.paint.statusEmitter.unsubscribe();
  }
}
