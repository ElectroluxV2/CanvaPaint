import { QuadraticLineMode } from './modes/quadratic-line-mode.js';
import { scaleCanvas } from './utils/scale-canvas.js';

export class CanvaCanvas extends HTMLElement {
    #selfResizeObserver;
    #foregroundContext;
    #backgroundContext;
    #drawableStore = new Map();
    #currentMode;

    constructor() {
        super();

        this.#setupCanvases();
        this.#currentMode = new QuadraticLineMode(this);

        const s = () => {
            this.#foregroundContext.clearRect(0, 0, this.#foregroundContext.canvas.width, this.#foregroundContext.canvas.height);
            this.#foregroundContext.beginPath();

            this.#foregroundContext.moveTo(0, 0);
            this.#foregroundContext.lineTo(this.#foregroundContext.canvas.width, 0);
            this.#foregroundContext.lineTo(this.#foregroundContext.canvas.width, this.#foregroundContext.canvas.height);
            this.#foregroundContext.lineTo(0, this.#foregroundContext.canvas.height);
            this.#foregroundContext.closePath();
            this.#foregroundContext.strokeStyle = 'white';
            this.#foregroundContext.stroke();
            this.#foregroundContext.beginPath();
            this.#foregroundContext.arc(Math.random() * 1500, Math.random() * 1500, 10, 0, 360);
            this.#foregroundContext.fillStyle = 'red';
            this.#foregroundContext.fill();

            this.#drawableStore.forEach(drawable => drawable.draw(this.#foregroundContext));

            requestAnimationFrame(s.bind(this));
        };

        requestAnimationFrame(s.bind(this));
    }

    #setupCanvases() {
        const canvases = new Array(2)
            .fill(0)
            .map((_, i) => {
                const canvas = document.createElement('canvas');
                canvas.setAttribute('id', `layer-${i}`);
                return canvas;
            });

        this.append(...canvases);

        const contexts = canvases.map(canvas => canvas.getContext('2d'));
        this.#foregroundContext = contexts[0];
        this.#backgroundContext = contexts[1];

        this.#selfResizeObserver = new ResizeObserver(([{ contentRect }]) => {
            canvases.forEach(canvas => scaleCanvas(canvas, contentRect.width, contentRect.height));
        });

        this.#selfResizeObserver.observe(this);
    }

    get drawableStore() {
        return this.#drawableStore;
    }
}