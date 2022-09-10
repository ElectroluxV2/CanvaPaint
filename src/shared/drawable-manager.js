import { DualMap } from '../elements/canva-canvas/utils/dual-map.js';

export class DrawableManager {
    static #drawableStore = new Map();
    static #unfinishedDrawables = new DualMap();

    static createDrawable(pointerType, pointerId, drawable) {
        this.#unfinishedDrawables.set(pointerType, pointerId, drawable);
    }

    static updateDrawable(pointerType, pointerId, update) {
        update(this.#unfinishedDrawables.get(pointerType, pointerId));
    }

    static finishDrawable(pointerType, pointerId, finish) {
        finish(this.#unfinishedDrawables.get(pointerType, pointerId));
        // TODO: Create drawable id manager
        this.#drawableStore.set(performance.now(), this.#unfinishedDrawables.get(pointerType, pointerId));
        this.#unfinishedDrawables.delete(pointerType, pointerId);
    }

    static get unfinishedDrawables() {
        return this.#unfinishedDrawables;
    }

    static get drawableStore() {
        return this.#drawableStore;
    }
}