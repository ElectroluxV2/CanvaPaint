import { Component, Output, EventEmitter, Input, OnDestroy, AfterViewInit } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material/button-toggle/public-api';

@Component({
  selector: 'app-bar',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.scss']
})
export class BarComponent implements AfterViewInit, OnDestroy {
  @Output() onModeChange: EventEmitter<String> = new EventEmitter<String>();
  @Output() onColorChange: EventEmitter<String> = new EventEmitter<String>();
  @Output() onUndo: EventEmitter<null> = new EventEmitter<null>();
  @Output() onRedo: EventEmitter<null> = new EventEmitter<null>();
  @Output() onClear: EventEmitter<null> = new EventEmitter<null>();
  @Output() onIconClick: EventEmitter<null> = new EventEmitter<null>();
  @Input('statusUpdate') onStatusUpdate: EventEmitter<string>;

  public iconColor: string[] = [];

  public ngAfterViewInit(): void {    
    this.onStatusUpdate.subscribe((value) => {
      this.iconColor = [value];
    });
  }

  public ngOnDestroy(): void {
    this.onStatusUpdate.subscribe();
  }

  public changeMode(event: MatButtonToggleChange): void {
    this.onModeChange.emit(event.value);
  }

  public changeColor(event: MatButtonToggleChange): void {
    this.onColorChange.emit(event.value);
  }

  public undo(): void {
    this.onUndo.emit();
  }

  public redo(): void {
    this.onRedo.emit();
  }

  public clear(): void {
    this.onClear.emit();
  }

  public iconClick(): void {
    this.onIconClick.emit();
  }
}
