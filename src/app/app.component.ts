import { Component, ViewChild, ElementRef, AfterViewInit, EventEmitter, OnDestroy } from '@angular/core';
import { Paint } from './paint';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild("canv", { read: ElementRef }) canv: ElementRef;
  @ViewChild("canv2", { read: ElementRef }) canv2: ElementRef;
  @ViewChild("canv3", { read: ElementRef }) canv3: ElementRef;

  private paint: Paint;

  public statusEmiter: EventEmitter<string> = new EventEmitter<string>();

  ngAfterViewInit(): void {
    this.paint = new Paint(this.canv.nativeElement, this.canv2.nativeElement, this.canv3.nativeElement);
    this.paint.statusEmiter.subscribe((value) => {
      this.statusEmiter.emit(value);
    })
    this.paint.scale();
  }

  ngOnDestroy(): void {
    this.paint.statusEmiter.unsubscribe();
  }

  public changeMode(value: string): void {
    this.paint.setMode(value);
  }

  public changeColor(value: string): void {
    this.paint.setColor(value);
  }

  public undo(): void {
    this.paint.undo();
  }

  public redo(): void {
    this.paint.redo();
  }

  public clear(): void {
    this.paint.clear();
  }

  public onResize(event: Event): void {
    this.paint.scale();
  }

  public changeA(): void {
    let addres = prompt('Podaj cay adres', 'http://192.168.0.108:3000');
    this.paint.changeServerAddress(addres);
  }
}
