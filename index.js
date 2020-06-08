const path = require('path');
const FunctionCascade = require('@azure-functions-middlewares/core');
const UniversalRouter = require('universal-router');
const dot = require('dot-object');
const functionHost = require(path.resolve(process.cwd(), './host.json'));

function _propOrVal(object, prop, defaultValue) {
  let value = defaultValue;
  try {
    value = dot.pick(prop, object) || defaultValue;
  } catch (error) {
  }
  return value;
}

const routePrefix = _propOrVal('extensions.http.routePrefix', functionHost, '/api');

class AzureMonofunctionRoute {
  constructor(path, methods, run, logger) {
    this.path = path;
    this.methods = methods;
    this.run = Array.isArray(run) ? run : [run];
    this.meta = {};
    
    logger(`ROUTE: [${methods.join(',')}] ${path}`, run);
  }
}

class AzureMonofunction {
  constructor(routePrefix) {
    this.routePrefix = routePrefix;
    this.middlewares = new FunctionCascade();

    this.errorHandler = (error, context) => {
      if (context.log.error) context.log.error(error);
    };

    this.notFoundHandler = (context) => {
      context.res.status = 404;
    };

    this.debug = false;
    this.logger = console;
    this.router = null;
  }

  get routes() {
    return this.router.root;
  }
  set routes(value) {
    this.initializeRouter(value);
  }

  log(message, data) {
    if (this.debug) {
      const log = this.logger.log.bind({}, `[MONOFUNCTION] ${message}`);
      return data ? log(data) : log();
    }
  }

  initializeRouter(routeList) {
    const options = {
      baseUrl: this.routePrefix,
      context: {
        middlewares: this.middlewares,
      },
      errorHandler: this.error.bind(this),
    };
    const routes = routeList.map((route) => ({
      path: route.path,
      action: async (context) => this.action(route, context),
    }));

    this.log('Initializing router with routes', routes);
    this.router = new UniversalRouter(routes, options);
  }

  listen() {
    const monofunction = this;
    monofunction.log('Initializing function entrypoint');
    return async (context) => monofunction.request(context);
  }

  async request(context) {
    this.logger = context;

    this.log('Parsing URL', context.req.originalUrl);
    const [ scheme, empty, hostName, ...urlParts] = context.req.originalUrl.split('/');
    context.req.scheme = scheme;
    context.req.hostName = hostName;
    context.req.path = `/${urlParts.join('/').split('?')[0]}`;
    context.pathname = context.req.path;
    context.res = context.res || {};
    
    this.log('Parsed path:', context.pathname);

    const result = await this.router.resolve(context);
    this.log('Successfully executed router.resolve with result', result);

    if (result instanceof Error) {
      this.log('Router.resolve returned an error');
      throw result;
    }
    if (!context.res.status) {
      throw new Error('A response status must be set using context.res.status');
    }

    return result;
  }

  async action(route, context) {
    if (!route.methods.find(m => m.toUpperCase() === context.req.method.toUpperCase())) {
      context.res.status = 405;
      throw new Error('405 Method not allowed');
    } else {
      const cascade = new FunctionCascade();
      const monofunction = this;
      if (route.meta) context.meta = route.meta;

      cascade.catch((error, context) => {
        monofunction.log('Triggered error inside cascade catch');
        monofunction.error(error, context);
      });
      cascade.pipeline.push(
        ...this.middlewares.preProcessingPipeline,
        ...this.middlewares.mainProcessingPipeline,
        ...this.middlewares.postProcessingPipeline,
      );
      route.run.forEach(action => {
        cascade.use(action);
      });
      const result = await FunctionCascade.$runManualEntryPoint(context, cascade);
      if (!result) return true;
      return result;
    }
  }

  error(error, context) {
    if (error && error.status && error.status === 404 && this.notFoundHandler) {
      this.log('Triggered 404');
      return this.notFoundHandler(context);
    }
    this.log('Triggered error handler', error);
    if (this.errorHandler) this.errorHandler(error, context);
  }

  onError(errorHandler) {
    this.errorHandler = errorHandler;
  }

  on404(notFoundHandler) {
    this.notFoundHandler = notFoundHandler;
  }

  use(asyncFunction, phase) {
    this.log('Adding global middleware');
    return this.middlewares.use(asyncFunction, phase);
  }

  useIf(expressionFunc, asyncFunction, phase) {
    this.log('Adding global conditional middleware');
    return this.middlewares.useIf(expressionFunc, asyncFunction, phase);
  }

  addRoutes(routes) {
    this.log('Adding routes middleware', routes);
    const routeList = Array.isArray(routes) ? routes : [routes];
    const logger = this.log.bind(this);
    this.routes = routeList.map(route => {
      const amfRoute = new AzureMonofunctionRoute(route.path, route.methods, route.run, logger);
      if (route.meta) {
        amfRoute.meta = route.meta;
      }
      return amfRoute;
    });
  }

  // route(methods, path, run) {
  //   this.addRoutes({ methods, path, run });
  // }

  // get(path, middlewares) { this.route(['GET'], path, middlewares); }
  // post(path, middlewares) { this.route(['POST'], path, middlewares); }
  // put(path, middlewares) { this.route(['PUT'], path, middlewares); }
  // delete(path, middlewares) { this.route(['DELETE'], path, middlewares); }
  // patch(path, middlewares) { this.route(['PATCH'], path, middlewares); }
  // head(path, middlewares) { this.route(['HEAD'], path, middlewares); }
  // options(path, middlewares) { this.route(['OPTIONS'], path, middlewares); }
}

module.exports = new AzureMonofunction(routePrefix);