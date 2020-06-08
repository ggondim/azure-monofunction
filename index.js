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
  constructor(path, methods, run) {
    this.path = path;
    this.methods = methods;
    this.run = Array.isArray(run) ? run : [run];
  }
}

class AzureMonofunction {
  constructor(routePrefix) {
    this.routePrefix = routePrefix;
    this.middlewares = new FunctionCascade();

    this.errorHandler = (error, context) => {
      if (context.log.error) context.log.error(error);
    };

    this.router = null;
  }

  get routes() {
    return this.router.root;
  }
  set routes(value) {
    this.initializeRouter(value);
  }

  initializeRouter(routes) {
    const options = {
      baseUrl: this.routePrefix,
      context: {
        middlewares: this.middlewares,
      },
      errorHandler: this.error,
    };
    options = routes.map((route) => ({
      path: route.path,
      action: async (context) => this.action(route, context),
    }));
    this.router = new UniversalRouter(options);
  }

  async listen() {
    return this.request;
  }

  async request(context) {
    const [ scheme, empty, hostName, ...urlParts] = context.req.originalUrl.split('/');
    context.req.scheme = scheme;
    context.req.hostName = hostName;
    context.req.path = `/${urlParts.join('/').split('?')[0]}`;
    context.pathname = context.req.path;
    context.res = context.res || {};

    const result = await this.router.resolve(context);

    if (result instanceof Error) {
      throw result;
    }
    if (!result.res.status) {
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
      cascade.catch(this.error);
      cascade.pipeline.push(
        ...this.middlewares.preProcessingPipeline,
        ...this.middlewares.mainProcessingPipeline,
        ...this.middlewares.postProcessingPipeline,
      );
      route.run.forEach(action => {
        cascade.use(action);
      });
      return FunctionCascade.$runManualEntryPoint(context, cascade);
    }
  }

  error(error, context) {
    if (this.errorHandler) this.errorHandler(error, context);
  }

  async onError(errorHandler) {
    this.errorHandler = errorHandler;
  }

  use(asyncFunction, phase) {
    return this.middlewares.use(asyncFunction, phase);
  }

  useIf(expressionFunc, asyncFunction, phase) {
    return this.middlewares.useIf(expressionFunc, asyncFunction, phase);
  }

  addRoutes(routes) {
    const routeList = Array.isArray(routes) ? routes : [routes];
    this.routes = routeList.map(route =>
      new AzureMonofunctionRoute(route.path, route.methods, route.run)
    );
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