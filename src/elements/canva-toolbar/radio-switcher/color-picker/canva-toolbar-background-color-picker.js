import { BackgroundColorChangeEvent } from '../../../canva-canvas/events/background-color-change-event.js';
import { ColorPicker } from './color-picker.js';

export class CanvaToolbarBackgroundColorPicker extends ColorPicker {
  static defineAsCustomElement() {
    customElements.define('canva-toolbar-background-color-picker', CanvaToolbarBackgroundColorPicker);
  }

  emitChange(color) {
    this.dispatchEvent(new BackgroundColorChangeEvent(color));
  }
}
