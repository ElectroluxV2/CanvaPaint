import { Drawable } from './drawable.js';

export class SmoothCurve extends Drawable {
    lineWidth;

    constructor(strokeStyle, fillStyle, lineWidth = 5) {
        super(strokeStyle, fillStyle);
        this.lineWidth = lineWidth;
    }

    draw(context) {
        context.lineWidth = this.lineWidth;
        context.fillStyle = this.fillStyle;
        context.strokeStyle = this.strokeStyle;

        this.fillStyle && context.fill(this.path);
        this.strokeStyle && context.stroke(this.path);
    }
}