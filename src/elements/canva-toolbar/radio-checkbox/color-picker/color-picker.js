import { makeOption } from '../make-option.js';
import { RadioCheckboxBehaviour } from '../radio-checkbox-behaviour.js';

export class ColorPicker extends RadioCheckboxBehaviour {
  #name;
  #colors;

  constructor(name) {
    super();

    this.#name = name;
    this.#prepareAvailableColors();
  }

  #prepareAvailableColors() {
    // TODO: Prepare some logic for last used color restoration, and ColorMap that will adjust values to match color-scheme
    this.#colors = [
      '#001f3f',
      '#0074D9',
      '#7FDBFF',
      '#39CCCC',
      '#B10DC9',
      '#F012BE',
      '#85144b',
      '#FF4136',
      '#FF851B',
      '#FFDC00',
      '#3D9970',
      '#2ECC40',
      '#01FF70',
      '#111111',
      '#AAAAAA',
      '#DDDDDD',
      '#FFFFFF',
    ];
  }

  connectedCallback() {
    const builder = makeOption(this.#name);
    const options = this.#colors.map(color => builder('palette', color));
    const coloredOptions = options.map(option => {
      const color = option.children[1].value;
      option.style = `--icon-color: ${color}; --background-selected-color: ${color}`;

      return option;
    });

    coloredOptions[0].children[1].checked = true; // Select first color as default

    this.form.append(...coloredOptions);

    super.connectedCallback();
  }
}
