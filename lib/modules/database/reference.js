/**
 * @flow
 */
import { NativeModules } from 'react-native';

import Query from './query.js';
import Snapshot from './snapshot';
import Disconnect from './disconnect';
import { ReferenceBase } from './../base';
import { promisify, isFunction, isObject, tryJSONParse, tryJSONStringify, generatePushID } from './../../utils';

const FirestackDatabase = NativeModules.FirestackDatabase;

// https://firebase.google.com/docs/reference/js/firebase.database.Reference

/**
 * @class Reference
 */
export default class Reference extends ReferenceBase {

  db: FirestackDatabase;
  query: Query;

  constructor(db: FirestackDatabase, path: Array<string>, existingModifiers?: Array<string>) {
    super(db.firestack, path);

    this.db = db;
    this.query = new Query(this, path, existingModifiers);
    this.log.debug('Created new Reference', this.db._dbHandle(path, existingModifiers));
  }

  child(...paths: Array<string>) {
    return new Reference(this.db, this.path.concat(paths));
  }

  keepSynced(bool: boolean) {
    const path = this.dbPath();
    return promisify('keepSynced', FirestackDatabase)(path, bool);
  }

  set(value: any) {
    const path = this.dbPath();
    const _value = this._serializeAnyType(value);
    return promisify('set', FirestackDatabase)(path, _value);
  }

  update(val: Object) {
    const path = this.dbPath();
    const value = this._serializeObject(val);
    return promisify('update', FirestackDatabase)(path, value);
  }

  remove() {
    return promisify('remove', FirestackDatabase)(this.dbPath());
  }

  /**
   *
   * @param value
   * @param onComplete
   * @returns {*}
   */
  push(value: any, onComplete: Function) {
    if (value === null || value === undefined) {
      // todo add server timestamp to push id call.
      const _paths = this.path.concat([generatePushID()]);
      return new Reference(this.db, _paths);
    }

    const path = this.dbPath();
    const _value = this._serializeAnyType(value);
    return promisify('push', FirestackDatabase)(path, _value)
      .then(({ ref }) => {
        const newRef = new Reference(this.db, ref.split('/'));
        if (isFunction(onComplete)) return onComplete(null, newRef);
        return newRef;
      }).catch((e) => {
        if (isFunction(onComplete)) return onComplete(e, null);
        return e;
      });
  }

  on(eventName: string, cb: () => any) {
    const path = this.dbPath();
    const modifiers = this.query.getModifiers();
    const modifiersString = this.query.getModifiersString();
    this.log.debug('adding reference.on', path, modifiersString, eventName);
    return this.db.on(path, modifiersString, modifiers, eventName, cb);
  }

  once(eventName: string = 'once', cb: (snapshot: Object) => void) {
    const path = this.dbPath();
    const modifiers = this.query.getModifiers();
    const modifiersString = this.query.getModifiersString();
    return promisify('onOnce', FirestackDatabase)(path, modifiersString, modifiers, eventName)
      .then(({ snapshot }) => new Snapshot(this, snapshot))
      .then((snapshot) => {
        if (isFunction(cb)) cb(snapshot);
        return snapshot;
      });
  }

  off(eventName?: string = '', origCB?: () => any) {
    const path = this.dbPath();
    const modifiersString = this.query.getModifiersString();
    this.log.debug('ref.off(): ', path, modifiersString, eventName);
    return this.db.off(path, modifiersString, eventName, origCB);
  }

  /**
   *
   * @param obj
   * @returns {Object}
   * @private
   */
  _serializeObject(obj: Object) {
    if (!isObject(obj)) return obj;

    // json stringify then parse it calls toString on Objects / Classes
    // that support it i.e new Date() becomes a ISO string.
    return tryJSONParse(tryJSONStringify(obj));
  }

  /**
   *
   * @param value
   * @returns {*}
   * @private
   */
  _serializeAnyType(value: any) {
    if (isObject(value)) {
      return {
        type: 'object',
        value: this._serializeObject(value),
      };
    }

    return {
      type: typeof value,
      value,
    };
  }

  // Modifiers
  orderByKey(): Reference {
    return this.orderBy('orderByKey');
  }

  orderByPriority(): Reference {
    return this.orderBy('orderByPriority');
  }

  orderByValue(): Reference {
    return this.orderBy('orderByValue');
  }

  orderByChild(key: string): Reference {
    return this.orderBy('orderByChild', key);
  }

  orderBy(name: string, key?: string): Reference {
    const newRef = new Reference(this.db, this.path, this.query.getModifiers());
    newRef.query.setOrderBy(name, key);
    return newRef;
  }

  // Limits
  limitToLast(limit: number): Reference {
    return this.limit('limitToLast', limit);
  }

  limitToFirst(limit: number): Reference {
    return this.limit('limitToFirst', limit);
  }

  limit(name: string, limit: number): Reference {
    const newRef = new Reference(this.db, this.path, this.query.getModifiers());
    newRef.query.setLimit(name, limit);
    return newRef;
  }

  // Filters
  equalTo(value: any, key?: string): Reference {
    return this.filter('equalTo', value, key);
  }

  endAt(value: any, key?: string): Reference {
    return this.filter('endAt', value, key);
  }

  startAt(value: any, key?: string): Reference {
    return this.filter('startAt', value, key);
  }

  filter(name: string, value: any, key?: string): Reference {
    const newRef = new Reference(this.db, this.path, this.query.getModifiers());
    newRef.query.setFilter(name, value, key);
    return newRef;
  }

  presence(path: string) {
    const presence = this.firestack.presence;
    const ref = path ? this.child(path) : this;
    return presence.ref(ref, this.dbPath());
  }

  // onDisconnect
  onDisconnect() {
    return new Disconnect(this);
  }

  // attributes
  toString(): string {
    return this.dbPath();
  }

  dbPath(paths?: Array<string>): string {
    const path = paths || this.path;
    const pathStr = (path.length > 0 ? path.join('/') : '/');

    if (pathStr[0] !== '/') {
      return `/${pathStr}`;
    }

    return pathStr;
  }

  get namespace(): string {
    return 'firestack:dbRef';
  }

  get key(): string|null {
    if (!this.path.length) return null;
    return this.path.slice(this.path.length - 1, this.path.length)[0];
  }

  get parent(): Reference|null {
    if (!this.path.length || this.path.length === 1) return null;
    return new Reference(this.db, this.path.slice(0, -1));
  }

  get root(): Reference {
    return new Reference(this.db, []);
  }
}
