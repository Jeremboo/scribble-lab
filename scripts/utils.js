const readlineSync = require('readline-sync');
const fs = require('fs');

const createDir = dirPath => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  } else {
    throw(`ERROR : ${dirPath} already exist !`);
  }
};

const testDirPath = dirPath => {
  try {
    fs.openSync(dirPath, 'r');
  } catch (err) {
    throw(
      `ERROR : ${dirPath} does not exist ! You can :

      - Select a good dirPath with the command 'npm start'
      - Directly select a dirPath with the command 'DIR=[mydirPath] npm start'
      - Create a new sketch with the command 'npm run create'
    `);
  }
};

const ask = answer => readlineSync.question(answer);

const askWitchChoice = (arr, name) =>
  arr[readlineSync.keyInSelect(arr, `Witch ${name} ? : `)]
;

const askWitchChildDir = (dirPath, dirType) => {
  const dir = fs.readdirSync(dirPath);
  // TODO a revoir
  if (dir[0] === '.DS_Store') dir.splice(0, 1);
  if (dir[0] === '00_WIP') dir.splice(0, 1);
  return askWitchChoice(dir, dirType);
};


const createDataJSON = (name, path) => {
  const description = ask('Description : ');
  const data = {
    name,
    path,
    preview: `${path}/preview.gif`,
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
};


module.exports = {
  createDir,
  testDirPath,
  ask,
  askWitchChoice,
  askWitchChildDir,
  createDataJSON,
};
