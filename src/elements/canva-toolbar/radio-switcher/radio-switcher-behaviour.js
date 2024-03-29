import { CanvaToolbar } from '../canva-toolbar.js';

export class RadioSwitcherBehaviour extends CanvaToolbar {
  connectedCallback() {
    this.form.classList.add('radio-switcher');

    // Fire mode change event on each change
    this.form.addEventListener('change', this.#onFormChange.bind(this));

    // Fire initial value
    const initialValue = this.form.querySelector('input:checked').value;
    this.emitChange(initialValue);
  }

  #onFormChange(event) {
    const value = event.target.value;
    this.emitChange(value);
  }
}
