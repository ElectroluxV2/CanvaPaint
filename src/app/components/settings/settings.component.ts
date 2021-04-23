import { Component } from '@angular/core';
import { Settings } from '../../paint/settings.interface';
import { ControlService } from '../../paint/control.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  public settings: Settings;
  constructor(public settingsService: ControlService) {
    settingsService.settings.subscribe(value => this.settings = value);
  }

  public save(): void {
    // @ts-ignore
    this.settingsService.settings = this.settings;
  }

  public export(): void {
    this.settingsService.emitExport();
  }
}
