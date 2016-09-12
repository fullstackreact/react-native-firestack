'use strict';

const Symbol = require('es6-symbol');
const singleton = Symbol('singleton');

class Singleton {    
  constructor() {
    let Class = this.constructor;

    if(!Class[singleton]) {
      Class[singleton] = this;
    }

    return Class[singleton];
  }

  static get instance() {
    if(!this[singleton]) {
      this[singleton] = new this;
    }

    return this[singleton];
  }
}

export default Singleton;