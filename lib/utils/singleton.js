'use strict';

const Symbol = require('es6-symbol');
let singleton;

class Singleton {    
  constructor() {
    this.singleton = Symbol(this.namespace);

    let Class = this.constructor;

    if(!Class[this.singleton]) {
      Class[this.singleton] = this;
    }

    return Class[this.singleton];
  }

  static get instance() {
    if(!this[this.singleton]) {
      this[this.singleton] = new this;
    }

    return this[this.singleton];
  }

  static reset() {
    delete this[this.singleton]
  }
}

export default Singleton;