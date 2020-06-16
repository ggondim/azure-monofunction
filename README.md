<h1 align="center">
  <br>
  ⛈ Azure Monofunction
  <br>
</h1>

<p align="center">A router for Single-Function APIs in ⚡ Azure Functions.</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/azure-monofunction" />
  <img src="https://img.shields.io/bundlephobia/min/azure-monofunction" />
  <img src="https://img.shields.io/github/last-commit/ggondim/azure-monofunction" />
</p>

> Azure Monofunction is a router for Single-Function APIs (SFA) that makes possible for you to develop monolithic APIs and still use the power of serverless, like cost-per-consumption and automatic scalability. 

See all [features](#features).

## Table of contents

<ul>
  <li>
    <details>
      <summary><a href="#Installation">Installation</a></summary>
      <ul>
        <li><a href="#Requirements">Requirements</a></li>
        <li><a href="#Installing">Installing</a></li>
      </ul>
    </details>
  </li>
  <li>
    <details>
      <summary><a href="#Usage">Usage</a></summary>
      <ul>
        <li><a href="#TLDR">TL;DR - The most simple usage</a></li>
        <li><a href="#example">An example title</a></li>
      </ul>
    </details>
  </li>
  <li>
    <details>
      <summary><a href="#Extending">Extending</a></summary>
      <ul>
        <li><a href="#example">An example title</a></li>
      </ul>
    </details>
  </li>
  <li>
    <details>
      <summary><a href="#Help">Help</a></summary>
      <ul>
        <li><a href="#FAQ">FAQ</a></li>
        <li><a href="#Support">Support</a></li>
      </ul>
    </details>
  </li>
  <li>
    <details>
      <summary><a href="#API">API</a></summary>
      <ul>
        <li><a href="#example">An example title</a></li>
      </ul>
    </details>
  </li>
  <li>
    <details>
      <summary><a href="#Tecnhical-concepts">Technical concepts</a></summary>
      <ul>
        <li><a href="#Motivation-and-design">Motivation and design</a></li>
        <li><a href="#Features">Features</a></li>
        <li><a href="#Related-projects">Related projects</a></li>
        <li><a href="#Similar-projects">Similar projects</a></li>
      </ul>
    </details>
  </li>
  <li>
    <details>
      <summary><a href="#Contributing">Contributing</a></summary>
      <ul>
        <li><a href="#If-you-don-t-want-to-code">If you don't want to code</a></li>
        <li><a href="#If-you-want-to-code">If you want to code</a></li>
      </ul>
    </details>
  </li>
  <li>
    <details>
      <summary><a href="#Hall-of-fame">Hall of fame</a></summary>
      <ul>
        <li><a href="#who-is-using">Who is using</a></li>
        <li><a href="#Contributors">Contributors</a></li>
        <li><a href="#Backers">Backers</a></li>
        <li><a href="#Sponsors">Sponsors</a></li>
      </ul>
    </details>
  </li>
  <li><a href="#License">License</a></li>
</ul>

---

## Installation

### Requirements

![](https://img.shields.io/static/v1?label=npm&message=6.14.5&color=brightgreen) ![](https://img.shields.io/static/v1?label=node&message=12.16.3&color=brightgreen) ![](https://img.shields.io/static/v1?label=os&message=ubuntu-20.04&color=blueviolet) ![](https://img.shields.io/static/v1?label=platforms&message=Azure%20Functions%20Host&color=777) 

Azure Monofunction was tested for the environments below. Even we believe it may works in older versions or other platforms, **it is not intended to**.

<details>
  <summary><b>See tested environments</b></summary>

| Environment  |  Tested version  |
| ------------------- | ------------------- |
|  OS |  Ubuntu 20.04 |
|  Node.js |  12.16.3 |
|  Package Manager |  npm 6.14.5 |
|  Platforms |  Azure Functions Host v2 and v3 |

</details>

### Installing

#### Via package manager

![](https://nodei.co/npm/azure-monofunction.png?downloads=true&downloadRank=true&stars=true)

```shell
$ npm install --save azure-monofunction
```

#### Configuring the single function

1. Create a HTTP trigger in you function app. It can have any name, like "monofunction".

2. Change the `route` property for the trigger binding in `function.json` to a wildcard, like `{*segments}`. You can copy the [function.json template](templates/function.json).

3. Create the function `index.js` at the function folder and start develop following the basic usage below.

<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## Usage

![](https://img.shields.io/static/v1?label=modules&message=CommonJS&color=yellow) 
![](https://img.shields.io/static/v1?label=javascript&message=ECMA2015&color=yellow) 

### TL;DR

The most simple usage

```javascript
const app = require('azure-monofunction');

const routes = [{
  path: '/example/:param',
  methods: ['GET', 'PUT'],
  run: async (context) => {
    context.res.body = { it: 'works' };
  },
}]

app.addRoutes(routes);

module.exports = app.listen();
```

The anatomy of a simple route is an URL `path`, its HTTP `methods` to match and some middleware to `run`.

An alternative to the `addRoutes` method that supports a list of route objects is the method `route` that adds a single route to the router.

```javascript
app.route(['GET','POST'], '/example/path', async (context) => {
  // ...middleware logic
});
```

### Defining route paths

Route paths must always start with `/` and be followed by valid URL paths.

You can define **dynamic parameters** prefixing a path level with `:`.

For example, the URL `/users/123` will match the route `/users/:id`.

The parameter will be available at the `context.params` object.

Example:

```javascript
app.route(['GET'], '/users/:id', async (context) => {
  const userId = context.params.id;
});
```

### Defining the HTTP methods for a route

HTTP verbs must always be defined as arrays of strings both in route objects and `route` method.

The supported HTTP verbs are: `['GET', 'POST', 'PATCH', 'PUT', 'DELETE']`.

Additionally, you can add routes with verbs corresponding methods: `get()`, `post()`, `patch()`, `put()`, `delete()`.

```javascript
app.addRoutes([{ 
  methods: ['GET', 'POST'],
  path,
  run,
}]);

// is the same of:

app.route(['GET', 'POST'], path, run);

// and the same of:

app.get(path, run); // feels like Express 🙂
```

### Using middlewares for routes

Middlewares works with the power of [Azure Functions Middlewares](https://github.com/ggondim/azure-functions-middlewares) and are asynchronous functions that takes a required `context` argument and an optional `STOP_SIGNAL` argument.

Request object is available through `context.req` property and response should be set using the `context.res` property. Other [Azure Functions context properties](https://github.com/Azure/azure-functions-nodejs-worker/blob/master/types/public/Interfaces.d.ts#L18) are also available.

When defining a middleware for a route with the `run` property/argument, you can use a single middleware function or an **array of middlewares**.

Example:

```javascript
const headerMiddleware = async (context) => {
  context.res.headers['X-User-ID'] = context.params.id;
  context.anything = true;
};

const resourceMiddleware = async (context) => {
  context.res.body = { added: context.anything };
};

app.get('/posts/:id', [headerMiddleware, resourceMiddleware]);

// output of /posts request should be

// HTTP 200 /posts/123
// X-User-ID: 123
// { "added": true }
```

It is strongly recommended you read [Azure Functions Middlewares](https://github.com/ggondim/azure-functions-middlewares) docs, but, if you can't, please note:

> * Always use asynchronous functions as middlewares.
> * Do not return anything inside your middleware function, unless you want to throw an error.
> * You can pass values to the next middlewares using the `context` object reference.
> * Return the `STOP_SIGNAL` argument in the middleware if you need to prevent any following middleware to be executed. This is useful for Content-type negotiation or Authorization.
> * See other context-related docs in [Accessing and modifying the context](https://github.com/ggondim/azure-functions-middlewares#accessing-and-modifying-the-context) at the Azure Functions Middlewares reference.
> * [Common community middlewares](https://github.com/ggondim/azure-functions-middlewares#available-community-middlewares) are available under the Azure Functions Middlewares project.

### Controller architecture

Using a single-function API leads you back to the need of middleware reusability and composition.

This monolithic approach is more maintainable than microservices approach, but requires more organization.

When dealing with many routes and its middlewares, you certainly will fall to a controller separation pattern.

Controllers are often separated by resource entities or related services.

It is also good to separate your routes inside a route file for better reading.

Example:

Function directory tree

```
.
├── controllers
│   └── user.controller.js
├── monofunction
│   ├── function.json
│   ├── index.js
│   └── routes.js
└── host.json
```

`/controllers/user.controller.js`
```javascript

async function getUser({ req, res, params }) {
  context.res.body = await db.getUser(params.id);
}

async function createUser({ req }) {
  context.res.status = await db.createUser(req.body);
}

module.exports = {
  getUser,
  createUser,
};
```

`/monofunction/routes.js`
```javascript
const userController = require('../controllers/user.controller');

module.exports = [{
  path: '/users/:id',
  methods: ['GET'],
  run: userController.getUser,
}, {
  path: '/users',
  methods: ['POST'],
  run: userController.createUser,
}];
```

`/monofunction/index.js`
```javascript
const app = require('azure-monofunction');
const routes = require('./routes');

app.addRoutes(routes);

module.exports = app.listen();
```

### Capturing errors

If a middleware returns a value or throws an error, an error will also be forwarded to Azure Functions Host execution.

If you want to catch this unhandled errors, you can use the `onError` handler.

```javascript
app.onError((error, context) => {
  // error argument contains the original value
  // context is preserved until here
});
```

### Global middlewares

Sometimes you need to run common middlewares for all the routes, regardless its resources, just like headers validation, authorization rules and content-type negotiation and parsing.

You can add middlewares for all the routes ("global middlewares") using the `use()` method.

```javascript
app.use(async (context) => {
  context.res.headers['X-Powered-By'] = '⛈ Azure Monofunction';
});

app.addRoutes(routes);

// now all the routes will respond with a 'X-Powered-By' header
```

You can also add a conditional global middleware calling the `useIf()` method from [Azure Functions Middlewares](https://github.com/ggondim/azure-functions-middlewares#conditional-middlewares).

```javascript
const isChromeAgent = (context) => {
  return context.req.headers['User-Agent'].indexOf('Chrome') !== -1;
}

app.useIf(isChromeAgent, async (context) => {
  context.res.headers['Content-Type'] = 'text/html';
});

// now if a route was called from Chrome browser, the response will be set to HTML COntent-Type
```

Find useful built middlewares in [Common community middlewares](https://github.com/ggondim/azure-functions-middlewares#available-community-middlewares) of Azure Functions Middlewares.

### Defining a not found fallback

If no route was matched during a request, Azure Monofunction will throw a not found error.

But if you want to handle this not found event with a fallback route, you can use the `on404()` handler.

```javascript
app.on404((context) => {
  // add your fallback logic here, like:
  context.res.status = 404;
});
```

### Route custom metadata

You can add custom route metadata in route object's `meta` property that will be available in `context.meta` property:

```javascript
const routes = [{
  path: '/route',
  methods,
  meta: {
    something: 'value',
  },
  run: async (context) => {
    context.res.body = context.meta;
    // body will be { "something": "value" }
  },
}];
```

This is useful when you need to recover this meta in other middlewares, specially conditional middlewares, like an authorization middleware:

```javascript
const hasAuth = (context) => context.meta && context.meta.auth;
app.useIf(hasAuth, async (context, STOP_SIGNAL) => {
  if (!context.req.headers.Authorization) {
    context.res.status = 401;
    return STOP_SIGNAL;
  }
});

app.addRoutes([{
  path: '/resource',
  methods: ['POST'],
  meta: {
    auth: true
  },
  run,
}, {
  path: '/resource',
  methods: ['GET'],
  run,
}]);

// POST /resource without an Authorization header will return HTTP 401
// but GET /resource will not
```

### Debugging and customizing logger

You can log everything that is done by Azure Monofunction setting the `debug` property to `true`.

```javascript
app.debug = true;
```

You can also use a different logger than console/context setting it in the `logger` property.

```javascript
app.logger = MyCustomLogger;
```

> ℹ Note that your logger need to have a `log(message, ...args)` method.

### Route prefix

Azure Functions Host has a route prefix for all the requests. This defaults to `/api` but you can customize it in `host.json`:

```json
{
  "extensions": {
    "http": {
      "routePrefix": "api",
    }
  }
}
```

If you customize the route prefix, Azure Monofunction will try to guess it from `extensions.http.routePrefix` configuration defined in `host.json` file.

If in a parallel universe you did not defined the route prefix in `host.json` but your function app has a route prefix different than `/api`, you need to specify that in the Azure Monofunction's `routePrefix` property.

```javascript
app.routePrefix = '/notapi';
```

Make sure if you need to change it you did this changing **before adding any route**.

<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## Extending

Azure Monofunction is not intended to be extensible, but the middleware approach is extensible itself.

If you want to publish a middleware (or an evaluation function) you developed and think it will be useful for any other developer, see [Writing and publishing common middlewares](https://github.com/ggondim/azure-functions-middlewares#writing-and-publishing-common-middlewares) in Azure Functions Middlwares.

<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## Help

<!-- ### FAQ

<details>
  <summary><b>1. First question?</b></summary>

Answer here

</details> -->

### Support

![](https://img.shields.io/github/issues/ggondim/azure-monofunction)

If you need help or have a problem with this project and you not found you problem in FAQ above, [start an issue](https://github.com/ggondim/azure-monofunction/issues).

> We will not provide a SLA to your issue, so, don't expect it to be answered in a short time.

<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## API

### `AzureMonofunctionRoute` _class_

#### Fields

<details>
  <summary>
    <b>
      <code>path</code> 
      <i>_string_</i>
    </b>
  </summary>

> The path should be matched for the route.

</details>

<details>
  <summary>
    <b>
      <code>methods</code> 
      <i>_string[]_</i>
    </b>
  </summary>

> The HTTP verbs that should be matched for the route.

</details>

<details>
  <summary>
    <b>
      <code>run</code> 
      <i>_AsyncFunctionGenerator|AsyncFunctionGenerator[]_</i>
    </b>
  </summary>

> A single middleware function or an array of middleware functions.

A middleware should be in form of `async function (context, STOP_SIGNAL?):any`, as documented in [`asyncMiddleware` specification](https://github.com/ggondim/azure-functions-middlewares#asyncmiddleware).

</details>

<details>
  <summary>
    <b>
      <code>meta</code> 
      <i>_object_=<code>{}</code></i>
    </b>
  </summary>

> Custom route metadata to be available at `context.meta` property.

</details>

### `AzureMonoFunction` _class_

#### Fields

<details>
  <summary>
    <b>
      <code>debug</code> 
      <i>_boolean_=<code>false</code></i>
    </b>
  </summary>

> Determines if Azure Monofunctions operations should be logged or not.

</details>

<details>
  <summary>
    <b>
      <code>logger</code> 
      <i>_{ log: function }_=<code>console</code></i>
    </b>
  </summary>

> The logger object containing a `log(message, ...args)` function that will be used for logging messages.

</details>

<details>
  <summary>
    <b>
      <code>routePrefix</code> 
      <i>_string_=<code>"/api"</code></i>
    </b>
  </summary>

> The route prefix that will be used in route matching.

</details>

#### Methods

<details>
  <summary>
    <b>
      <code>addRoutes()</code> 
      <i>function(routes):void</i>
    </b>
  </summary>

> Adds a list of routes to the monofunction router.

**Arguments**

| Argument | Type | Required | Default | Description |
| - | - | - | - | - |
| routes | `AzureMonofunctionRoute[]` | true | | A list of valid routes. |

</details>

<details>
  <summary>
    <b>
      <code>get()</code>, <code>post()</code>, <code>patch()</code>, <code>put()</code>, <code>delete()</code> 
      <i>function(path, middlewares):void</i>
    </b>
  </summary>

> Adds a single route to the monofunction router for HTTP verb corresponding to the method name.

It is an alias for the method `route()`, but with the argument `methods` already defined.

</details>

<details>
  <summary>
    <b>
      <code>listen()</code> 
      <i>function():AzureFunction</i>
    </b>
  </summary>

> Returns the Azure Functions entrypoint `async (context) => {}` that will be called by the function HTTP trigger and will execute the entire router.

**Returns**

`AzureFunction`: the [Azure Functions entrypoint](https://github.com/Azure/azure-functions-nodejs-worker/blob/master/types/public/Interfaces.d.ts#L12).

</details>

<details>
  <summary>
    <b>
      <code>onError()</code> 
      <i>function(catchCallback):void</i>
    </b>
  </summary>

> Registers an error callback to be called when a middleware throws an error.

**Arguments**

| Argument | Type | Required | Default | Description |
| - | - | - | - | - |
| catchCallback | `function` | true | | A callback function that takes two arguments `(error, context)` |

**Callbacks**

##### catchCallback
_function (error, context):any_

| Argument | Type | Required | Default | Description |
| - | - | - | - | - |
| error | `Error|any` | true | | The error thrown by a middleware |
| context | [`Context` ℹ](https://github.com/Azure/azure-functions-nodejs-worker/blob/master/types/public/Interfaces.d.ts#L18) | true | | The Azure Function context object. |

Returns: anything returned by the callback will be ignored.

</details>

<details>
  <summary>
    <b>
      <code>on404()</code> 
      <i>function(notFoundHandler):void</i>
    </b>
  </summary>

> Registers a fallback handler to be called when no route matches the current URL.

**Arguments**

| Argument | Type | Required | Default | Description |
| - | - | - | - | - |
| notFoundHandler | `function` | true | | A callback function that takes one argument `(context)` |

**Callbacks**

##### notFoundHandler
_function (context):void_

| Argument | Type | Required | Default | Description |
| - | - | - | - | - |
| context | [`Context` ℹ](https://github.com/Azure/azure-functions-nodejs-worker/blob/master/types/public/Interfaces.d.ts#L18) | true | | The Azure Function context object. |

Returns: anything returned by the callback will be ignored.

</details>

<details>
  <summary>
    <b>
      <code>route()</code> 
      <i>function(methods, path, middlewares):void</i>
    </b>
  </summary>

> Adds a single route to the monofunction router.

**Arguments**

| Argument | Type | Required | Default | Description |
| - | - | - | - | - |
| methods | `Array<'GET'|'POST'|'PATCH'|'PUT'|'DELETE'>` | true | | List of HTTP verbs for the route. |
| path | `string` | true | | The URL path for the route. |
| middlewares | `AsyncGeneratorFunction|AsyncGeneratorFunction[]` | true | `default` | A single function middleware or a list of middlewares that should run for the route, in form of `async function (context, STOP_SIGNAL?):any`, as documented in [`asyncMiddleware` specification](https://github.com/ggondim/azure-functions-middlewares#asyncmiddleware). |

</details>

<details>
  <summary>
    <b>
      <code>use()</code> 
      <i>function(asyncMiddleware, phase?):void</i>
    </b>
  </summary>

> Adds a global middleware to be executed for every matched route.

Identical to [`use()` method from Azure Functions Middlewares](https://github.com/ggondim/azure-functions-middlewares#methods).

</details>

<details>
  <summary>
    <b>
      <code>useIf()</code> 
      <i>function(expression, asyncMiddleware, phase?):void</i>
    </b>
  </summary>

> Adds a global middleware to be conditionally executed for every matched route if the specified expression returns `true`.

Identical to [`useIf()` method from Azure Functions Middlewares](https://github.com/ggondim/azure-functions-middlewares#methods).

</details>

<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## Tecnhical concepts

### Motivation and design

Azure Monofunction borned to help developers use the power of serverless in Azure Functions but with minimal complexity with function management.

When using serverles, developers often end up with a microservices architecture, even with functions in the same Function App. Each function requires a HTTP binding, your own endpoint and an endpoint maps only to a single resource.

This complexity leads developers to create many triggers and functions to simple resource APIs, like CRUD APIs: you will ever need at least two functions (one for `/resource` and one for `/resource/:id`) and at least five `if` clauses in these functions to make it possible.

Then, in the end you always end up with two options: mix logic and confuse next API maintainers or deal with a lot of functions for basic operations that could be aggregated.

You probably experienced this, as we experienced at [NOALVO](https://midianoalvo.com.br), and you sure were not satisfied with any of these two approaches. 

**If you want to keep up with Azure Functions powers, like cost-per-consumption and elastic, automatic scalability, now you can build a monolithic API architecture, just like in Express, Koa or HAPI, using Azure Monofunction**.

Azure Monofunction was inspired specially from Express monolithic APIs.

> Curiosity: Azure is _the cloud_ ☁, Functions is _the flash_ ⚡, [Azure Functions Middlewares](https://github.com/NOALVO/azure-functions-middlewares) is _the thunder 🌩_ and Azure Monofunction is **_the thunderstorm_** ⛈. 

### Features

* Multilevel route matching
* Dynamic route params
* Route HTTP verbs
* Route middleware
* Route metadada
* Multiple middlewares (cascade) per route
* Global standard and conditional middlewares
* Error handler middleware
* Not found/404 handler middleware

### Related projects

* [Azure Functions Middlewares](https://github.com/NOALVO/azure-functions-middlewares)
* [Universal Router](https://github.com/kriasoft/universal-router)

<!-- ### Similar projects

* [Project 1]() -->

<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## Contributing

### If you don't want to code

Help us spreading the word or consider making a donation.

#### Star the project

![](https://img.shields.io/github/stars/ggondim/azure-monofunction?style=social)

#### Tweet it

![](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Fgithub.com%2Fggondim%2Fazure-monofunction)

<!-- #### Donate

![](https://c5.patreon.com/external/logo/become_a_patron_button.png)

![](https://camo.githubusercontent.com/b8efed595794b7c415163a48f4e4a07771b20abe/68747470733a2f2f7777772e6275796d6561636f666665652e636f6d2f6173736574732f696d672f637573746f6d5f696d616765732f707572706c655f696d672e706e67)

<img src="https://opencollective.com/webpack/donate/button@2x.png?color=blue" width=250 /> -->

#### Add your company name to the [Who is using](#Who-is-using) secion

Make a pull request or start an issue to add your company's name.

### If you want to code

![](https://img.shields.io/static/v1?label=code%20style&message=eslint/airbnb&color=orange) 

#### Code of conduct

![](https://img.shields.io/static/v1?label=Code%20of%20conduct&message=Contributor%20Covenant&color=informational)

We follow [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/0/code_of_conduct/code_of_conduct.md). If you want to contribute to this project, you must accept and follow it.

#### SemVer

![](https://img.shields.io/static/v1?label=semver&message=2.0.0&color=informational)

This project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

#### Roadmap

If you are not solving an issue or fixing a bug, you can help developing the roadmap below.

<details>
  <summary>
    <b>See the roadmap</b>
  </summary>

* [ ] Improve documentation
* [ ] Conditional middlewares for routes
* [ ] Async error and not found handlers

</details>


<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## Hall of fame

### Who is using

* [NOALVO](https://midianoalvo.com.br)

<!-- ### Contributors

[![](https://sourcerer.io/fame/$USER/$OWNER/$REPO/images/0)](https://sourcerer.io/fame/ggondim/${OWNER}/azure-monofunction/links/0)

### Backers

<object type="image/svg+xml" data="https://opencollective.com/collective/tiers/backers.svg?avatarHeight=36&width=600"></object>

### Sponsors

<object type="image/svg+xml" data="https://opencollective.com/collective/tiers/Sponsors.svg?avatarHeight=36&width=600"></object>

<br/> -->

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## License

![](https://img.shields.io/github/license/ggondim/azure-monofunction)

Licensed under the [MIT License](LICENSE.md).

<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---
