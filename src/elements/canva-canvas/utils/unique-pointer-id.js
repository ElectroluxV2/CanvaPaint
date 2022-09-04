export class UniquePointerId {
    static #lastPointerId;

    static makeUniquePointerId(pointerId, pointerType) {
        console.log(pointerId, this.#lastPointerId);

        this.#lastPointerId ??= pointerId;

        console.log(this.#lastPointerId);

        return this.#lastPointerId - 1 === pointerId ? ++this.#lastPointerId : pointerId;
    }
}