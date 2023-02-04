import { ModeChangeEvent } from '../../canva-canvas/events/mode-change-event.js';
import { CanvaToolbar } from '../canva-toolbar.js';

export class CanvaToolbarModePicker extends CanvaToolbar {
  static defineAsCustomElement() {
    customElements.define('canva-toolbar-mode-picker', CanvaToolbarModePicker);
  }

  connectedCallback() {
    this.form.classList.add('content-switcher');

    // Fire mode change event on each change
    this.form.addEventListener('change', this.onFormChange.bind(this));

    // Fire initial value
    const initialValue = this.form.querySelector('input:checked').value;
    this.emitModeChange(initialValue);
  }

  onFormChange(event) {
    const value = event.target.value;
    this.emitModeChange(value);
  }

  emitModeChange(mode) {
    this.dispatchEvent(new ModeChangeEvent(mode));
  }
}
