export class DualMap extends Map {
    set(key1, key2, value) {
        return super.set(this.#combineKeys(key1, key2), value);
    }

    get(key1, key2) {
        return super.get(this.#combineKeys(key1, key2));
    }

    delete(key1, key2) {
        return super.delete(this.#combineKeys(key1, key2));
    }

    #combineKeys(key1, key2) {
        return `${key1}-${key2}`;
    }
}