
export type nixThunk =
  { v: () => nixValue, e: false, __12345_is_thunk: true }
  | { v: nixValue, e: true, __12345_is_thunk: true }
export type nixValue =
  BigInt
  | Number
  | string
  | Boolean
  | null
  | nixObject[]
  | ((x: nixObject) => nixObject)
  | { [key: string]: nixObject }
export type nixObject = nixValue | nixThunk

function typeDesc(v: nixObject): string {
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

export function newThunk(f: () => nixValue): nixThunk {
  return { v: f, e: false, __12345_is_thunk: true }
}

function blackHole(): nixValue {
  throw "black hole"
}

export function evaluate(t: nixObject): nixValue {
  if (typeof t === "object" && (t === null || !("__12345_is_thunk" in t))
    || typeof t === "bigint"
    || typeof t === "number"
    || typeof t === "string"
    || typeof t === "boolean"
    || typeof t === "function"
  ) {
    return t
  } else if ("__12345_is_thunk" in t) {
    let tt = t as nixThunk
    if (!tt.e) {
      let f = tt.v
      tt.v = blackHole
      t.e = true
      t.v = f()
      return t.v
    } else {
      return tt.v
    }
  } else {
    throw "impossible"
  }
}

export function or(a: Boolean, b: Boolean) {
  return a || b
}

export function and(a: Boolean, b: Boolean) {
  return a && b
}

export function implies(a: Boolean, b: Boolean) {
  return !a || b
}

export type Comparable = Number | BigInt | string | nixObject[]
export function lessThan(a: Comparable, b: Comparable): Boolean {
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
          throw `unable to compare ${typeDesc(a[i] as nixObject)} with ${typeDesc(b[i] as nixObject)}`
        } else if (!lessThan(a[i] as Comparable, b[i] as Comparable)) {
          return false
        }
    }
    return a.length < b.length
  } else {
    throw `unable to compare ${typeDesc(a)} with ${typeDesc(b)}`
  }
}

export function lessThanEqual(a: Comparable, b: Comparable): Boolean {
  return !lessThan(b, a)
}

export function greaterThan(a: Comparable, b: Comparable): Boolean {
  return lessThan(b, a)
}

export function greaterThanEqual(a: Comparable, b: Comparable): Boolean {
  return !lessThan(a, b)
}

export function equals(a: nixValue, b: nixValue): Boolean {
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
      if (a > BigInt(Number.MAX_SAFE_INTEGER) || a < BigInt(Number.MIN_SAFE_INTEGER)) {
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
      if (!equals(evaluate(a[i] as nixObject), evaluate(b[i] as nixObject))) {
        return false
      }
    }
    return true
  } else if (typeof a === "object" && typeof b === "object") {
    if (a === null || b === null) {
      return a === b
    }
    a = a as { [key: string]: nixObject }
    b = b as { [key: string]: nixObject }
    let keysA = Object.keys(a)
    let keysB = Object.keys(b)
    if (keysA.length !== keysB.length) {
      return false
    }
    for (let key of keysA) {
      if (!(key in b)) {
        return false
      } else if (!equals(evaluate(a[key] as nixObject), evaluate(b[key] as nixObject))) {
        return false
      }
    }
    return true
  } else {
    return false
  }
}

export function notEquals(a: nixValue, b: nixValue): Boolean {
  return !equals(a, b)
}

export function update(a: nixValue, b: nixValue): { [key: string]: nixObject } {
  if (typeof a !== "object" || Array.isArray(a) || a === null) {
    throw `expected an attrset, got ${typeDesc(a)}`
  } else if (typeof b !== "object" || Array.isArray(b) || b === null) {
    throw `expected an attrset, got ${typeDesc(b)}`
  } else {
    let aa = a as { [key: string]: nixObject }
    let bb = b as { [key: string]: nixObject }
    return { ...aa, ...bb }
  }
}

export function concat(a: nixObject[], b: nixObject[]): nixObject[] {
  return a.concat(b)
}

export function add(a: nixValue, b: nixValue): nixValue {
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
    if (a > BigInt(Number.MAX_SAFE_INTEGER) || a < BigInt(Number.MIN_SAFE_INTEGER)) {
      throw "integer overflow"
    }
    return Number(a) + b
  } if (typeof a === "string" && typeof b === "string") {
    return a + b
  } else {
    throw `unable to add ${typeDesc(a)} and ${typeDesc(b)}`
  }
}

export function neg(a: nixValue): nixValue {
  if (typeof a === "number" || typeof a === "bigint") {
    return -a
  } else {
    throw `unable to negate ${typeDesc(a)}`
  }
}

export function sub(a: nixValue, b: nixValue): nixValue {
  return add(a, neg(b))
}

export function mul(a: nixValue, b: nixValue): nixValue {
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
    if (a > BigInt(Number.MAX_SAFE_INTEGER) || a < BigInt(Number.MIN_SAFE_INTEGER)) {
      throw "integer overflow"
    }
    return Number(a) * b
  } else {
    throw `unable to multiply ${typeDesc(a)} and ${typeDesc(b)}`
  }
}

export function div(a: nixValue, b: nixValue): nixValue {
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
    if (a > BigInt(Number.MAX_SAFE_INTEGER) || a < BigInt(Number.MIN_SAFE_INTEGER)) {
      throw "integer overflow"
    }
    return Number(a) / b
  } else {
    throw `unable to divide ${typeDesc(a)} with ${typeDesc(b)}`
  }
}

export function hasAttr(a: nixValue, b: string): Boolean {
  if (typeof a === "object" && !Array.isArray(a) && a !== null) {
    return (b in a)
  } else {
    return false
  }
}
