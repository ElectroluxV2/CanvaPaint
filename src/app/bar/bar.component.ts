import { SettingsComponent } from '../settings/settings.component';
import { Component, Output, EventEmitter, Input, OnDestroy, AfterViewInit } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material/button-toggle/public-api';
import { MatDialog } from '@angular/material/dialog';
import {SettingsService} from '../settings/settings.service';

@Component({
  selector: 'app-bar',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.scss']
})
export class BarComponent implements AfterViewInit, OnDestroy {
  @Output() modeChange: EventEmitter<string> = new EventEmitter<string>();
  @Output() undo: EventEmitter<null> = new EventEmitter<null>();
  @Output() redo: EventEmitter<null> = new EventEmitter<null>();
  @Output() clear: EventEmitter<null> = new EventEmitter<null>();
  @Output() iconClick: EventEmitter<null> = new EventEmitter<null>();
  @Input() statusUpdate: EventEmitter<string>;

  constructor(public dialog: MatDialog, private settingsService: SettingsService) { }

  public iconColor: string[] = [];

  public ngAfterViewInit(): void {
    this.statusUpdate.subscribe((value) => {
      this.iconColor = [value];
    });

    // Preselected values must match in paint.ts
  }

  public ngOnDestroy(): void {
    this.statusUpdate.subscribe();
  }

  public emitModeChange(event: MatButtonToggleChange): void {
    this.modeChange.emit(event.value);
  }

  public colorChange(event: MatButtonToggleChange): void {
    this.settingsService.SetColorByName(event.value);
  }

  public emitUndo(): void {
    this.undo.emit();
  }

  public emitRedo(): void {
    this.redo.emit();
  }

  public emitClear(): void {
    this.clear.emit();
  }

  public emitIconClick(): void {

    const dialogRef = this.dialog.open(SettingsComponent, {
      width: '250px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      // console.log(result);
    });

    // this.onIconClick.emit();
  }
}
