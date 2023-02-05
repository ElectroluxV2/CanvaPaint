import { makeOption } from '../make-option.js';
import { RadioSwitcherBehaviour } from '../radio-switcher-behaviour.js';

export class ColorPicker extends RadioSwitcherBehaviour {
  #name;
  #colors;

  constructor(name) {
    super();

    this.#name = name;
    this.#prepareAvailableColors();
  }

  #prepareAvailableColors() {
    // TODO: Prepare some logic for last used color restoration, and ColorMap that will adjust values to match color-scheme
    // keys are drawable colors and values are icon colors
    this.#colors = {
      '#001f3f': '#80bfff',
      '#0074D9': '#b3dbff',
      '#7FDBFF': '#004966',
      '#39CCCC': '#000000',
      '#B10DC9': '#efa9f9',
      '#F012BE': '#65064f',
      '#85144b': '#eb7ab1',
      '#FF4136': '#800600',
      '#FF851B': '#663000',
      '#FFDC00': '#665800',
      '#3D9970': '#163728',
      '#2ECC40': '#0e3e14',
      '#01FF70': '#00662c',
      '#111111': '#ffffff',
      '#AAAAAA': '#000000',
      '#DDDDDD': '#000000',
      '#FFFFFF': '#000000',
    };
  }

  connectedCallback() {
    const builder = makeOption(this.#name);
    const options = Object.keys(this.#colors).map(color => builder('palette', color));

    const coloredOptions = options.map(option => {
      const realColor = option.children[1].value;
      const contrastingColor = this.#colors[realColor];
      option.style = `--icon-selected-color: ${contrastingColor}; --icon-color: ${realColor}; --background-selected-color: ${realColor}; --background-color: ${realColor}`;

      return option;
    });

    coloredOptions[1].children[1].checked = true; // Select second color as default, TODO: selection restoration

    const transparentOption = builder('visibility_off', 'transparent');
    transparentOption.style = '';

    this.form.append(transparentOption, ...coloredOptions);

    super.connectedCallback();
  }
}
