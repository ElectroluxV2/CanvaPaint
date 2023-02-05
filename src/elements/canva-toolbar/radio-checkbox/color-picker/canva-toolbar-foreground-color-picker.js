import { ColorPicker } from './color-picker.js';

export class CanvaToolbarForegroundColorPicker extends ColorPicker {
  static defineAsCustomElement() {
    customElements.define('canva-toolbar-foreground-color-picker', CanvaToolbarForegroundColorPicker);
  }

  emitChange(color) {
    console.log(color);
  }
}
