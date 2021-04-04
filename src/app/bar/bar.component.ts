import { SettingsComponent } from '../settings/settings.component';
import { Component, EventEmitter, Input, OnDestroy, AfterViewInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ControlService } from '../settings/control.service';

@Component({
  selector: 'app-bar',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.scss']
})
export class BarComponent implements AfterViewInit, OnDestroy {
  @Input() statusUpdate: EventEmitter<string>;
  public iconColor: string[] = [];

  constructor(public dialog: MatDialog, public controlService: ControlService) { }

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
