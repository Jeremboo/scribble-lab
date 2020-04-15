const { scribblePath, name } = require('./utils/getScribbleData')();
require('./startServer')(scribblePath, name);