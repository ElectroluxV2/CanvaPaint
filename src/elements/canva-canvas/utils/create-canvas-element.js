export const createCanvasElement = id => {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('id', `layer-${id}`);
    return canvas;
};