if (process.env.MONOFUNCTION_STOP_TEMPLATES) return;

const fs = require('fs');
const path = require('path');

console.log('Azure Monofunction: creating templates... If you want to stop template creation, set environment variable MONOFUNCTION_STOP_TEMPLATES to any value.');

const cwd = process.cwd();

const packagePath = path.resolve(cwd, './node_modules/azure-monofunction/templates');
const monofuncPath = path.resolve(cwd, './_monofunction');
const controllersPath = path.resolve(cwd, './controllers');

const indexPath = (dir) => path.resolve(dir, './index.js'); 
const functionPath = (dir) => path.resolve(dir, './function.json'); 
const examplePath = (dir) => path.resolve(dir, './example.controller.js'); 
const routesPath = (dir) => path.resolve(dir, './routes.js'); 

if (!fs.existsSync(monofuncPath)) {
  fs.mkdir(monofuncPath);
}

if (!fs.existsSync(indexPath(monofuncPath))) {
  fs.copyFileSync(indexPath(packagePath), indexPath(monofuncPath));
}

if (!fs.existsSync(functionPath(monofuncPath))) {
  fs.copyFileSync(functionPath(packagePath), functionPath(monofuncPath));
}

if (!fs.existsSync(examplePath(controllersPath))) {
  fs.copyFileSync(examplePath(packagePath), examplePath(controllersPath));
}

if (!fs.existsSync(routesPath(cwd))) {
  fs.copyFileSync(routesPath(packagePath), routesPath(cwd));
}