/**
 * @flow
 */
'use strict';

import promisify from '../utils/promisify';
import { Base, ReferenceBase } from './base';
import DatabaseRef from './databaseReference.js';

class DataSnapshot {
  static key:String;
  static value:Object;
  static exists:boolean;
  static hasChildren:boolean;
  static childrenCount:Number;
  static childKeys:String[];

  ref: Object;
  key: string;
  value: any;
  exists: boolean;
  priority: any;
  hasChildren: boolean;
  childrenCount: number
  childKeys: Array<string>;

  constructor(ref: DatabaseRef, snapshot: Object) {
    this.ref   = ref;
    this.key   = snapshot.key;
    this.value = snapshot.value;
    this.exists = snapshot.exists || true;
    this.priority = snapshot.priority;
    this.hasChildren = snapshot.hasChildren || false;
    this.childrenCount = snapshot.childrenCount || 0;
    this.childKeys = snapshot.childKeys || [];
  }

  val() {
    return this.value;
  }

  forEach(fn: (key: any) => any) {
    (this.childKeys || [])
      .forEach(key => fn(this.value[key]));
  }

  map(fn: (key: string) => mixed) {
    let arr = [];
    this.forEach(item => arr.push(fn(item)));
    return arr;
  }

  reverseMap(fn: (key: string) => mixed) {
    return this.map(fn).reverse();
  }
}
export default DataSnapshot;
