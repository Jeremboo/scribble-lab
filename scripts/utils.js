const readlineSync = require('readline-sync');
const fs = require('fs');

const createDir = dirPath => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  } else {
    throw(`ERROR : ${dirPath} already exist !`);
  }
};

const ask = answer => readlineSync.question(answer);

const askWitchChildDir = (dirPath, dirType) => {
  const dir = fs.readdirSync(dirPath);
  // TODO a revoir
  if (dir[0] === '.DS_Store') dir.splice(0, 1);
  if (dir[0] === '00_WIP') dir.splice(0, 1);
  return dir[readlineSync.keyInSelect(dir, `Witch ${dirType} ? : `)];
};

module.exports = {
  createDir,
  ask,
  askWitchChildDir,
};
