import { DrawableManager } from '../../shared/drawable-manager.js';
import './canva-canvas.scss';
import { BackgroundColorChangeEvent } from './events/background-color-change-event.js';
import { ForegroundColorChangeEvent } from './events/foreground-color-change-event.js';
import { ModeChangeEvent } from './events/mode-change-event.js';
import { QuadraticLineMode } from './modes/quadratic-line-mode.js';
import { createCanvasElement } from './utils/create-canvas-element.js';
import { scaleCanvas } from './utils/scale-canvas.js';

export class CanvaCanvas extends HTMLElement {
  #selfResizeObserver;
  #foregroundContext;
  #backgroundContext;
  #currentMode;
  currentOptions = {};

  constructor() {
    super();

    this.#setupCanvases();

    const s = () => {
      this.#foregroundContext.clearRect(0, 0, this.#foregroundContext.canvas.width, this.#foregroundContext.canvas.height);
      this.#backgroundContext.clearRect(0, 0, this.#backgroundContext.canvas.width, this.#backgroundContext.canvas.height);
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

      DrawableManager.unfinishedDrawables.forEach(drawable => drawable.draw(this.#foregroundContext));
      DrawableManager.drawableStore.forEach(drawable => drawable.draw(this.#backgroundContext));

      requestAnimationFrame(s.bind(this));
    };

    requestAnimationFrame(s.bind(this));

    document.addEventListener(ModeChangeEvent.type, this.#onModeChange.bind(this));
    document.addEventListener(ForegroundColorChangeEvent.type, ({ color }) => this.currentOptions.foregroundColor = color);
    document.addEventListener(BackgroundColorChangeEvent.type, ({ color }) => this.currentOptions.backgroundColor = color);
  }

  #setupCanvases() {
    const canvases = new Array(2)
        .fill(0)
        .map((_, i) => createCanvasElement(i));

    this.append(...canvases);

    const contexts = canvases.map(canvas => canvas.getContext('2d'));
    this.#backgroundContext = contexts[0];
    this.#foregroundContext = contexts[1];

    this.#selfResizeObserver = new ResizeObserver(([{ contentRect }]) =>
        canvases.forEach(canvas => scaleCanvas(canvas, contentRect.width, contentRect.height)));

    this.#selfResizeObserver.observe(this);
  }

  #onModeChange({ mode }) {
    switch (mode) {
      case 'smooth':
        this.#currentMode = new QuadraticLineMode(this);
        break;
      default:
        console.warn('Unknown mode', mode);
    }
  }
}
