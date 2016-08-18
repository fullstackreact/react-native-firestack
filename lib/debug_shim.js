// document hack
if (!global.document) {
  global.document = { documentElement: { style: { WebkitAppearance: true } } }
}
if(!window.localStorage) window.localStorage = {};

let debug = () => {};

export class Log {

  constructor(namespace) {
    this._namespace = namespace || 'firestack';
    this.l = null;
    this.loggers = {};
  }

  enable(booleanOrStringDebug) {
    if (booleanOrStringDebug) {
      window.localStorage.debug = 
        typeof booleanOrStringDebug === 'string' ? booleanOrStringDebug : '*';
    }
  }

  info(...args) {
    this._logger('info')(...args);
  }

  error(...args) {
    this._logger('error')(...args);
  }

  _logger(level) {
    if (!this.loggers[level]) {
      this.loggers[level] = this._debug()(`${this._namespace}:${level}`)
    }
    return this.loggers[level];
  }

  _debug() {
    if (!this.l) {
      this.l = debug = require('debug');
    }
    return this.l;
  }
}

export default Log;