import { CanvaCanvas } from '../../elements/canva-canvas/canva-canvas.js';
import { CanvaNav } from '../../elements/canva-nav/canva-nav.js';
import { CanvaToolbar } from '../../elements/canva-toolbar/canva-toolbar.js';

customElements.define('canva-canvas', CanvaCanvas);
customElements.define('canva-nav', CanvaNav);
customElements.define('canva-toolbar', CanvaToolbar);

let dragSrcEl;

function handleDragStart(e) {
  this.style.opacity = '0.4';

  dragSrcEl = this;

  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.innerHTML);
}

function handleDragEnd(e) {
  this.style.opacity = '1';

  toolbars.forEach(function (item) {
    item.classList.remove('over');
  });
}

function handleDragOver(e) {
  e.preventDefault();
  return false;
}

function handleDragEnter(e) {
  this.classList.add('over');
}

function handleDragLeave(e) {
  this.classList.remove('over');
}

function handleDrop(e) {
  e.stopPropagation(); // stops the browser from redirecting.

  if (dragSrcEl !== this) {
    dragSrcEl.innerHTML = this.innerHTML;
    this.innerHTML = e.dataTransfer.getData('text/plain');
  }

  return false;
}

const toolbars = document.querySelectorAll('canva-toolbar');

toolbars.forEach(toolbar => {
  toolbar.addEventListener('dragstart', handleDragStart);
  toolbar.addEventListener('dragover', handleDragOver);
  toolbar.addEventListener('dragenter', handleDragEnter);
  toolbar.addEventListener('dragleave', handleDragLeave);
  toolbar.addEventListener('dragend', handleDragEnd);
  toolbar.addEventListener('drop', handleDrop);
});
