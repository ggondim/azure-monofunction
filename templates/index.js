const app = require('azure-monofunction');
const routes = require('../routes.js');

// Custom global middleware example
app.use(async (context, STOP_SIGNAL) => {
  context.res.headers = {
    'X-Custom-Header': 'happy'
  };
});

app.addRoutes(routes);

app.onError((context, error) => {
  context.res.status = 500;
  context.res.body = error;
});

module.exports = app.listen();