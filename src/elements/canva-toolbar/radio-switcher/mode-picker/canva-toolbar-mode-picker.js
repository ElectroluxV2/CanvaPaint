import { ModeChangeEvent } from '../../../canva-canvas/events/mode-change-event.js';
import { RadioSwitcherBehaviour } from '../radio-switcher-behaviour.js';

export class CanvaToolbarModePicker extends RadioSwitcherBehaviour {
  static defineAsCustomElement() {
    customElements.define('canva-toolbar-mode-picker', CanvaToolbarModePicker);
  }

  emitChange(mode) {
    this.dispatchEvent(new ModeChangeEvent(mode));
  }
}
