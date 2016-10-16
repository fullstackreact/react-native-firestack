// document hack
import root from './window-or-global'

let bows;
(function (base) {
  window = base || window
  if(!window.localStorage) window.localStorage = {};
})(root);

const levels = [
  'warn', 'info', 'error', 'debug'
];

export class Log {
  constructor(namespace) {
    this._namespace = namespace || 'firestack';
    this.loggers = {};
    // Add the logging levels for each level
    levels
      .forEach(level => this[level] = (...args) => this._log(level)(...args));
  }

  static enable(booleanOrStringDebug) {
    window.localStorage.debug =
      typeof booleanOrStringDebug === 'string' ? 
        (booleanOrStringDebug === '*' ? true : booleanOrStringDebug) : 
        (booleanOrStringDebug instanceof RegExp ? booleanOrStringDebug.toString() : booleanOrStringDebug);

    window.localStorage.debugColors = !!window.localStorage.debug;
  }

  _log(level) {
    if (!this.loggers[level]) {
      (function() {
        const bows = require('bows');
        bows.config({ padLength: 20 });
        this.loggers[level] = bows(this._namespace, `[${level}]`);
      }.bind(this))();
    }
    return this.loggers[level];
  }
}

export default Log;