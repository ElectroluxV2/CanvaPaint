import { SmoothCurve } from '../drawable/smooth-curve.js';

export class QuadraticLineMode {
    #currentId;
    #currentLine;
    #canvaCanvasInstance;
    #isDragging = false;

    constructor(canvaCanvas) {
        this.#canvaCanvasInstance = canvaCanvas;
        canvaCanvas.addEventListener('pointerdown', this.#onPointerDown.bind(this));
        canvaCanvas.addEventListener('pointermove', this.#onPointerMove.bind(this));
        canvaCanvas.addEventListener('pointerup', this.#onPointerUp.bind(this));
    }

    #onPointerDown(event) {
        this.#isDragging = true;
        const { offsetX, offsetY } = event;

        this.#currentId = `qlm-${performance.now()}`;

        this.#currentLine = new SmoothCurve('pink', 'lime');
        this.#currentLine.path.moveTo(offsetX * window.devicePixelRatio, offsetY * window.devicePixelRatio);
        this.#canvaCanvasInstance.drawableStore.set(this.#currentId, this.#currentLine);
    }

    #onPointerMove(event) {
        if (!this.#isDragging) return;

        const { offsetX, offsetY } = event;
        this.#currentLine.path.lineTo(offsetX * window.devicePixelRatio, offsetY * window.devicePixelRatio);
        this.#canvaCanvasInstance.drawableStore.set(this.#currentId, this.#currentLine);
    }


    #onPointerUp(event) {
        this.#isDragging = false;
        const { offsetX, offsetY } = event;

        this.#currentLine.path.lineTo(offsetX * window.devicePixelRatio, offsetY * window.devicePixelRatio);
        this.#canvaCanvasInstance.drawableStore.set(this.#currentId, this.#currentLine);

        console.log(this.#canvaCanvasInstance.drawableStore);
    }
}