const startServer = require('./startServer');
const getScribbleData = require('./utils/getScribbleData');

const { scribblePath, name } = getScribbleData();
startServer(scribblePath, name);