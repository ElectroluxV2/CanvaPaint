import { SettingsComponent } from '../settings/settings.component';
import { Component, Output, EventEmitter, Input, OnDestroy, AfterViewInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ControlService } from '../settings/control.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-bar',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.scss']
})
export class BarComponent implements AfterViewInit, OnDestroy {
  @Input() statusUpdate: EventEmitter<string>;

  constructor(public dialog: MatDialog, public controlService: ControlService) { }

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
