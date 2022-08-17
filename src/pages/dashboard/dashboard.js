import { HelloButton } from '../../elements/hello-button.js';

console.log('dashboard');

customElements.define('hello-button', HelloButton, { extends: 'button' });
