import { CanvaModePickerToolbar } from '../../elements/canva-toolbar/canva-mode-picker/canva-mode-picker-toolbar.js';
import { CanvaToolbar } from '../../elements/canva-toolbar/canva-toolbar.js';

CanvaModePickerToolbar.defineAsCustomElement();

const toolbarContainers = document.getElementsByClassName('toolbar-container');
const [leftToolbarContainer, topToolbarContainer, rightToolbarContainer, bottomToolbarContainer] = toolbarContainers;

for (const toolbarTemplate of document.querySelectorAll('template[is^=canva-toolbar]')) {
  const toolbarInstance = CanvaToolbar.fromTemplate(toolbarTemplate);

  topToolbarContainer.appendChild(toolbarInstance);

  toolbarTemplate.remove();
}
