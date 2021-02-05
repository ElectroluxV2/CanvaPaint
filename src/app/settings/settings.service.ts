import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Settings } from './settings.interface';
import {Platform} from '@angular/cdk/platform';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private settingsData: Settings = {} as Settings;
  private readonly settingsBehaviorSubject: BehaviorSubject<Settings>;

  // @ts-ignore
  public get settings(): BehaviorSubject<Settings> {
    return this.settingsBehaviorSubject;
  }

  // @ts-ignore
  public set settings(settings: Settings) {
    this.settingsData = settings;
    console.log(settings.lazyMultiplier);
    this.settingsBehaviorSubject.next(this.settingsData);
  }

  private readonly colors = {
    light: {
      red: '#f44336',
      blue: '#2196f3',
      green: '#4caf50',
      yellow: '#ffeb3b',
      black: '#212121',
      internal: '#673ab7'
    },
    dark: {
      red: '#ba2418',
      blue: '#176baa',
      green: '#27a02b',
      yellow: '#c6b515',
      black: '#c2c1c1',
      internal: '#673ab7'
    }
  };

  public GetColorKey(value: string): string {
    for (const index in this.colors) {
      if (!this.colors.hasOwnProperty(index)) {
        continue;
      }
      for (const key in this.colors[index]) {
        if (!this.colors[index].hasOwnProperty(key)) {
          continue;
        }

        if (value === this.colors[index][key]) {
          return key;
        }
      }
    }
  }

  private GetColor(key: string): string {
    const index = this.settingsData.darkModeEnabled ? 'dark' : 'light';
    return this.colors[index][key];
  }

  constructor(public platform: Platform) {
    // Choose settings based on device
    this.settingsData.darkModeEnabled = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.settingsData.lazyEnabled = !platform.ANDROID && !platform.IOS;
    this.settingsData.tolerance = !platform.ANDROID && !platform.IOS ? 3 : 1;
    this.settingsData.lazyMultiplier = 0.2 * window.devicePixelRatio;

    // Preselected options
    this.settingsData.color = this.GetColor('black');
    this.settingsData.width = 5;

    this.settingsBehaviorSubject = new BehaviorSubject<Settings>(this.settingsData);

    window.matchMedia('(prefers-color-scheme: dark)').onchange = (e) => {
      this.settingsData.darkModeEnabled = e.matches;
      this.settingsData.color = this.GetColor(this.GetColorKey(this.settingsData.color));
      this.settingsBehaviorSubject.next(this.settingsData);
    };
  }

  public SetColorByName(value: any): void {
    this.settingsData.color = this.GetColor(value);
    this.settingsBehaviorSubject.next(this.settingsData);
  }
}
