const fs = require('fs');
const camelCase = require('camelcase');

const ask = require('./utils').ask;
const createDir = require('./utils').createDir;
console.log(createDir)

// Create directory
const name = ask('Group name : ');
const nameToCamelCase = camelCase(name);
const path = `sketches/${nameToCamelCase}`;
createDir(path);

// Create json file
const description = ask('Description : ');

// data template
const data = {
  name,
  path,
  description,
  date: new Date(),
  tags: [],
};

try {
  fs.writeFileSync(
    `${path}/data.json`,
    JSON.stringify(data, null, 2), 'utf8'
  );
} catch (err) {
  console.log(`ERROR : ${err}`);
}
