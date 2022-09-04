export class DrawableManager {
    static #drawableStore = new Map();
    static #unfinishedDrawables = new Map();

    static createDrawable(pointerType, pointerId, drawable) {
        DrawableManager.#unfinishedDrawables.set(this.#makeMapKey(pointerType, pointerId), drawable);
    }

    static updateDrawable(pointerType, pointerId, callback) {
        callback(DrawableManager.#unfinishedDrawables.get(this.#makeMapKey(pointerType, pointerId)));
    }

    static finishDrawable(pointerType, pointerId, callback) {
        callback(DrawableManager.#unfinishedDrawables.get(this.#makeMapKey(pointerType, pointerId)));
        DrawableManager.#drawableStore.set(
            performance.now(),
            DrawableManager.#unfinishedDrawables.get(this.#makeMapKey(pointerType, pointerId))
        );
        DrawableManager.#unfinishedDrawables.delete(this.#makeMapKey(pointerType, pointerId));
    }

    static #makeMapKey(pointerType, pointerId) {
        return `${pointerType}-${pointerId}`;
    }

    static get unfinishedDrawables() {
        return this.#unfinishedDrawables;
    }

    static get drawableStore() {
        return this.#drawableStore;
    }
}