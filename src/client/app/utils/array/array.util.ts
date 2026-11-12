export function safeArrayIndex<T>(arr: T[], i: number): T {
  const arrSize: number = arr.length;
  // Not checking for arr.at(i) for undefined, since actual array values could be set to undefined
  if (arrSize > i && i >= -arrSize) {
    return arr.at(i) as T;
  }
  throw new Error(
    `Array index ${i} is out of bounds in array of size ${arrSize}`,
  );
}

/** @ref https://stackoverflow.com/a/3895478#10050831 */
export function range(
  size: number,
  startAt: number = 0,
): ReadonlyArray<number> {
  return [...Array(size).keys()].map((i: number): number => i + startAt);
}

/**
 * if arr=[1,2,2,3], the return=[1,2,3]
 * @returns array with no duplicate elements
 */
export function arrayUnique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export type ArrayComparatorBool<T> = (valA: T, valB: T) => boolean;
export type ArrayComparatorNum<T> = (valA: T, valB: T) => number;

/** @returns true if value is in the array, based on the comparator function */
export function arrayIncludes<T>(
  arr: T[],
  val: T,
  comparator: ArrayComparatorBool<T>,
): boolean {
  return arr.some((v: T): boolean => comparator(val, v));
}

/** If arrA=[1,3,4,5] and arrB=[1,2,5] then return=[1,5])
 * @returns Elements that both arrays share in common
 * @see https://medium.com/@alvaro.saburido/set-theory-for-arrays-in-es6-eb2f20a61848#c2f3
 */
export function arrayIntersection<T>(
  arrA: T[],
  arrB: T[],
  comparator: ArrayComparatorBool<T>,
): T[] {
  return arrA.filter((v: T): boolean => arrayIncludes(arrB, v, comparator));
}

/** arrDif = arrA - arrB
 * If arrA=[1,3,4,5] and arrB=[1,2,5] then return=[3,4]
 * If( arrA=[1,2,5] and arrB=[1,3,4,5] then return=[2])
 * @returns Elements from array A that are not in the array B
 * @see https://medium.com/@alvaro.saburido/set-theory-for-arrays-in-es6-eb2f20a61848#f22b
 */
export function arrayDifference<T>(
  arrA: T[],
  arrB: T[],
  comparator: ArrayComparatorBool<T>,
): T[] {
  return arrA.filter((v: T): boolean => !arrayIncludes(arrB, v, comparator));
}

/**
 * If arrA=[1,3,4,5] and arrB=[1,2,5] then return=[3,4,2]
 * @returns Elements from array A that are not in the array B AND vise versa
 * @see https://medium.com/@alvaro.saburido/set-theory-for-arrays-in-es6-eb2f20a61848#18d2
 */
export function arraySymmetricDifference<T>(
  arrA: T[],
  arrB: T[],
  comparator: ArrayComparatorBool<T>,
): T[] {
  return arrayDifference(arrA, arrB, comparator).concat(
    arrayDifference(arrB, arrA, comparator),
  );
}

/**
 * If arrA=[1,3,4,5] and arrB=[1,2,5], then return=[1,2,3,4,5]
 * @returns union of non duplicated elements from 2 arrays
 * @see https://medium.com/@alvaro.saburido/set-theory-for-arrays-in-es6-eb2f20a61848#eae1
 */
export function arrayUnion<T>(arrA: T[], arrB: T[]): T[] {
  return arrayUnique([...arrA, ...arrB]);
}

/**
 * Same as arrayUnion but works better with objects because of the comparator
 * @returns union of non duplicated objects from 2 arrays
 */
export function arrayUnionWith<T>(
  arrA: T[],
  arrB: T[],
  comparator: ArrayComparatorBool<T>,
): T[] {
  const result: T[] = [...arrA];

  arrB.forEach((arrBv: T): void => {
    let found: boolean = false;

    for (const resultItem of result) {
      if (comparator(arrBv, resultItem)) {
        found = true;
        break;
      }
    }
    if (!found) result.push(arrBv);
  });

  return result;
}

/**
 * If arrA=[{n="bob",a="5"},{n="alice",a="10"}]
 * And if arrB=[{n="alice",a="11"},{n="jack",a="20"}]
 * And if comparator=(a,b)=>a.n===b.n
 * Then return arr=[{n="bob",a="5"},{n="alice",a="11"},{n="jack",a="20"}]
 * @return Elements in both arrays, with similar elements in B overriding elements in A
 */
export function arrayUnionOverride<T>(
  arrA: T[],
  arrB: T[],
  comparator: ArrayComparatorBool<T>,
): T[] {
  // A contains items not in B
  const ADiffB: T[] = arrayDifference(arrA, arrB, comparator);
  // B contains overrides for A
  const BIntersA: T[] = arrayIntersection(arrB, arrA, comparator);
  // B contains extra items not in A
  const BDiffA: T[] = arrayDifference(arrB, arrA, comparator);
  return [...ADiffB, ...BIntersA, ...BDiffA];
}

export function arrayFindDuplicatesWith<T>(
  arr: T[],
  comparator?: ArrayComparatorNum<T>,
): T[] {
  const arrSorted: T[] = comparator
    ? [...arr].sort(comparator)
    : [...arr].sort();
  const results: T[] = [];

  for (let i: number = 0; i < arrSorted.length - 1; i++) {
    // Guaranteed to be T since loop is constrained
    const arrEl: T = safeArrayIndex(arrSorted, i);
    const arrElNext: T = safeArrayIndex(arrSorted, i + 1);
    if (comparator && comparator(arrEl, arrElNext) === 0) {
      results.push(arrEl);
    } else if (arrEl === arrElNext) {
      results.push(arrEl);
    }
  }

  return results;
}

export function arrayFindDuplicates<T>(arr: T[]): T[] {
  const countMap: Map<T, number> = new Map();
  const duplicates: T[] = [];

  arr.forEach((val: T): void => {
    if (countMap.has(val)) {
      countMap.set(val, (countMap.get(val) || 0) + 1);
    } else {
      countMap.set(val, 1);
    }
  });

  countMap.forEach((count: number, val: T): void => {
    if (count > 1) duplicates.push(val);
  });

  return duplicates;
}

/**
 *
 * Creates groups of arrays based on @chunkSize
 * If @chunkSize is 2 and arr=[1,2,3,4,5] then return [[1,2],[3,4],[5]]
 * If @chunkSize is 0 then return [arr]
 * @ref https://stackoverflow.com/questions/7273668/how-to-split-a-long-array-into-smaller-arrays-with-javascript
 */
export function chunk<T>(arr: T[], chunkSize: number = 2): T[][] {
  if (chunkSize === 0) return [arr];
  const results: T[][] = [];
  for (let i: number = 0; i < arr.length; i += chunkSize) {
    results.push(arr.slice(i, i + chunkSize));
  }
  return results;
}

export function isStringArray(arr: unknown[]): arr is string[] {
  return arr.every((val: unknown): boolean => typeof val === 'string');
}

export function objectFromArray(arr: string[]): Record<string, string> {
  return Object.fromEntries(
    arr.map((key: string): [string, string] => [key, '']),
  );
}
