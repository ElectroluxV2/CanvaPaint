export const scaleCanvas = (canvas, width, height) => {
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;

    // canvas.getContext('2d').scale(window.devicePixelRatio, window.devicePixelRatio); FIXME: Why is this working without this?
}