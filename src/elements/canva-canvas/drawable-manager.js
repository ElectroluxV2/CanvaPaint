import { DualMap } from './utils/dual-map.js';

export class DrawableManager {
    static #drawableStore = new Map();
    static #unfinishedDrawables = new DualMap();

    static createDrawable(pointerType, pointerId, drawable) {
        this.#unfinishedDrawables.set(pointerType, pointerId, drawable);
    }

    static updateDrawable(pointerType, pointerId, callback) {
        callback(this.#unfinishedDrawables.get(pointerType, pointerId));
    }

    static finishDrawable(pointerType, pointerId, callback) {
        callback(this.#unfinishedDrawables.get(pointerType, pointerId));
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