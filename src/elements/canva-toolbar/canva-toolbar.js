import './canva-toolbar.scss';

export class CanvaToolbar extends HTMLElement {
  #form;

  get form() {
    this.#form ??= this.getElementsByTagName('form')[0];
    return this.#form;
  }

  static fromTemplate(template) {
    const form = document.createElement('form');
    form.appendChild(template.content.cloneNode(true));

    const instance = document.createElement(template.getAttribute('is'));
    instance.classList.add('canva-toolbar');
    instance.appendChild(form);

    return instance;
  }
}
