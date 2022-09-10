export class CanvaCanvasesList extends HTMLElement {

    constructor() {
        super();

        const title = document.createElement('p');
        title.textContent = 'Your canvases';

        this.append(title);
    }
}