import { Component, OnInit } from '@angular/core';
import { SettingsService } from './settings.service';
import { Settings } from './settings.interface';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  public settings: Settings;
  constructor(public settingsService: SettingsService) {
    settingsService.settings.subscribe(value => this.settings = value);
  }

  ngOnInit(): void {
  }

  public Save(): void {
    console.log(this.settings);
    // @ts-ignore
    this.settingsService.settings = this.settings;
  }

}
