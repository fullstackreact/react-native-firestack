'use strict'
// https://github.com/purposeindustries/window-or-global
module.exports = (typeof self === 'object' && self.self === self && self) ||
  (typeof global === 'object' && global.global === global && global) ||
  this
