import { CanvaToolbar } from '../canva-toolbar.js';

export class CanvaModePickerToolbar extends CanvaToolbar {
  static defineAsCustomElement() {
    customElements.define('canva-toolbar-mode-picker', CanvaModePickerToolbar);
  }

  connectedCallback() {
    console.log('Mode picker');
  }
}
