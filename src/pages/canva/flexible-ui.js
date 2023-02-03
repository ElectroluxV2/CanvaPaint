import { CanvaModePickerToolbar } from '../../elements/canva-toolbar/canva-mode-picker/canva-mode-picker-toolbar.js';
import { CanvaToolbar } from '../../elements/canva-toolbar/canva-toolbar.js';

CanvaModePickerToolbar.defineAsCustomElement();

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
