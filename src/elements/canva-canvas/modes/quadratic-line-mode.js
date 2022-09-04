import { DrawableManager } from '../drawable-manager.js';
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

        const { offsetX, offsetY, pointerType, pointerId } = event;
        const line = new SmoothCurve('pink', 'lime');

        line.path.moveTo(offsetX * window.devicePixelRatio, offsetY * window.devicePixelRatio);
        DrawableManager.createDrawable(pointerType, pointerId, line);
    }

    #onPointerMove(event) {
        if (!this.#isDragging) return;

        const { offsetX, offsetY, pointerType, pointerId } = event;

        DrawableManager.updateDrawable(pointerType, pointerId,
            line => line.path.lineTo(offsetX * window.devicePixelRatio, offsetY * window.devicePixelRatio)
        );
    }

    #onPointerUp(event) {
        this.#isDragging = false;

        const { offsetX, offsetY, pointerType, pointerId } = event;

        DrawableManager.finishDrawable(pointerType, pointerId,
            line => line.path.lineTo(offsetX * window.devicePixelRatio, offsetY * window.devicePixelRatio)
        );
    }
}