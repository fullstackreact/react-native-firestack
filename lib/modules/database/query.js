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

  static modifiers: Array<string>;

  ref: Reference;

  constructor(ref: Reference, path: Array<string>, existingModifiers?: Array<string>) {
    super(ref.db, path);
    this.log.debug('creating Query ', path, existingModifiers);
    this.uid = uid++; // uuid.v4();
    this.ref = ref;
    this.modifiers = existingModifiers ? [...existingModifiers] : [];
  }

  setOrderBy(name: string, key?: string) {
    if (key) {
      this.modifiers.push(name + ':' + key);
    } else {
      this.modifiers.push(name);
    }
  }

  setLimit(name: string, limit: number) {
    this.modifiers.push(name + ':' + limit);
  }

  setFilter(name: string, value: any, key?:string) {
    if (key) {
      this.modifiers.push(name + ':' + value + ':' + key);
    } else {
      this.modifiers.push(name + ':' + value);
    }
  }

  getModifiers(): Array<string> {
    return [...this.modifiers];
  }

  getModifiersString(): string {
    if (!this.modifiers || !Array.isArray(this.modifiers)) {
      return '';
    }
    return this.modifiers.join('|');
  }
}
