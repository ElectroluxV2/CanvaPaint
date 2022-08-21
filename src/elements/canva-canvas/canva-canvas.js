export class CanvaCanvas extends HTMLElement {
    #selfResizeObserver;
    #foregroundContext;
    #backgroundContext;

    constructor() {
        super();

        this.#setupCanvases();

        const s = () => {
            this.#foregroundContext.clearRect(0, 0, this.#foregroundContext.height, this.#foregroundContext.width);

            this.#foregroundContext.moveTo(0, 0);
            this.#foregroundContext.lineTo(this.#foregroundContext.canvas.width, 0);
            this.#foregroundContext.lineTo(this.#foregroundContext.canvas.width, this.#foregroundContext.canvas.height);
            this.#foregroundContext.lineTo(0, this.#foregroundContext.canvas.height);
            this.#foregroundContext.closePath();
            this.#foregroundContext.strokeStyle = 'white';
            this.#foregroundContext.stroke();

            requestAnimationFrame(s.bind(this));
        };

        requestAnimationFrame(s.bind(this));
    }

    static #scaleCanvas(canvas, width, height) {
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;

        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        // canvas.getContext('2d').scale(window.devicePixelRatio, window.devicePixelRatio); FIXME: Why is this working without this?
    }

    #setupCanvases() {
        const foregroundCanvas = document.createElement('canvas');
        const backgroundCanvas = document.createElement('canvas');

        this.append(backgroundCanvas, foregroundCanvas);

        this.#foregroundContext = foregroundCanvas.getContext('2d');
        this.#backgroundContext = backgroundCanvas.getContext('2d');

        this.#selfResizeObserver = new ResizeObserver(([self]) => {
            const { contentRect } = self;
            const canvases = Array.from(this.getElementsByTagName('canvas')); // TODO: Make polyfill for forEach for HTMLCollection

            canvases.forEach(canvas => CanvaCanvas.#scaleCanvas(canvas, contentRect.width, contentRect.height));
        });

        this.#selfResizeObserver.observe(this);
    }
}