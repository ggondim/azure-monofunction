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

  // INTERNAL
  get routes() {
    return this.router.root;
  }
  // INTERNAL
  set routes(value) {
    this.initializeRouter(value);
  }

  // INTERNAL
  log(message, data) {
    if (this.debug) {
      const log = this.logger.log.bind({}, `[MONOFUNCTION] ${message}`);
      return data ? log(data) : log();
    }
  }

  // INTERNAL
  initializeRouter(routeList) {
    // group all routes with same paths
    const routeGroups = routeList.reduce((acc, route) => {
      if (acc[route.path]) {
        acc[route.path].routes.push(route);
      } else {
        acc[route.path] = { routes: [route] };
      }
      return acc;
    }, {});

    // maps a single route per path
    const routes = Object.keys(routeGroups).map((path) => {
      const group = routeGroups[path];

      // action selects the route that matches the path and HTTP verb
      const action = async (context) => {
        const route = group.routes.find(r => this.matchAnyVerb(context, r));
        if (route) {
          return this.runAction(route, context);
        }
        context.res.status = 405;
        throw new Error('405 Method not allowed');
      };
      return { path, action };
    });

    const routerOptions = {
      baseUrl: this.routePrefix,
      context: {
        middlewares: this.middlewares,
      },
      errorHandler: this.runError.bind(this),
    };
    this.log('Initializing router with routes', routes);
    this.router = new UniversalRouter(routes, routerOptions);
  }

  // INTERNAL
  matchAnyVerb(context, route) {
    return !!route.methods.find(m => m.toUpperCase() === context.req.method.toUpperCase());
  }

  // INTERNAL
  async executeRequest(context) {
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

  // INTERNAL
  async runAction(route, context) {
    if (!this.matchAnyVerb(context, route)) {
      context.res.status = 405;
      throw new Error('405 Method not allowed');
    } else {
      const cascade = new FunctionCascade();
      const monofunction = this;
      if (route.meta) context.meta = route.meta;

      cascade.catch((error, context) => {
        monofunction.log('Triggered error inside cascade catch');
        monofunction.runError(error, context);
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

  // INTERNAL
  runError(error, context) {
    if (error && error.status && error.status === 404 && this.notFoundHandler) {
      this.log('Triggered 404');
      return this.notFoundHandler(context);
    }
    this.log('Triggered error handler', error);
    if (this.errorHandler) this.errorHandler(error, context);
  }

  /**
   * Returns an Azure Function entrypoint for a HTTP Trigger.
   * @returns Azure Function entrypoint for a HTTP Trigger `async (context) => {}`
   * @memberof AzureMonofunction
   */
  listen() {
    const monofunction = this;
    monofunction.log('Initializing function entrypoint');
    return async (context) => monofunction.executeRequest(context);
  }

  /**
   * Registers an error handler to capture unexpected errors inside the function's middlewares.
   * @param {Function} errorHandler Function with (error, context) arguments. 
   * @memberof AzureMonofunction
   */
  onError(errorHandler) {
    this.errorHandler = errorHandler;
  }

  /**
   * Registers a handler to be called when no route matches the request path.
   * @param {Function} notFoundHandler Function with (context) argument.
   * @memberof AzureMonofunction
   */
  on404(notFoundHandler) {
    this.notFoundHandler = notFoundHandler;
  }

  /**
   * Adds a middleware for all routes.
   * @param {AsyncGeneratorFunction} asyncFunction Middleware in form of `async (context) => {}` as specified in Azure Functions Middlewares package.
   * @param {('PRE_PROCESSING'|'MAIN'|'POST_PROCESSING')?} [phase='MAIN'] Phase to register the middleware as specified in Azure Functions Middlewares package.. Defaults to 'MAIN'.
   * @returns
   * @memberof AzureMonofunction
   */
  use(asyncFunction, phase) {
    this.log('Adding global middleware');
    return this.middlewares.use(asyncFunction, phase);
  }

  /**
   * Adds a conditional middleware for all routes.
   * @param {Function} expressionFunc Expression function in form of `(context) => {}` that returns a boolean, to validade if the middleware should run or not, as specified in Azure Functions Middlewares package..
   * @param {AsyncGeneratorFunction} asyncFunction Middleware in form of `async (context) => {}` as specified in Azure Functions Middlewares package.
   * @param {('PRE_PROCESSING'|'MAIN'|'POST_PROCESSING')?} [phase='MAIN'] Phase to register the middleware as specified in Azure Functions Middlewares package.. Defaults to 'MAIN'.
   * @returns
   * @memberof AzureMonofunction
   */
  useIf(expressionFunc, asyncFunction, phase) {
    this.log('Adding global conditional middleware');
    return this.middlewares.useIf(expressionFunc, asyncFunction, phase);
  }

  /**
   * Adds a list of routes to the monofunction router.
   * @param {Array<{ path, methods, run, logger? }>} routes A list of valid routes.
   * @memberof AzureMonofunction
   */
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

  /**
   * Adds a single route to the monofunction router.
   * @param {Array<['GET','POST','PATCH','PUT','DELETE']>} methods List of HTTP verbs for the route.
   * @param {string} path The URL path for the route.
   * @param {AsyncGeneratorFunction|AsyncGeneratorFunction[]} run A single function middleware or a list of middlewares tha should run for the route, in form of `async (context) => {}` as specified in Azure Functions Middlewares package.
   * @memberof AzureMonofunction
   */
  route(methods, path, run) {
    this.addRoutes({ methods, path, run });
  }

  /**
   * Adds a single route to the monofunction router for HTTP verb "GET".
   * @param {string} path The URL path for the route.
   * @param {AsyncGeneratorFunction|AsyncGeneratorFunction[]} run A single function middleware or a list of middlewares tha should run for the route, in form of `async (context) => {}` as specified in Azure Functions Middlewares package.
   * @memberof AzureMonofunction
   */
  get(path, middlewares) { this.route(['GET'], path, middlewares); }
  /**
   * Adds a single route to the monofunction router for HTTP verb "POST".
   * @param {string} path The URL path for the route.
   * @param {AsyncGeneratorFunction|AsyncGeneratorFunction[]} run A single function middleware or a list of middlewares tha should run for the route, in form of `async (context) => {}` as specified in Azure Functions Middlewares package.
   * @memberof AzureMonofunction
   */
  post(path, middlewares) { this.route(['POST'], path, middlewares); }
  /**
   * Adds a single route to the monofunction router for HTTP verb "PUT".
   * @param {string} path The URL path for the route.
   * @param {AsyncGeneratorFunction|AsyncGeneratorFunction[]} run A single function middleware or a list of middlewares tha should run for the route, in form of `async (context) => {}` as specified in Azure Functions Middlewares package.
   * @memberof AzureMonofunction
   */
  put(path, middlewares) { this.route(['PUT'], path, middlewares); }
  /**
   * Adds a single route to the monofunction router for HTTP verb "DELETE".
   * @param {string} path The URL path for the route.
   * @param {AsyncGeneratorFunction|AsyncGeneratorFunction[]} run A single function middleware or a list of middlewares tha should run for the route, in form of `async (context) => {}` as specified in Azure Functions Middlewares package.
   * @memberof AzureMonofunction
   */
  delete(path, middlewares) { this.route(['DELETE'], path, middlewares); }
  /**
   * Adds a single route to the monofunction router for HTTP verb "PATCH".
   * @param {string} path The URL path for the route.
   * @param {AsyncGeneratorFunction|AsyncGeneratorFunction[]} run A single function middleware or a list of middlewares tha should run for the route, in form of `async (context) => {}` as specified in Azure Functions Middlewares package.
   * @memberof AzureMonofunction
   */
  patch(path, middlewares) { this.route(['PATCH'], path, middlewares); }
}

module.exports = new AzureMonofunction(routePrefix);