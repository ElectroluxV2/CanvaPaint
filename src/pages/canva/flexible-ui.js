import { CanvaToolbarModePicker } from '../../elements/canva-toolbar/canva-mode-picker/canva-toolbar-mode-picker.js';
import { CanvaToolbar } from '../../elements/canva-toolbar/canva-toolbar.js';

CanvaToolbarModePicker.defineAsCustomElement();

const toolbarContainers = document.getElementsByClassName('toolbar-container');
const [leftToolbarContainer, topToolbarContainer, rightToolbarContainer, bottomToolbarContainer] = toolbarContainers;

let i = 0;
const c = {
  0: 1,
  1: 0.,
};
for (const toolbarTemplate of document.querySelectorAll('template[is^=canva-toolbar]')) {
  const toolbarInstance = CanvaToolbar.fromTemplate(toolbarTemplate);

  const targetToolbarContainer = toolbarContainers[c[i++]];
  targetToolbarContainer.appendChild(toolbarInstance);

  toolbarTemplate.remove();
}
