/**
 * @flow
 */
import { NativeModules } from 'react-native';
import { promisify } from './../../utils';
import { ReferenceBase } from './../base';
import Snapshot from './snapshot.js';
import Disconnect from './disconnect.js';
import Query from './query.js';

const FirestackDatabase = NativeModules.FirestackDatabase;

// https://firebase.google.com/docs/reference/js/firebase.database.Reference
let uid = 0;

/**
 * @class Reference
 */
export default class Reference extends ReferenceBase {

  db: FirestackDatabase;
  query: Query;
  uid: number;

  constructor(db: FirestackDatabase, path: Array<string>, existingModifiers?: Array<string>) {
    super(db.firestack, path);

    this.db = db;
    this.query = new Query(this, path, existingModifiers);
    this.uid = uid++; // uuid.v4();
    this.listeners = {};

    // Aliases
    this.get = this.getAt;
    this.set = this.setAt;
    this.update = this.updateAt;
    this.remove = this.removeAt;

    this.log.debug('Created new Reference', this.dbPath(), this.uid);
  }

  // Parent roots
  parent() {
    const parentPaths = this.path.slice(0, -1);
    return new Reference(this.db, parentPaths);
  }

  root() {
    return new Reference(this.db, []);
  }

  child(...paths: Array<string>) {
    return new Reference(this.db, this.path.concat(paths));
  }

  keepSynced(bool: boolean) {
    const path = this.dbPath();
    return promisify('keepSynced', FirestackDatabase)(path, bool);
  }

  // Get the value of a ref either with a key
  getAt() {
    const path = this.dbPath();
    const modifiers = this.query.getModifiers();
    const modifiersString = this.query.getModifiersString();
    return promisify('onOnce', FirestackDatabase)(path, modifiersString, modifiers, 'value');
  }

  setAt(val: any) {
    const path = this.dbPath();
    const value = this._serializeValue(val);
    return promisify('set', FirestackDatabase)(path, value);
  }

  updateAt(val: any) {
    const path = this.dbPath();
    const value = this._serializeValue(val);
    return promisify('update', FirestackDatabase)(path, value);
  }

  // TODO - what is key even for here?
  removeAt(key: string) {
    const path = this.dbPath();
    return promisify('remove', FirestackDatabase)(path);
  }

  push(val: any = {}) {
    const path = this.dbPath();
    const value = this._serializeValue(val);
    return promisify('push', FirestackDatabase)(path, value)
      .then(({ ref }) => {
        const separator = '/';
        return new Reference(this.db, ref.split(separator));
      });
  }

  on(evt?: string, cb: () => any) {
    const path = this.dbPath();
    const modifiers = this.query.getModifiers();
    const modifiersString = this.query.getModifiersString();
    this.log.debug('adding reference.on', path, modifiersString, evt);
    return this.db.storeRef(this.uid, this).then(() => {
      return this.db.on(this.uid, path, modifiersString, modifiers, evt, cb).then(subscriptions => {
        this.listeners[evt] = subscriptions;
      });
    });
  }

  once(evt?: string = 'once', cb: (snapshot: Object) => void) {
    const path = this.dbPath();
    const modifiers = this.query.getModifiers();
    const modifiersString = this.query.getModifiersString();
    return this.db.storeRef(this.uid, this).then(() => {
      return promisify('onOnce', FirestackDatabase)(path, modifiersString, modifiers, evt)
        .then(({ snapshot }) => new Snapshot(this, snapshot))
        .then(snapshot => {
          if (cb && typeof cb === 'function') {
            cb(snapshot);
          }
          return snapshot;
        });
    });
  }

  off(evt: string = '', origCB?: () => any) {
    const path = this.dbPath();
    const modifiers = this.query.getModifiers();
    this.log.debug('ref.off(): ', path, modifiers, evt);
    return this.db.unstoreRef(this.uid).then(() => {
      return this.db.off(this.uid, path, modifiersString, modifiers, evt, origCB).then(subscriptions => {
        // delete this.listeners[eventName];
        // this.listeners[evt] = subscriptions;
      });
    });
  }

  cleanup() {
    let promises = Object.keys(this.listeners)
      .map(key => this.off(key));
    return Promise.all(promises);
  }

  // Sanitize value
  // As Firebase cannot store date objects.
  _serializeValue(obj: Object = {}) {
    if (!obj) {
      return obj;
    }
    return Object.keys(obj).reduce((sum, key) => {
      let val = obj[key];
      if (val instanceof Date) {
        val = val.toISOString();
      }
      return {
        ...sum,
        [key]: val,
      };
    }, {});
  }

  // TODO this function isn't used anywhere - why is it here?
  _deserializeValue(obj: Object = {}) {
    return Object.keys(obj).reduce((sum, key) => {
      let val = obj[key];
      if (val instanceof Date) {
        val = val.getTime();
      }
      return {
        ...sum,
        [key]: val,
      };
    }, {});
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
  get fullPath(): string {
    return this.dbPath();
  }

  get name(): string {
    return this.path.splice(-1);
  }

  dbPath(): string {
    let path = this.path;
    let pathStr = (path.length > 0 ? path.join('/') : '/');
    if (pathStr[0] !== '/') {
      pathStr = `/${pathStr}`;
    }
    return pathStr;
  }

  get namespace(): string {
    return 'firestack:dbRef';
  }
}
