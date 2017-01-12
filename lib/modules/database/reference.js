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
    this.namespace = 'firestack:db:ref';
    this.query = new Query(this, path, existingModifiers);
    this.log.debug('Created new Reference', this.db._handle(path, existingModifiers));
  }

  /**
   *
   * @param bool
   * @returns {*}
   */
  keepSynced(bool: boolean) {
    const path = this._dbPath();
    return promisify('keepSynced', FirestackDatabase)(path, bool);
  }

  /**
   *
   * @param value
   * @returns {*}
   */
  set(value: any) {
    const path = this._dbPath();
    const _value = this._serializeAnyType(value);
    return promisify('set', FirestackDatabase)(path, _value);
  }

  /**
   *
   * @param val
   * @returns {*}
   */
  update(val: Object) {
    const path = this._dbPath();
    const value = this._serializeObject(val);
    return promisify('update', FirestackDatabase)(path, value);
  }

  /**
   *
   * @returns {*}
   */
  remove() {
    return promisify('remove', FirestackDatabase)(this._dbPath());
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
      const _paths = this.path.concat([generatePushID(this.db.serverTimeOffset)]);
      const newRef = new Reference(this.db, _paths);
      return onComplete(null, newRef);
    }

    const path = this._dbPath();
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
    if (!isFunction(cb)) throw new Error('The specified callback must be a function');
    const path = this._dbPath();
    const modifiers = this.query.getModifiers();
    const modifiersString = this.query.getModifiersString();
    this.log.debug('adding reference.on', path, modifiersString, eventName);
    return this.db.on(path, modifiersString, modifiers, eventName, cb);
  }

  once(eventName: string = 'once', cb: (snapshot: Object) => void) {
    const path = this._dbPath();
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
    const path = this._dbPath();
    const modifiersString = this.query.getModifiersString();
    this.log.debug('ref.off(): ', path, modifiersString, eventName);
    return this.db.off(path, modifiersString, eventName, origCB);
  }

  /**
   * MODIFIERS
   */

  /**
   *
   * @returns {Reference}
   */
  orderByKey(): Reference {
    return this.orderBy('orderByKey');
  }

  /**
   *
   * @returns {Reference}
   */
  orderByPriority(): Reference {
    return this.orderBy('orderByPriority');
  }

  /**
   *
   * @returns {Reference}
   */
  orderByValue(): Reference {
    return this.orderBy('orderByValue');
  }

  /**
   *
   * @param key
   * @returns {Reference}
   */
  orderByChild(key: string): Reference {
    return this.orderBy('orderByChild', key);
  }

  /**
   *
   * @param name
   * @param key
   * @returns {Reference}
   */
  orderBy(name: string, key?: string): Reference {
    const newRef = new Reference(this.db, this.path, this.query.getModifiers());
    newRef.query.setOrderBy(name, key);
    return newRef;
  }

  /**
   * LIMITS
   */

  /**
   *
   * @param limit
   * @returns {Reference}
   */
  limitToLast(limit: number): Reference {
    return this.limit('limitToLast', limit);
  }

  /**
   *
   * @param limit
   * @returns {Reference}
   */
  limitToFirst(limit: number): Reference {
    return this.limit('limitToFirst', limit);
  }

  /**
   *
   * @param name
   * @param limit
   * @returns {Reference}
   */
  limit(name: string, limit: number): Reference {
    const newRef = new Reference(this.db, this.path, this.query.getModifiers());
    newRef.query.setLimit(name, limit);
    return newRef;
  }

  /**
   * FILTERS
   */

  /**
   *
   * @param value
   * @param key
   * @returns {Reference}
   */
  equalTo(value: any, key?: string): Reference {
    return this.filter('equalTo', value, key);
  }

  /**
   *
   * @param value
   * @param key
   * @returns {Reference}
   */
  endAt(value: any, key?: string): Reference {
    return this.filter('endAt', value, key);
  }

  /**
   *
   * @param value
   * @param key
   * @returns {Reference}
   */
  startAt(value: any, key?: string): Reference {
    return this.filter('startAt', value, key);
  }

  /**
   *
   * @param name
   * @param value
   * @param key
   * @returns {Reference}
   */
  filter(name: string, value: any, key?: string): Reference {
    const newRef = new Reference(this.db, this.path, this.query.getModifiers());
    newRef.query.setFilter(name, value, key);
    return newRef;
  }

  // TODO why is this presence here on DB ref? its unrelated?
  presence(path: string) {
    const presence = this.firestack.presence;
    const ref = path ? this.child(path) : this;
    return presence.ref(ref, this._dbPath());
  }

  onDisconnect() {
    return new Disconnect(this);
  }

  child(path: string) {
    return new Reference(this.db, this.path.concat(path.split('/')));
  }

  toString(): string {
    return this._dbPath();
  }

  /**
   * GETTERS
   */

  /**
   * Returns the current key of this ref - i.e. /foo/bar returns 'bar'
   * @returns {*}
   */
  get key(): string|null {
    if (!this.path.length) return null;
    return this.path.slice(this.path.length - 1, this.path.length)[0];
  }

  /**
   * Returns the parent ref of the current ref i.e. a ref of /foo/bar would return a new ref to '/foo'
   * @returns {*}
   */
  get parent(): Reference|null {
    if (!this.path.length || this.path.length === 1) return null;
    return new Reference(this.db, this.path.slice(0, -1));
  }


  /**
   * Returns a ref to the root of db - '/'
   * @returns {Reference}
   */
  get root(): Reference {
    return new Reference(this.db, []);
  }

  /**
   * INTERNALS
   */

  _dbPath(paths?: Array<string>): string {
    const path = paths || this.path;
    const pathStr = (path.length > 0 ? path.join('/') : '/');

    if (pathStr[0] !== '/') {
      return `/${pathStr}`;
    }

    return pathStr;
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
}
