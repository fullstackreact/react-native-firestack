// document hack
import root from './window-or-global'
(function (global) {
  if (!global.document) {
    global.document = { documentElement: { style: { WebkitAppearance: true } } }
  }
  if(!global.localStorage) global.localStorage = {};
})(root);

let debug = () => {};

export class Log {
  constructor(namespace, enable) {
    this._namespace = namespace || 'firestack';
    this.l = null;
    this.loggers = {};
    this.enabled = false;
    this.enable(enable);
  }

  enable(booleanOrStringDebug) {
    root.localStorage.debug = 
      typeof booleanOrStringDebug === 'string' ? 
        booleanOrStringDebug : 
        (booleanOrStringDebug ? '*' : booleanOrStringDebug);

    this.enabled = !!root.localStorage.debug;
  }

  info(...args) {
    this._logger('info')(...args);
  }

  error(...args) {
    this._logger('error')(...args);
  }

  debug(...args) {
    this._logger('debug')(...args);
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