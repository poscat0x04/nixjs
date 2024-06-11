
export type NixThunk =
  { v: () => NixValue, e: false, __12345_is_thunk: true }
  | { v: NixValue, e: true, __12345_is_thunk: true }
export type NixValue =
  bigint
  | number
  | string
  | boolean
  | null
  | NixObject[]
  | ((x: NixObject) => NixObject)
  | { [key: string]: NixObject }
export type NixObject = NixValue | NixThunk

function isThunk(o: NixObject): o is NixThunk {
  return (typeof o === "object" && o !== null && "__12345_is_thunk" in o)
}

function isAttrset(o: NixObject): o is { [key: string]: NixObject } {
  return (typeof o === "object" && o !== null && !Array.isArray(o))
}

function typeDesc(v: NixObject): string {
  if (typeof v === "bigint") {
    return "an integer"
  } else if (typeof v === "number") {
    return "a float"
  } else if (typeof v === "string") {
    return "a string"
  } else if (typeof v === "boolean") {
    return "a boolean"
  } else if (v === null) {
    return "null"
  } else if (Array.isArray(v)) {
    return "a list"
  } else if ("__12345_is_thunk" in v) {
    return "a thunk"
  } else if (typeof v === "object") {
    return "an attrset"
  } else {
    return "a function"
  }
}

export function newThunk(f: () => NixValue): NixThunk {
  return { v: f, e: false, __12345_is_thunk: true }
}

function blackHole(): NixValue {
  throw "black hole"
}

export function evaluate(t: NixObject): NixValue {
  if (isThunk(t)) {
    let tt = t
    if (!t.e) {
      let f = t.v
      t.v = blackHole
      tt.e = true
      tt.v = f()
      return t.v
    } else {
      return t.v
    }
  } else {
    return t
  }
}

function or_(a: boolean, b: boolean) {
  return a || b
}

export function or(a: NixValue, b: NixValue): boolean {
  if (typeof a === "boolean" && typeof b === "boolean") {
    return or_(a, b)
  } else if (typeof a !== "boolean") {
    throw `expected boolean, got ${typeDesc(a)}`
  } else {
    throw `expected boolean, got ${typeDesc(b)}`
  }
}

function and_(a: boolean, b: boolean) {
  return a && b
}

export function and(a: NixValue, b: NixValue): boolean {
  if (typeof a === "boolean" && typeof b === "boolean") {
    return and_(a, b)
  } else if (typeof a !== "boolean") {
    throw `expected boolean, got ${typeDesc(a)}`
  } else {
    throw `expected boolean, got ${typeDesc(b)}`
  }
}

function implies_(a: boolean, b: boolean) {
  return !a || b
}

export function implies(a: NixValue, b: NixValue): boolean {
  if (typeof a === "boolean" && typeof b === "boolean") {
    return implies_(a, b)
  } else if (typeof a !== "boolean") {
    throw `expected boolean, got ${typeDesc(a)}`
  } else {
    throw `expected boolean, got ${typeDesc(b)}`
  }
}

export type Comparable = number | bigint | string | NixObject[]
function isComparable(a: NixValue): a is Comparable {
  if (typeof a === "number"
    || typeof a === "bigint"
    || typeof a === "string"
    || Array.isArray(a)) {
    return true
  } else {
    return false
  }
}
function lessThan_(a: Comparable, b: Comparable): boolean {
  if ((typeof a === "number" || typeof a === "bigint") && (typeof b === "number" || typeof b === "bigint")
    || typeof a === "string" && typeof b === "string"
  ) {
    return a < b
  } else if (Array.isArray(a) && Array.isArray(b)) {
    // lexicographic comparison
    for (let i = 0; i < a.length; i++) {
      if (i >= b.length) {
        return false
      } else
        if (!((typeof a[i] === "number" || typeof a[i] === "bigint" || typeof a[i] === "string" || Array.isArray(a[i]))
          && (typeof b[i] === "number" || typeof b[i] === "bigint" || typeof b[i] === "string" || Array.isArray(b[i])))) {
          // internal invariant
          throw `unable to compare ${typeDesc(a[i] as NixObject)} with ${typeDesc(b[i] as NixObject)}`
          // internal invariant
        } else if (!lessThan_(a[i] as Comparable, b[i] as Comparable)) {
          return false
        }
    }
    return a.length < b.length
  } else {
    throw `unable to compare ${typeDesc(a)} with ${typeDesc(b)}`
  }
}

export function lessThan(a: NixValue, b: NixValue): boolean {
  if (isComparable(a) && isComparable(b)) {
    return lessThan_(a, b)
  } else {
    throw `unable to compare ${typeDesc(a)} with ${typeDesc(b)}`
  }
}

function lessThanEqual_(a: Comparable, b: Comparable): boolean {
  return !lessThan(b, a)
}

export function lessThanEqual(a: NixValue, b: NixValue): boolean {
  if (isComparable(a) && isComparable(b)) {
    return lessThanEqual_(a, b)
  } else {
    throw `unable to compare ${typeDesc(a)} with ${typeDesc(b)}`
  }
}

function greaterThan_(a: Comparable, b: Comparable): boolean {
  return lessThan(b, a)
}

export function greaterThan(a: NixValue, b: NixValue): boolean {
  if (isComparable(a) && isComparable(b)) {
    return greaterThan_(a, b)
  } else {
    throw `unable to compare ${typeDesc(a)} with ${typeDesc(b)}`
  }
}

function greaterThanEqual_(a: Comparable, b: Comparable): boolean {
  return !lessThan(a, b)
}

export function greaterThanEqual(a: NixValue, b: NixValue): boolean {
  if (isComparable(a) && isComparable(b)) {
    return greaterThanEqual_(a, b)
  } else {
    throw `unable to compare ${typeDesc(a)} with ${typeDesc(b)}`
  }
}

export function equals(a: NixValue, b: NixValue): boolean {
  if ((typeof a === "bigint" || typeof a === "number") && (typeof b === "bigint" || typeof b === "number")) {
    if (typeof a === "bigint" && typeof b === "bigint" || typeof a === "number" && typeof b === "number") {
      return a === b
    } else if (typeof a === "number" && typeof b === "bigint") {
      if (b > Number.MAX_SAFE_INTEGER || b < Number.MIN_SAFE_INTEGER) {
        return false
      } else {
        return a === Number(b)
      }
    } else if (typeof a === "bigint" && typeof b === "number") {
      if (a > Number.MAX_SAFE_INTEGER || a < Number.MIN_SAFE_INTEGER) {
        return false
      } else {
        return Number(a) === b
      }
    } else {
      throw "impossible"
    }
  } else if (typeof a === "string" && typeof b === "string"
    || typeof a === "boolean" && typeof b === "boolean"
    || a === null && b === null
  ) {
    return a === b
  } else if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false
    }
    for (let i = 0; i < a.length; i++) {
      // internal invariant
      if (!equals(evaluate(a[i] as NixObject), evaluate(b[i] as NixObject))) {
        return false
      }
    }
    return true
  } else if (isAttrset(a) && isAttrset(b)) {
    let keysA = Object.keys(a)
    let keysB = Object.keys(b)
    if (keysA.length !== keysB.length) {
      return false
    }
    for (let key of keysA) {
      if (!(key in b)) {
        return false
        // internal invariant
      } else if (!equals(evaluate(a[key] as NixObject), evaluate(b[key] as NixObject))) {
        return false
      }
    }
    return true
  } else {
    return false
  }
}

export function notEquals(a: NixValue, b: NixValue): boolean {
  return !equals(a, b)
}

export function update(a: NixValue, b: NixValue): { [key: string]: NixObject } {
  if (isAttrset(a) && isAttrset(b))
    return { ...a, ...b }
  else if (!isAttrset(a)) {
    throw `expected an attrset, got ${typeDesc(a)}`
  } else {
    throw `expected an attrset, got ${typeDesc(b)}`
  }
}

function concat_(a: NixObject[], b: NixObject[]): NixObject[] {
  return a.concat(b)
}

export function concat(a: NixValue, b: NixValue): NixObject[] {
  if (Array.isArray(a) && Array.isArray(b)) {
    return concat_(a, b)
  } else if (!Array.isArray(a)) {
    throw `expected a list, got ${typeDesc(a)}`
  } else {
    throw `expected a list, got ${typeDesc(b)}`
  }
}

export function add(a: NixValue, b: NixValue): NixValue {
  if (typeof a === "number" && typeof b === "number") {
    return a + b
  } if (typeof a === "bigint" && typeof b === "bigint") {
    return a + b
  } if (typeof a === "number" && typeof b === "bigint") {
    if (b > Number.MAX_SAFE_INTEGER || b < Number.MIN_SAFE_INTEGER) {
      throw "integer overflow"
    }
    return a + Number(b)
  } if (typeof a === "bigint" && typeof b === "number") {
    if (a > Number.MAX_SAFE_INTEGER || a < Number.MIN_SAFE_INTEGER) {
      throw "integer overflow"
    }
    return Number(a) + b
  } if (typeof a === "string" && typeof b === "string") {
    return a + b
  } else {
    throw `unable to add ${typeDesc(a)} and ${typeDesc(b)}`
  }
}

export function neg(a: NixValue): NixValue {
  if (typeof a === "number" || typeof a === "bigint") {
    return -a
  } else {
    throw `unable to negate ${typeDesc(a)}`
  }
}

export function sub(a: NixValue, b: NixValue): NixValue {
  return add(a, neg(b))
}

export function mul(a: NixValue, b: NixValue): NixValue {
  if (typeof a === "number" && typeof b === "number") {
    return a * b
  } else if (typeof a === "bigint" && typeof b === "bigint") {
    return a * b
  } else if (typeof a === "number" && typeof b === "bigint") {
    if (b > Number.MAX_SAFE_INTEGER || b < Number.MIN_SAFE_INTEGER) {
      throw "integer overflow"
    }
    return a * Number(b)
  } else if (typeof a === "bigint" && typeof b === "number") {
    if (a > Number.MAX_SAFE_INTEGER || a < Number.MIN_SAFE_INTEGER) {
      throw "integer overflow"
    }
    return Number(a) * b
  } else {
    throw `unable to multiply ${typeDesc(a)} and ${typeDesc(b)}`
  }
}

export function div(a: NixValue, b: NixValue): NixValue {
  if (typeof a === "number" && typeof b === "number") {
    return a / b
  } else if (typeof a === "bigint" && typeof b === "bigint") {
    return a / b
  } else if (typeof a === "number" && typeof b === "bigint") {
    if (b > Number.MAX_SAFE_INTEGER || b < Number.MIN_SAFE_INTEGER) {
      throw "integer overflow"
    }
    return a / Number(b)
  } else if (typeof a === "bigint" && typeof b === "number") {
    if (a > Number.MAX_SAFE_INTEGER || a < Number.MIN_SAFE_INTEGER) {
      throw "integer overflow"
    }
    return Number(a) / b
  } else {
    throw `unable to divide ${typeDesc(a)} with ${typeDesc(b)}`
  }
}

export function hasAttr(a: NixValue, b: string): boolean {
  if (typeof a === "object" && !Array.isArray(a) && a !== null) {
    return (b in a)
  } else {
    return false
  }
}
