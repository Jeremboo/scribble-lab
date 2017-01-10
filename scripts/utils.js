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
  arr[readlineSync.keyInSelect(arr, `Witch ${type} ? : `)]
;

/**
 * ask a question to select a child directory from a path
 * @param  {String} dirPath the parent path
 * @param  {String} type    type of values to select
 * @return {String}         directory path selected
 */
const askWitchChildDir = (dirPath, type) => {
  const dir = fs.readdirSync(dirPath);
  removeInstanceFromArray(dir, '.DS_Store');
  removeInstanceFromArray(dir, 'data.json');
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
 * @param  {String} parentPath valid parent path
 * @param  {String} [type='']  name of the type of path
 * @return {Object}            name and pathName
 */
const createDir = (parentPath, type = '') => {
  const name = ask(`${type} name : `);
  const nameToCamelCase = camelCase(name);
  const path = `${parentPath}${nameToCamelCase}`;

  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  } else {
    console.log(`ERROR : ${path} already exist ! Please write another.`);
    return createDir(parentPath, type);
  }
  return { name, path };
};

/**
 * CREATE FILE
 * require('fs');
 */

/**
 * create JSON file
 * @param  {String} name the file name
 * @param  {String} path the parent path
 */
const createDataJSON = (name, path) => {
  const description = ask(`Description to ${name}: `);
  const link = ask(`External link ? : `);
  const visible = askBool('Visible ? : ');
  const data = {
    name,
    path,
    link,
    visible,
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
  removeInstanceFromArray,
  ask,
  askWitchChoice,
  askWitchChildDir,
  askBool,
  pathExist,
  createDir,
  createDataJSON,
};
