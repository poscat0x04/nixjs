function isThunk(o) {
    return (typeof o === "object" && o !== null && "__12345_is_thunk" in o);
}
function isAttrset(o) {
    return (typeof o === "object" && o !== null && !Array.isArray(o) && "__12345_is_thunk" in o);
}
function typeDesc(v) {
    if (typeof v === "bigint") {
        return "an integer";
    }
    else if (typeof v === "number") {
        return "a float";
    }
    else if (typeof v === "string") {
        return "a string";
    }
    else if (typeof v === "boolean") {
        return "a boolean";
    }
    else if (v === null) {
        return "null";
    }
    else if (Array.isArray(v)) {
        return "a list";
    }
    else if ("__12345_is_thunk" in v) {
        return "a thunk";
    }
    else if (typeof v === "object") {
        return "an attrset";
    }
    else {
        return "a function";
    }
}
export function newThunk(f) {
    return { v: f, e: false, __12345_is_thunk: true };
}
function blackHole() {
    throw "black hole";
}
export function evaluate(t) {
    if (isThunk(t)) {
        let tt = t;
        if (!t.e) {
            let f = t.v;
            t.v = blackHole;
            tt.e = true;
            tt.v = f();
            return t.v;
        }
        else {
            return t.v;
        }
    }
    else {
        return t;
    }
}
function or_(a, b) {
    return a || b;
}
export function or(a, b) {
    if (typeof a === "boolean" && typeof b === "boolean") {
        return or_(a, b);
    }
    else if (typeof a !== "boolean") {
        throw `expected boolean, got ${typeDesc(a)}`;
    }
    else {
        throw `expected boolean, got ${typeDesc(b)}`;
    }
}
function and_(a, b) {
    return a && b;
}
export function and(a, b) {
    if (typeof a === "boolean" && typeof b === "boolean") {
        return and_(a, b);
    }
    else if (typeof a !== "boolean") {
        throw `expected boolean, got ${typeDesc(a)}`;
    }
    else {
        throw `expected boolean, got ${typeDesc(b)}`;
    }
}
function implies_(a, b) {
    return !a || b;
}
export function implies(a, b) {
    if (typeof a === "boolean" && typeof b === "boolean") {
        return implies_(a, b);
    }
    else if (typeof a !== "boolean") {
        throw `expected boolean, got ${typeDesc(a)}`;
    }
    else {
        throw `expected boolean, got ${typeDesc(b)}`;
    }
}
function isComparable(a) {
    if (typeof a === "number"
        || typeof a === "bigint"
        || typeof a === "string"
        || Array.isArray(a)) {
        return true;
    }
    else {
        return false;
    }
}
function lessThan_(a, b) {
    if ((typeof a === "number" || typeof a === "bigint") && (typeof b === "number" || typeof b === "bigint")
        || typeof a === "string" && typeof b === "string") {
        return a < b;
    }
    else if (Array.isArray(a) && Array.isArray(b)) {
        for (let i = 0; i < a.length; i++) {
            if (i >= b.length) {
                return false;
            }
            else if (!((typeof a[i] === "number" || typeof a[i] === "bigint" || typeof a[i] === "string" || Array.isArray(a[i]))
                && (typeof b[i] === "number" || typeof b[i] === "bigint" || typeof b[i] === "string" || Array.isArray(b[i])))) {
                throw `unable to compare ${typeDesc(a[i])} with ${typeDesc(b[i])}`;
            }
            else if (!lessThan_(a[i], b[i])) {
                return false;
            }
        }
        return a.length < b.length;
    }
    else {
        throw `unable to compare ${typeDesc(a)} with ${typeDesc(b)}`;
    }
}
export function lessThan(a, b) {
    if (isComparable(a) && isComparable(b)) {
        return lessThan_(a, b);
    }
    else {
        throw `unable to compare ${typeDesc(a)} with ${typeDesc(b)}`;
    }
}
function lessThanEqual_(a, b) {
    return !lessThan(b, a);
}
export function lessThanEqual(a, b) {
    if (isComparable(a) && isComparable(b)) {
        return lessThanEqual_(a, b);
    }
    else {
        throw `unable to compare ${typeDesc(a)} with ${typeDesc(b)}`;
    }
}
function greaterThan_(a, b) {
    return lessThan(b, a);
}
export function greaterThan(a, b) {
    if (isComparable(a) && isComparable(b)) {
        return greaterThan_(a, b);
    }
    else {
        throw `unable to compare ${typeDesc(a)} with ${typeDesc(b)}`;
    }
}
export function greaterThanEqual(a, b) {
    return !lessThan(a, b);
}
export function equals(a, b) {
    if ((typeof a === "bigint" || typeof a === "number") && (typeof b === "bigint" || typeof b === "number")) {
        if (typeof a === "bigint" && typeof b === "bigint" || typeof a === "number" && typeof b === "number") {
            return a === b;
        }
        else if (typeof a === "number" && typeof b === "bigint") {
            if (b > Number.MAX_SAFE_INTEGER || b < Number.MIN_SAFE_INTEGER) {
                return false;
            }
            else {
                return a === Number(b);
            }
        }
        else if (typeof a === "bigint" && typeof b === "number") {
            if (a > Number.MAX_SAFE_INTEGER || a < Number.MIN_SAFE_INTEGER) {
                return false;
            }
            else {
                return Number(a) === b;
            }
        }
        else {
            throw "impossible";
        }
    }
    else if (typeof a === "string" && typeof b === "string"
        || typeof a === "boolean" && typeof b === "boolean"
        || a === null && b === null) {
        return a === b;
    }
    else if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (!equals(evaluate(a[i]), evaluate(b[i]))) {
                return false;
            }
        }
        return true;
    }
    else if (typeof a === "object" && typeof b === "object") {
        a = a;
        b = b;
        let keysA = Object.keys(a);
        let keysB = Object.keys(b);
        if (keysA.length !== keysB.length) {
            return false;
        }
        for (let key of keysA) {
            if (!(key in b)) {
                return false;
            }
            else if (!equals(evaluate(a[key]), evaluate(b[key]))) {
                return false;
            }
        }
        return true;
    }
    else {
        return false;
    }
}
export function notEquals(a, b) {
    return !equals(a, b);
}
export function update(a, b) {
    if (typeof a !== "object" || Array.isArray(a) || a === null) {
        throw `expected an attrset, got ${typeDesc(a)}`;
    }
    else if (typeof b !== "object" || Array.isArray(b) || b === null) {
        throw `expected an attrset, got ${typeDesc(b)}`;
    }
    else {
        let aa = a;
        let bb = b;
        return { ...aa, ...bb };
    }
}
export function concat(a, b) {
    return a.concat(b);
}
export function add(a, b) {
    if (typeof a === "number" && typeof b === "number") {
        return a + b;
    }
    if (typeof a === "bigint" && typeof b === "bigint") {
        return a + b;
    }
    if (typeof a === "number" && typeof b === "bigint") {
        if (b > Number.MAX_SAFE_INTEGER || b < Number.MIN_SAFE_INTEGER) {
            throw "integer overflow";
        }
        return a + Number(b);
    }
    if (typeof a === "bigint" && typeof b === "number") {
        if (a > Number.MAX_SAFE_INTEGER || a < Number.MIN_SAFE_INTEGER) {
            throw "integer overflow";
        }
        return Number(a) + b;
    }
    if (typeof a === "string" && typeof b === "string") {
        return a + b;
    }
    else {
        throw `unable to add ${typeDesc(a)} and ${typeDesc(b)}`;
    }
}
export function neg(a) {
    if (typeof a === "number" || typeof a === "bigint") {
        return -a;
    }
    else {
        throw `unable to negate ${typeDesc(a)}`;
    }
}
export function sub(a, b) {
    return add(a, neg(b));
}
export function mul(a, b) {
    if (typeof a === "number" && typeof b === "number") {
        return a * b;
    }
    else if (typeof a === "bigint" && typeof b === "bigint") {
        return a * b;
    }
    else if (typeof a === "number" && typeof b === "bigint") {
        if (b > Number.MAX_SAFE_INTEGER || b < Number.MIN_SAFE_INTEGER) {
            throw "integer overflow";
        }
        return a * Number(b);
    }
    else if (typeof a === "bigint" && typeof b === "number") {
        if (a > Number.MAX_SAFE_INTEGER || a < Number.MIN_SAFE_INTEGER) {
            throw "integer overflow";
        }
        return Number(a) * b;
    }
    else {
        throw `unable to multiply ${typeDesc(a)} and ${typeDesc(b)}`;
    }
}
export function div(a, b) {
    if (typeof a === "number" && typeof b === "number") {
        return a / b;
    }
    else if (typeof a === "bigint" && typeof b === "bigint") {
        return a / b;
    }
    else if (typeof a === "number" && typeof b === "bigint") {
        if (b > Number.MAX_SAFE_INTEGER || b < Number.MIN_SAFE_INTEGER) {
            throw "integer overflow";
        }
        return a / Number(b);
    }
    else if (typeof a === "bigint" && typeof b === "number") {
        if (a > Number.MAX_SAFE_INTEGER || a < Number.MIN_SAFE_INTEGER) {
            throw "integer overflow";
        }
        return Number(a) / b;
    }
    else {
        throw `unable to divide ${typeDesc(a)} with ${typeDesc(b)}`;
    }
}
export function hasAttr(a, b) {
    if (typeof a === "object" && !Array.isArray(a) && a !== null) {
        return (b in a);
    }
    else {
        return false;
    }
}
//# sourceMappingURL=runtime.mjs.map