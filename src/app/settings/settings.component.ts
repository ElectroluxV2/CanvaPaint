import { Component } from '@angular/core';
import { ControlService } from './control.service';
import { Settings } from './settings.interface';

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

  public Save(): void {
    // @ts-ignore
    this.settingsService.settings = this.settings;
  }
}
