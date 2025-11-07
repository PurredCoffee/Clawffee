const skipConsole = require('./ConsoleOverrides');

globalThis.Map = class MapVerbose extends Map {
    constructor(...args) {
        super(...args);
    }

    set(key, value) {
        if(this.has(key)) {
            skipConsole.debug(1,`Overriding Map key "${key}" from value "${this.get(key)}" to "${value}"`);
        } else {
            skipConsole.debug(1,`Setting Map key "${key}" to value "${value}"`);
            skipConsole.debug(1,"map size is now", this.size + 1);
        }
        return super.set(key, value);
    }

    delete(key) {
        if(this.has(key)) {
            skipConsole.debug(1,`Deleting Map key "${key}" with value "${this.get(key)}"`);
            skipConsole.debug(1,"map size is now", this.size - 1);
        } else {
            skipConsole.debug(1,`Attempted to delete non-existent Map key "${key}"`);
        }
        return super.delete(key);
    }

    clear() {
        skipConsole.debug(1,`Clearing Map with ${this.size} entries`);
        return super.clear();
    }
}

globalThis.Set = class SetVerbose extends Set {
    constructor(...args) {
        super(...args);
    }

    add(value) {
        if(this.has(value)) {
            skipConsole.debug(1,`Set already has value "${value}"`);
        } else {
            skipConsole.debug(1,`Adding value "${value}" to Set`);
            skipConsole.debug(1,"set size is now", this.size + 1);
        }
        return super.add(value);
    }

    delete(value) {
        if(this.has(value)) {
            skipConsole.debug(1,`Deleting value "${value}" from Set`);
            skipConsole.debug(1,"set size is now", this.size - 1);
        } else {
            skipConsole.debug(1,`Attempted to delete non-existent value "${value}" from Set`);
        }
        return super.delete(value);
    }

    clear() {
        skipConsole.debug(1,`Clearing Set with ${this.size} entries`);
        return super.clear();
    }
}

globalThis.Array = class ArrayVerbose extends Array {
    constructor(...args) {
        super(...args);
    }
    
    push(...items) {
        skipConsole.debug(1,`Pushing ${items.length} item(s) to Array`);
        skipConsole.debug(1,"array size is now", this.length + items.length);
        return super.push(...items);
    }
    
    pop() {
        if(this.length === 0) {
            skipConsole.debug(1,`Attempted to pop from empty Array`);
            return undefined;
        }
        skipConsole.debug(1,`Popping item from Array`);
        skipConsole.debug(1,"array size is now", this.length - 1);
        return super.pop();
    }
    
    splice(start, deleteCount, ...items) {
        skipConsole.debug(1,`Splicing Array at index ${start}, deleting ${deleteCount} item(s), adding ${items.length} item(s)`);
        skipConsole.debug(1,"array size is now", this.length - deleteCount + items.length);
        return super.splice(start, deleteCount, ...items);
    }
}