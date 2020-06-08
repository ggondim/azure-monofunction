const exampleController = require('./controllers/example.controller');

const customEndpointMiddleware = async (context, STOP_SIGNAL) => {
  context.res.headers = {
    'X-Custom-Header': 'sad'
  };
};

const routes = [{
  path: '/example/:param/action',
  methods: ['GET', 'POST'],
  run: exampleController.successAction,
  meta: {
    auth: true,
  }
}, {
  path: '/example/:param',
  methods: ['GET', 'PUT'],
  run: [ customEndpointMiddleware, exampleController.failureAction ],
}];

module.exports = routes;
