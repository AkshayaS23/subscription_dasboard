// server/api/index.js
const app = require('../server'); // expect server.js to export an Express app or a handler

module.exports = (req, res) => {
  // If server.js exported an express app, invoke it
  if (typeof app === 'function') return app(req, res);
  // Otherwise, if server.js exported { app } or something else, adapt accordingly
  return res.status(500).send('Server not available');
};
