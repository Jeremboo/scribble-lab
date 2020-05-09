const fs = require('fs');
const { ask, askBool } = require('.');

/**
 * create JSON file
 * require('fs');
 * @param  {String} name the file name
 * @param  {String} path the parent path
 */
module.exports = (pathName, path) => {
  const name = ask(`Title (${pathName}) : `) || pathName;
  const description = ask(`Description : `);
  // /const link = ask(`External link ? : `);
  const visible = askBool('Should it be visible ? : ');
  const data = {
    name,
    path,
    link: '',
    visible,
    preview: ['preview.gif'],
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
