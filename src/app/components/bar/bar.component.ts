import { Component, OnDestroy, AfterViewInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ControlService } from '../../paint/control.service';
import { SettingsComponent } from '../settings/settings.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bar',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.scss']
})
export class BarComponent implements AfterViewInit, OnDestroy {
  public iconColor: string[] = [];

  constructor(public dialog: MatDialog, public controlService: ControlService, public router: Router) { }

  public ngAfterViewInit(): void {

  }

  public ngOnDestroy(): void {

  }

  public openSettings(): void {
    this.dialog.open(SettingsComponent);
  }
}
