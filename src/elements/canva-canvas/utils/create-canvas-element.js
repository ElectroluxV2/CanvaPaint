export const createCanvasElement = id => {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('id', `layer-${id}`);
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    return canvas;
};
