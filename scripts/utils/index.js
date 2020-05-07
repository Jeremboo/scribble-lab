const readlineSync = require('readline-sync');
const fs = require('fs');
const camelCase = require('camelcase');


// ARRAY
// http://stackoverflow.com/questions/5767325/how-to-remove-a-particular-element-from-an-array-in-javascript
const removeInstanceFromArray = (arr, instance) => {
  const index = arr.indexOf(instance);
  if (index !== -1) arr.splice(index, 1);
  return arr;
};

/**
 * DIRECTORY
 * require('fs');
 * require('camelcase');
 */

/**
  * test if a path exist
  * @param  {String} path  the path to test
  * @return {Boolean}      answer
  */
const pathExist = path => {
  if (!fs.existsSync(path)) {
    console.log(`ERROR : ${path} does not exist !`);
    return false;
  }
  return true;
};

/**
 * Create a directory into the path passed into parameter
 * @param  {String} parentPath    valid parent path
 * @param  {String} dirName       name of the directory
 * @param  {String} noOverwrite   name of the directory
 * @return {Object.String.String} name and path
 */
const createDir = (parentPath, name, errorIfExist = false) => {
  const path = `${parentPath}${name}/`;

  if (fs.existsSync(path)) {
    if (errorIfExist) {
      throw(`ERROR : ${path} already exist !`);
    }
  } else {
    fs.mkdirSync(path);
  }
  return path;
};

/**
 * ask a question to select a child directory from a path
 * @param  {String} parentPath valid parent path
 * @param  {String} type    type of values to select
 * @return {String}         directory path selected
 */
const createDirsDepth = (parentPath, arr) => {
  let i;
  let recurcivePath = `${parentPath}`;
  const length = arr.length;
  for (i = 0; i < length; i++) {
    createDir(recurcivePath, arr[i]);
    recurcivePath += `${arr[i]}/`;
  }
  return recurcivePath;
};

// TODO use regex
const getFilteredDirList = (dirPath, removeFolderWithoutApp) => fs.readdirSync(dirPath).filter(filePath => {
  const path = `${dirPath}${filePath}`;
  const isDirectory = fs.lstatSync(path).isDirectory();
  const isNotAssetFolder = !(filePath[0] === '_');

  let isContainingApp = true;
  if (removeFolderWithoutApp && isDirectory) {
    isContainingApp = false;
    fs.readdirSync(path).forEach(fileName => {
      if (fileName === 'app.js') {
        isContainingApp = true;
      }
    });
  }
  return isDirectory && isNotAssetFolder && isContainingApp;
})
;

/**
 * ASK
 * require('readline-sync');
 * require('fs');
 */

/**
 * ask a simple question
 * @param  {String} question the question to ask to the user
 * @return {String}          the answer from user
 */
const ask = question => readlineSync.question(question);

/**
 * ask a question to selected an answer into an array.
 * @param  {Array} arr   array of possiblities
 * @param  {String} type type of values to select
 * @return {arr[]}       one value of the array
 */
const askWitchChoice = (arr, type = '') =>
  arr[readlineSync.keyInSelect(arr, `Which ${type} ? : `)]
;

/**
 * ask a question to select a child directory from a path
 * @param  {String} dirPath the parent path
 * @param  {String} type    type of values to select
 * @return {String}         directory path selected
 */
const askWitchChildDir = (dirPath, type, removeFolderWithoutApp) => {
  const dir = getFilteredDirList(dirPath, removeFolderWithoutApp);
  return askWitchChoice(dir, type);
};

/**
 * ask a boolean question.
 * @param  {String}  question            the question to ask to the user
 * @param  {Boolean} [defaultValue=true] the default value if the answer is null
 * @return {Boolean}                     answer
 */
const askBool = (question, defaultValue = true) => {
  const trueValue = ['y', 'yes', 'yeah', 'yep', 'oui'];
  const falseValue = ['n', 'no', 'nah', 'nope'];
  if (defaultValue) {
    trueValue.push('');
  } else {
    falseValue.push('');
  }

  const answer = readlineSync.question(
    `${question} (${defaultValue ? 'yes' : 'no'})`, { trueValue, falseValue }
  );

  if (answer === true || answer === false) {
    return answer;
  }
  console.log('Please, answer with a correct value.')
  return askBool(question, defaultValue);
};

/**
 * Create a directory into the path passed into parameter
 * and ask for the path name
 * @param  {String} parentPath    valid parent path
 * @param  {String} [type='']     name of the type of path
 * @return {Object.String.String} dirName and path
 */
const askToCreateDir = (parentPath, type = '') => {
  const name = ask(`${type} name : `);
  const nameToCamelCase = camelCase(name);

  let path = false;
  try {
    path = createDir(parentPath, nameToCamelCase, true);
  } catch (e) {
    console.log(`ERROR : The folder ${name} already exist! Please write another name`);
  }
  return path ? { name, path } : askToCreateDir(parentPath, type);
};

module.exports = {
  removeInstanceFromArray,
  ask,
  askWitchChoice,
  askWitchChildDir,
  askBool,
  askToCreateDir,
  pathExist,
  createDir,
  createDirsDepth,
  getFilteredDirList,
};
