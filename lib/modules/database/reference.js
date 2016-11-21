/**
 * @flow
 */
import { NativeModules } from 'react-native';
import promisify from './../../utils/promisify';
import { ReferenceBase } from './../base';
import Snapshot from './snapshot.js';
import Disconnect from './disconnect.js';
import Query from './query.js';

const FirestackDatabase = NativeModules.FirestackDatabase;

/**
 * TODO ? why is it here and in index? make it a util
 * @param modifiers
 * @returns {*}
 */
function getModifiersString(modifiers) {
  if (!modifiers || !Array.isArray(modifiers)) {
    return '';
  }
  return modifiers.join('|');
}

// https://firebase.google.com/docs/reference/js/firebase.database.Reference
let uid = 0;

/**
 * @class Reference
 */
export default class Reference extends ReferenceBase {

  db: FirestackDatabase;
  query: Query;
  uid: number;

  constructor(db: FirestackDatabase, path: Array<string>, existingModifiers?: { [key: string]: string }) {
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
    const modifiers = this.dbModifiers();
    const modifiersString = getModifiersString(modifiers);
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
    const modifiers = this.dbModifiers();
    const modifiersString = getModifiersString(modifiers);
    this.log.debug('adding reference.on', path, modifiersString, evt);
    return this.db.storeRef(this.uid, this).then(() => {
      return this.db.on(this.uid, path, modifiers, evt, cb).then(subscriptions => {
        this.listeners[evt] = subscriptions;
      });
    });
  }

  once(evt?: string = 'once', cb: (snapshot: Object) => void) {
    const path = this.dbPath();
    const modifiers = this.dbModifiers();
    const modifiersString = getModifiersString(modifiers);
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
    const modifiers = this.dbModifiers();
    this.log.debug('ref.off(): ', path, modifiers, evt);
    return this.db.unstoreRef(this.uid).then(() => {
      return this.db.off(this.uid, path, modifiers, evt, origCB).then(subscriptions => {
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

  // class Query extends Reference {}

  // let ref = firestack.database().ref('/timeline');
  // ref.limitToLast(1).on('child_added', () => {});
  // ref.limitToFirst(1).on('child_added', () => {});
  // ref.on('child_added', () => {})

  // Modifiers
  orderByKey(): Reference {
    const newRef = new Reference(this.db, this.path, this.query.export());
    newRef.query.setOrderBy('orderByKey');
    return newRef;
  }

  orderByPriority(): Reference {
    const newRef = new Reference(this.db, this.path, this.query.export());
    newRef.query.setOrderBy('orderByPriority');
    return newRef;
  }

  orderByValue(): Reference {
    const newRef = new Reference(this.db, this.path, this.query.export());
    newRef.query.setOrderBy('orderByValue');
    return newRef;
  }

  orderByChild(key: string): Reference {
    const newRef = new Reference(this.db, this.path, this.query.export());
    newRef.query.setOrderBy('orderByChild', key);
    return newRef;
  }

  // Limits
  limitToLast(limit: number): Reference {
    const newRef = new Reference(this.db, this.path, this.query.export());
    newRef.query.setLimit('limitToLast', limit);
    return newRef;
  }

  limitToFirst(limit: number): Reference {
    // return this.query.setLimit('limitToFirst', limit);
    const newRef = new Reference(this.db, this.path, this.query.export());
    newRef.query.setLimit('limitToFirst', limit);
    return newRef;
  }

  // Filters
  equalTo(value: any, key?: string): Reference {
    const newRef = new Reference(this.db, this.path, this.query.export());
    newRef.query.setFilter('equalTo', value, key);
    return newRef;
  }

  endAt(value: any, key?: string): Reference {
    const newRef = new Reference(this.db, this.path, this.query.export());
    newRef.query.setFilter('endAt', value, key);
    return newRef;
  }

  startAt(value: any, key?: string): Reference {
    const newRef = new Reference(this.db, this.path, this.query.export());
    newRef.query.setFilter('startAt', value, key);
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

  dbModifiers(): Array<string> {
    return this.query.build();
  }

  get namespace(): string {
    return 'firestack:dbRef';
  }
}
