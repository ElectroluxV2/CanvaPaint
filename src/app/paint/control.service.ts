import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Platform } from '@angular/cdk/platform';
import { Settings } from './settings.interface';
import { SavedCanvas, SavedCanvasService } from './saved-canvas.service';

@Injectable({
  providedIn: 'root'
})
export class ControlService {

  public readonly clear: EventEmitter<boolean> = new EventEmitter<boolean>();
  public readonly undo: EventEmitter<null> = new EventEmitter<null>();
  public readonly redo: EventEmitter<null> = new EventEmitter<null>();
  public readonly export: EventEmitter<null> = new EventEmitter<null>();
  public readonly mode: BehaviorSubject<string> = new BehaviorSubject<string>('free-line');
  public readonly savedCanvas: BehaviorSubject<SavedCanvas> = new BehaviorSubject<SavedCanvas>(null);

  private settingsData: Settings = {} as Settings;
  private readonly settingsBehaviorSubject: BehaviorSubject<Settings>;

  /**
   * First index is bright scheme second index is dark mode
   */
  private readonly colorsMap: Map<string, string> = new Map<string, string>([
    ['#f44336', '#ba2418'],
    ['#2196f3', '#176baa'],
    ['#4caf50', '#27a02b'],
    ['#ffeb3b', '#c6b515'],
    ['#212121', '#c2c1c1'],
    ['#673ab7', '#673ab7'],
  ]);

  constructor(public platform: Platform) {
    // Choose settings based on device
    this.settingsData.darkModeEnabled = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.settingsData.lazyEnabled = !platform.ANDROID && !platform.IOS;
    this.settingsData.tolerance = 1;
    this.settingsData.lazyMultiplier = 0.2 * window.devicePixelRatio;

    // Preselected options
    this.settingsData.color = this.correctColor('#212121');
    this.settingsData.width = 5;

    this.settingsBehaviorSubject = new BehaviorSubject<Settings>(this.settingsData);

    window.matchMedia('(prefers-color-scheme: dark)').onchange = (e) => {
      this.settingsData.darkModeEnabled = e.matches;
      this.settingsData.color = this.correctColor(this.settingsData.color);
      this.settingsBehaviorSubject.next(this.settingsData);
    };
  }

  // @ts-ignore
  public get settings(): BehaviorSubject<Settings> {
    return this.settingsBehaviorSubject;
  }

  // @ts-ignore
  public set settings(settings: Settings) {
    this.settingsData = settings;
    this.settingsData.color = this.correctColor(this.settingsData.color);
    this.settingsBehaviorSubject.next(this.settingsData);
  }

  public setColor(color: string): void {
    this.settingsData.color = this.correctColor(color);
    this.settingsBehaviorSubject.next(this.settingsData);
  }

  public correctColor(color: string = this.settingsData.color): string {
    // TODO: Seems to be bad idea with poor performance
    if (this.settingsData.darkModeEnabled) {
      if (this.colorsMap.has(color)) {
        return this.colorsMap.get(color);
      }

      return color; // No changes
    } else {

      if (this.colorsMap.has(color)) {
        return color; // No changes
      }

      for (const key of this.colorsMap.keys()) {
        if (this.colorsMap.get(key) === color) {
          // Return light version
          return key;
        }
      }

      // Return without changes
      return color;
    }
  }

  public emitExport(): void {
    this.export.next(null);
  }
}
