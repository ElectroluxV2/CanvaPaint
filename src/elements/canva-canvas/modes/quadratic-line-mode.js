import { SmoothCurve } from '../drawable/smooth-curve.js';

export class QuadraticLineMode {
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

        const { offsetX, offsetY, pointerId } = event;
        const lineId = this.#getLineId(pointerId);

        this.#canvaCanvasInstance.drawableStore.set(lineId, new SmoothCurve('pink', 'lime'));
        this.#canvaCanvasInstance
            .drawableStore
            .get(lineId)
            .path
            .moveTo(offsetX * window.devicePixelRatio, offsetY * window.devicePixelRatio);
    }

    #onPointerMove(event) {
        if (!this.#isDragging) return;

        const { offsetX, offsetY, pointerId } = event;

        this.#canvaCanvasInstance
            .drawableStore
            .get(this.#getLineId(pointerId))
            .path
            .lineTo(offsetX * window.devicePixelRatio, offsetY * window.devicePixelRatio);
    }

    #onPointerUp(event) {
        this.#isDragging = false;

        const { offsetX, offsetY, pointerId } = event;

        this.#canvaCanvasInstance
            .drawableStore
            .get(this.#getLineId(pointerId))
            .path
            .lineTo(offsetX * window.devicePixelRatio, offsetY * window.devicePixelRatio);
    }

    #getLineId(pointerId) {
        return `qlm-${pointerId}`;
    }
}