import { ModeChangeEvent } from '../../../canva-canvas/events/mode-change-event.js';
import { RadioCheckboxBehaviour } from '../radio-checkbox-behaviour.js';

export class CanvaToolbarModePicker extends RadioCheckboxBehaviour {
  static defineAsCustomElement() {
    customElements.define('canva-toolbar-mode-picker', CanvaToolbarModePicker);
  }

  emitChange(mode) {
    this.dispatchEvent(new ModeChangeEvent(mode));
  }
}
