
/**
 * * *******************
 * * MATH
 * * *******************
 */
export const sqr = x => x * x;

export const radians = degrees => degrees * Math.PI / 180;

export const getPosXBetweenTwoNumbers = (min, max, x) => ((max - x) / (max - min));
export const getXBetweenTwoNumbersWithPercent = (min, max, x) => (min + (x * ((max - min))));

/**
 * * *******************
 * * RANDOM
 * * *******************
 */
export const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const getRandomFloat = (min, max) => (Math.random() * (max - min) + min);
export const getRandomAttribute = (json) => {
  const keys = Object.keys(json);
  return json[keys[getRandomInt(0, keys.length - 1)]];
};
export const getRandomItem = arr => arr[getRandomInt(0, arr.length - 1)];

/**
 * * *******************
 * * OTHERS
 * * *******************
 */

export const existingValueBy = (arr, comparator) =>
  arr.filter(value => comparator(value))[0]
;

export const testPerf = (fct, ...params) => {
  const t0 = performance.now();
  const result = fct(...params);
  const t1 = performance.now();
  console.log(`PERF === ${t1 - t0} ms.`);
  return result;
};