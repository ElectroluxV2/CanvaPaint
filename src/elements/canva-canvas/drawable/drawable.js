export class Drawable {
    path = new Path2D();
    strokeStyle;
    fillStyle;

    constructor(strokeStyle, fillStyle) {
        this.strokeStyle = strokeStyle;
        this.fillStyle = fillStyle;
    }

    draw(context) {
        throw new Error('Not implemented!');
    }
}