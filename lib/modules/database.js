/**
 * Database representation wrapper
 */
import {NativeModules, NativeEventEmitter} from 'react-native';
const FirestackDatabase = NativeModules.FirestackDatabase;
const FirestackDatabaseEvt = new NativeEventEmitter(FirestackDatabase);

import promisify from '../utils/promisify'
import { Base, ReferenceBase } from './base'

let dbSubscriptions = {};

class DataSnapshot {
  static key:String;
  static value:Object;
  static exists:boolean;
  static hasChildren:boolean;
  static childrenCount:Number;
  static childKeys:String[];

  constructor(ref, snapshot) {
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

  forEach(fn) {
    (this.childKeys || [])
      .forEach(key => fn({key: key, value: this.value[key]}))
  }

  map(fn) {
    let arr = [];
    this.forEach(item => arr.push(fn(item)))
    return arr;
  }

  reverseMap(fn) {
    return this.map(fn).reverse();
  }
}

class DatabaseOnDisconnect {
  constructor(ref) {
    this.ref = ref;
  }

  setValue(val) {
    const path = this.ref.dbPath();
    if (typeof val == 'string') {
      return promisify('onDisconnectSetString', FirestackDatabase)(path, val);
    } else if (typeof val == 'object') {
      return promisify('onDisconnectSetObject', FirestackDatabase)(path, val);
    }
  }

  remove() {
    const path = this.ref.dbPath();
    return promisify('onDisconnectRemove', FirestackDatabase)(path);
  }

  cancel() {
    const path = this.ref.dbPath();
    return promisify('onDisconnectCancel', FirestackDatabase)(path);
  }
}

class DatabaseQuery {
  static ref: DatabaseRef;
  static orderBy: String[];
  static limit: String[];
  static filters: Object;

  constructor(ref) {
    this.ref = ref;
    this.reset();
  }

  setOrderBy(name, ...args) {
    this.orderBy = [name].concat(args);
    return this.ref;
  }

  setLimit(name, ...args) {
    this.limit = [name].concat(args);
    return this.ref;
  }

  setFilter(name, ...args) {
    this.filters[name] = args.filter(n => n != undefined);
    return this.ref;
  }

  build() {
    const argsSeparator = ':'
    let modifiers = [];
    if (this.orderBy) {
      modifiers.push(this.orderBy.join(argsSeparator));
    }
    if (this.limit) {
      modifiers.push(this.limit.join(argsSeparator));
    }
    Object.keys(this.filters)
      .forEach(key => {
        let filter = this.filters[key];
        if (filter) {
          const cleanFilters = filter.filter((f) => typeof f !== "undefined");
          const filterArgs = ([key].concat(cleanFilters)).join(argsSeparator);
          modifiers.push(filterArgs);
        }
      })
    return modifiers;
  }

  reset() {
    this.orderBy = null;
    this.limit = null;
    this.filters = {};
    ['startAt', 'endAt', 'equalTo']
      .forEach(key => this.filters[key] = null);
    return this.ref;
  }
}

// https://firebase.google.com/docs/reference/js/firebase.database.Reference
const separator = '/';
class DatabaseRef extends ReferenceBase {
  constructor(db, path) {
    super(db.firestack, path);

    this.db = db;
    this.query = new DatabaseQuery(this);
    this.listeners = {};

    // Aliases
    this.get = this.getAt;
    this.set = this.setAt;
    this.update = this.updateAt;
    this.remove = this.removeAt;

    this.log.debug('Created new DatabaseRef', this.dbPath());
  }

  // Parent roots
  parent() {
    const parentPaths = this.path.slice(0, -1);
    return new DatabaseRef(this.db, parentPaths);
  }

  root() {
    return new DatabaseRef(this.db, []);
  }

  child(...paths) {
    return new DatabaseRef(this.db, this.path.concat(paths));
  }

  keepSynced(bool) {
    const path = this.dbPath();
    return promisify('keepSynced', FirestackDatabase)(path, bool);
  }

  // Get the value of a ref either with a key
  getAt() {
    const path = this.dbPath();
    const modifiers = this.dbModifiers();
    return promisify('onOnce', FirestackDatabase)(path, modifiers, 'value');
  }

  setAt(val) {
    const path = this.dbPath();
    const value = this._serializeValue(val);
    return promisify('set', FirestackDatabase)(path, value)
  }

  updateAt(val) {
    const path = this.dbPath();
    const value = this._serializeValue(val);
    return promisify('update', FirestackDatabase)(path, value)
  }

  removeAt(key) {
    const path = this.dbPath();
    return promisify('remove', FirestackDatabase)(path)
  }

  push(val={}) {
    const path = this.dbPath();
    const value = this._serializeValue(val);
    return promisify('push', FirestackDatabase)(path, value)
      .then(({ref}) => {
        return new DatabaseRef(this.db, ref.split(separator))
      })
  }

  on(evt, cb) {
    const path = this.dbPath();
    const modifiers = this.dbModifiers();
    return this.db.on(path, evt, cb)
      .then(({callback, subscriptions}) => {
        return promisify('on', FirestackDatabase)(path, modifiers, evt)
                .then(() => {
                  this.listeners[evt] = subscriptions;
                  callback(this);
                  return subscriptions;
                })
    });
  }

  once(evt='once', cb) {
    const path = this.dbPath();
    const modifiers = this.dbModifiers();
    return promisify('onOnce', FirestackDatabase)(path, modifiers, evt)
      .then(({snapshot}) => new DataSnapshot(this, snapshot))
      .then(snapshot => {
        if (cb && typeof cb === 'function') {
          cb(snapshot);
        }
        return snapshot;
      })
  }

  off(evt='', origCB) {
    const path = this.dbPath();
    return this.db.off(path, evt, origCB)
      .then(({callback, subscriptions}) => {
        if (dbSubscriptions[path] && dbSubscriptions[path][evt] && dbSubscriptions[path][evt].length > 0) {
          return subscriptions;
        }

        return promisify('off', FirestackDatabase)(path, evt)
          .then(() => {
            // subscriptions.forEach(sub => sub.remove());
            delete this.listeners[evt];
            callback(this);
            return subscriptions;
          })
      })
      .catch(err => {
        console.error('Never get here', err);
      })
  }

  cleanup() {
    let promises = Object.keys(this.listeners)
                          .map(key => this.off(key))
    return Promise.all(promises);
  }

  // Sanitize value
  // As Firebase cannot store date objects. 
  _serializeValue(obj={}) {
    return Object.keys(obj).reduce((sum, key) => {
      let val = obj[key];
      if (val instanceof Date) {
        val = val.toISOString();
      }
      return {
        ...sum,
        [key]: val
      }
    }, {});
  }

  _deserializeValue(obj={}) {
    return Object.keys(obj).reduce((sum, key) => {
      let val = obj[key];
      if (val instanceof Date) {
        val = val.getTime();
      }
      return {
        ...sum,
        [key]: val
      }
    }, {});
  }

  // Modifiers
  orderByKey() {
    return this.query.setOrderBy('orderByKey');
  }

  orderByPriority() {
    return this.query.setOrderBy('orderByPriority');
  }

  orderByValue() {
    return this.query.setOrderBy('orderByValue');
  }

  orderByChild(key) {
    return this.query.setOrderBy('orderByChild', key);
  }

  // Limits
  limitToLast(limit) {
    return this.query.setLimit('limitToLast', limit);
  }

  limitToFirst(limit) {
    return this.query.setLimit('limitToFirst', limit);
  }

  // Filters
  equalTo(value, key) {
    return this.query.setFilter('equalTo', value, key);
  }

  endAt(value, key) {
    return this.query.setFilter('endAt', value, key);
  }

  startAt(value, key) {
    return this.query.setFilter('startAt', value, key);
  }

  presence(path) {
    const presence = this.firestack.presence;
    const ref = path ? this.child(path) : this;
    return presence.ref(ref, this.dbPath());
  }

  // onDisconnect
  onDisconnect() {
    return new DatabaseOnDisconnect(this);
  }

  // attributes
  get fullPath() {
    return this.dbPath();
  }

  get name() {
    return this.path.splice(-1);
  }

  dbPath() {
    let path = this.path;
    let pathStr = (path.length > 0 ? path.join('/') : '/');
    if (pathStr[0] != '/') {
      pathStr = `/${pathStr}`
    }
    return pathStr;
  }

  dbModifiers() {
    const modifiers = this.query.build();
    this.query.reset(); // should we reset this
    return modifiers;
  }

  get namespace() {
    return `firestack:dbRef`
  }
}

export class Database extends Base {

  constructor(firestack, options={}) {
    super(firestack, options);
    this.log.debug('Created new Database instance', this.options);

    this.persistenceEnabled = false;
    this.successListener = null;
    this.errorListener = null;
    this.refs = {};
  }

  ref(...path) {
    const key = this._pathKey(path);
    if (!this.refs[key]) {
      const ref = new DatabaseRef(this, path);
      this.refs[key] = ref;
    }
    return this.refs[key];
  }

  setPersistence(enable=true) {
    let promise;
    if (this.persistenceEnabled !== enable) {
      this.log.debug(`${enable ? 'Enabling' : 'Disabling'} persistence`);
      promise = this.whenReady(promisify('enablePersistence', FirestackDatabase)(enable));
      this.persistenceEnabled = enable;
    } else {
      promise = this.whenReady(Promise.resolve({status: "Already enabled"}))
    }

    return promise;
  }

  handleDatabaseEvent(evt) {
    const body = evt.body;
    const path = body.path;
    const evtName = body.eventName;

    const subscriptions = dbSubscriptions[path];

    if (subscriptions) {
      const cbs = subscriptions[evtName];
      cbs.forEach(cb => {
        if (cb && typeof(cb) === 'function') {
          const snap = new DataSnapshot(this, body.snapshot);
          this.log.debug('database_event received', path, evtName);
          cb(snap, body);
        }
      });
    }
  }

  handleDatabaseError(evt) {
    this.log.debug('handleDatabaseError ->', evt);
  }

  on(path, evt, cb) {
    const key = this._pathKey(path);

    if (!dbSubscriptions[key]) {
      dbSubscriptions[key] = {};
    }

    if (!dbSubscriptions[key][evt]) {
      dbSubscriptions[key][evt] = [];
    }
    dbSubscriptions[key][evt].push(cb);

    if (!this.successListener) {
      this.successListener = FirestackDatabaseEvt
        .addListener(
          'database_event', 
          this.handleDatabaseEvent.bind(this));
    }

    if (!this.errorListener) {
      this.errorListener = FirestackDatabaseEvt
        .addListener(
          'database_error', 
          this.handleDatabaseError.bind(this));
    }

    const callback = (ref) => {
      const key = this._pathKey(ref.path);
      this.refs[key] = ref;
    }
    const subscriptions = [this.successListener, this.errorListener];
    return Promise.resolve({callback, subscriptions});
  }

  off(path, evt, origCB) {
    const key = this._pathKey(path);
    // Remove subscription
    if (dbSubscriptions[key]) {
      if (!evt || evt === "") {
        dbSubscriptions[key] = {};
      } else if (dbSubscriptions[key][evt]) {
        if (origCB) {
          dbSubscriptions[key][evt].splice(dbSubscriptions[key][evt].indexOf(origCB), 1);
        } else {
          delete dbSubscriptions[key][evt];
        }
      }

      if (Object.keys(dbSubscriptions[key]).length <= 0) {
        // there are no more subscriptions
        // so we can unwatch
        delete dbSubscriptions[key]
      }
      if (Object.keys(dbSubscriptions).length == 0) {
        if (this.successListener) {
          this.successListener.remove();
          this.successListener = null;
        }
        if (this.errorListener) {
          this.errorListener.remove();
          this.errorListener = null; 
        }
      }
    }
    const callback = (ref) => {
      const key = this._pathKey(ref.path);
      delete this.refs[key];
    }
    const subscriptions = [this.successListener, this.errorListener];
    return Promise.resolve({callback, subscriptions});
  }

  cleanup() {
    let promises = Object.keys(this.refs)
                          .map(key => this.refs[key])
                          .map(ref => ref.cleanup())
    return Promise.all(promises);
  }

  release(...path) {
    const key = this._pathKey(path);
    if (this.refs[key]) {
      delete this.refs[key];
    }
  }

  _pathKey(...path) {
    return path.join('-');
  }

  get namespace() {
    return 'firestack:database'
  }
}

export default Database
