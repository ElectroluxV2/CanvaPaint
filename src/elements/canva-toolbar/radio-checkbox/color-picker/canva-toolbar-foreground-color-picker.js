import { ForegroundColorChangeEvent } from '../../../canva-canvas/events/foreground-color-change-event.js';
import { ColorPicker } from './color-picker.js';

export class CanvaToolbarForegroundColorPicker extends ColorPicker {
  static defineAsCustomElement() {
    customElements.define('canva-toolbar-foreground-color-picker', CanvaToolbarForegroundColorPicker);
  }

  emitChange(color) {
    this.dispatchEvent(new ForegroundColorChangeEvent(color));
  }
}
