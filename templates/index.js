const app = require('azure-monofunction');
const routes = require('../routes.js');

app.debug = true;

// Custom global middleware example
const hasAuth = (context) => context.meta && context.meta.auth;
app.useIf(hasAuth, async (context, STOP_SIGNAL) => {
  context.res.headers = {
    'X-Custom-Header': 'NEEDS AUTHORIZATION'
  };
});

app.addRoutes(routes);

app.onError((error, context) => {
  context.res.status = 500;
  context.res.body = error;
});

module.exports = app.listen();
