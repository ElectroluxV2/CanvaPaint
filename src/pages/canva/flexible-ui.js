import { CanvaToolbar } from '../../elements/canva-toolbar/canva-toolbar.js';
import { CanvaToolbarBackgroundColorPicker } from '../../elements/canva-toolbar/radio-switcher/color-picker/canva-toolbar-background-color-picker.js';
import { CanvaToolbarForegroundColorPicker } from '../../elements/canva-toolbar/radio-switcher/color-picker/canva-toolbar-foreground-color-picker.js';
import { CanvaToolbarModePicker } from '../../elements/canva-toolbar/radio-switcher/mode-picker/canva-toolbar-mode-picker.js';

CanvaToolbarModePicker.defineAsCustomElement();
CanvaToolbarForegroundColorPicker.defineAsCustomElement();
CanvaToolbarBackgroundColorPicker.defineAsCustomElement();

const toolbarContainers = document.getElementsByClassName('toolbar-container');
const [leftToolbarContainer, topToolbarContainer, rightToolbarContainer, bottomToolbarContainer] = toolbarContainers;

let i = 0;
const c = {
  0: 1,
  1: 0,
  2: 2,
};

for (const toolbarTemplate of document.querySelectorAll('template[is^=canva-toolbar]')) {
  const toolbarInstance = CanvaToolbar.fromTemplate(toolbarTemplate);

  const targetToolbarContainer = toolbarContainers[c[i++]];
  targetToolbarContainer.appendChild(toolbarInstance);

  toolbarTemplate.remove();
}
