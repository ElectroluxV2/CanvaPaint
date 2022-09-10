import { CanvaCanvasesList } from '../../elements/canva-canvases-list/canva-canvases-list.js';
import { CanvaDashboard } from '../../elements/canva-dashboard/canva-dashboard.js';
import { HelloButton } from '../../elements/hello-button.js';

customElements.define('hello-button', HelloButton, { extends: 'button' });
customElements.define('canva-canvases-list', CanvaCanvasesList);
customElements.define('canva-dashboard', CanvaDashboard);