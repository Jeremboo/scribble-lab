const { readFileSync, existsSync, writeFileSync } = require('fs');

const { CACHE_PATH } = require('./constants');

// Get the current value
const cacheData = {};
if (existsSync(CACHE_PATH)) {
  const cache = readFileSync(CACHE_PATH, 'utf8');
  if (cache) {
    Object.assign(cacheData, JSON.parse(cache));
  }
} else {
  writeFileSync('.cache', '{}');
}


const getCachedValue = (key) => {
  return cacheData[key];
}

const setCachedValue = (key, value) => {
  cacheData[key] = value;
  writeFileSync('.cache', JSON.stringify(cacheData));
}

module.exports = { getCachedValue, setCachedValue };