export const createStyleElement = contents => {
    const element = document.createElement('style');
    element.innerHTML = contents;
    return element;
};