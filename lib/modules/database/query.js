/**
 * @flow
 */
'use strict';

import { ReferenceBase } from './../base';
import Reference from './reference.js';

// TODO why randomly 1000000? comments?
let uid = 1000000;

/**
 * @class Query
 */
export default class Query extends ReferenceBase {
  static ref: Reference;

  static orderBy: Array<string>;
  static limit: Array<string>;
  static filters: Object;// { [key: string]: Array<string> };

  ref: Reference;

  constructor(ref: Reference, path: Array<string>, existingModifiers?: { [key: string]: string }) {
    super(ref.db, path);
    this.log.debug('creating Query ', path, existingModifiers);
    this.uid = uid++; // uuid.v4();
    this.ref = ref;
    this.orderBy = undefined;
    this.limit = undefined;
    this.filters = {};

    // parse exsitingModifiers
    if (existingModifiers) {
      this.import(existingModifiers);
    }
  }

  // noinspection ReservedWordAsName
  export(): { [key: string]: string } {
    const argsSeparator = ':';
    const ret = {};
    if (this.orderBy) {
      ret.orderBy = this.orderBy.join(argsSeparator);
    }
    if (this.limit) {
      ret.limit = this.limit.join(argsSeparator);
    }
    if (this.filters && Object.keys(this.filters).length > 0) {
      let filters = Object.keys(this.filters).map(key => {
        const filter = this.filters[key];
        if (filter) {
          return [key, filter].join(argsSeparator);
        }
      }).filter(Boolean);
      if (filters.length > 0) {
        ret.filters = filters.join('|');
      }
    }
    return ret;
  }

  // noinspection ReservedWordAsName
  import(modifiers: { [key: string]: string }) {
    const argsSeparator = ':';
    if (modifiers.orderBy) {
      this.setOrderBy(...modifiers.orderBy.split(argsSeparator));
    }

    if (modifiers.limit) {
      const [name, value] = modifiers.limit.split(argsSeparator);
      this.setLimit(name, parseInt(value, 10));
    }

    if (modifiers.filters) {
      modifiers.filters.split('|').forEach(filter => {
        this.setFilter(...filter.split(argsSeparator));
      });
    }
  }

  setOrderBy(name: string, ...args: Array<string>) {
    this.orderBy = [name].concat(args);
  }

  setLimit(name: string, limit: number) {
    this.limit = [name, limit];
  }

  setFilter(name: string, ...args: Array<?string>) {
    let vals = args.filter(str => !!str);
    if (vals.length > 0) {
      this.filters[name] = vals;
    }
  }

  build() {
    let exportObj = this.export();
    return Object.keys(exportObj).map(exportKey => exportObj[exportKey]);
  }
}
