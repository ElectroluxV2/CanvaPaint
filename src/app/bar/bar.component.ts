import { SettingsComponent } from '../settings/settings.component';
import { Component, Output, EventEmitter, Input, OnDestroy, AfterViewInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SettingsService } from '../settings/settings.service';

@Component({
  selector: 'app-bar',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.scss']
})
export class BarComponent implements AfterViewInit, OnDestroy {
  @Output() changeMode: EventEmitter<string> = new EventEmitter<string>();
  @Output() undo: EventEmitter<null> = new EventEmitter<null>();
  @Output() redo: EventEmitter<null> = new EventEmitter<null>();
  @Output() clear: EventEmitter<null> = new EventEmitter<null>();
  @Input() statusUpdate: EventEmitter<string>;

  constructor(public dialog: MatDialog, public settingsService: SettingsService) { }

  public iconColor: string[] = [];

  public ngAfterViewInit(): void {
    this.statusUpdate.subscribe((value) => {
      this.iconColor = [value];
    });
  }

  public ngOnDestroy(): void {
    this.statusUpdate.subscribe();
  }

  public openSettings(): void {
    this.dialog.open(SettingsComponent);
  }
}
