/**
 * Database representation wrapper
 */
import {NativeModules, NativeEventEmitter} from 'react-native';
const FirestackDatabase = NativeModules.FirestackDatabase;
const FirestackDatabaseEvt = new NativeEventEmitter(FirestackDatabase);

import promisify from '../promisify'
import { Base, ReferenceBase } from './base'

let dbSubscriptions = {};

class DataSnapshot {
  static key:String;
  static value:Object;
  static exists:boolean;
  static hasChildren:boolean;
  static childrenCount:Number;

  constructor(ref, snapshot) {
    this.ref   = ref;
    this.key   = snapshot.key;
    this.value = snapshot.value;
    this.exists = snapshot.exists || true;
    this.priority = snapshot.priority;
    this.hasChildren = snapshot.hasChildren || false;
    this.childrenCount = snapshot.childrenCount || 0;
  }

  val() {
    return this.value;
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
    this.filters[name] = args;
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
        const filter = this.filters[key];
        if (filter) {
          const filterArgs = [key, filter].join(argsSeparator)
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

  // Get the value of a ref either with a key
  getAt() {
    const path = this.dbPath();
    const modifiers = this.dbModifiers();
    return promisify('onOnce', FirestackDatabase)(path, modifiers, 'value');
  }

  setAt(val) {
    const path = this.dbPath();
    return promisify('set', FirestackDatabase)(path, val)
  }

  updateAt(val) {
    const path = this.dbPath();
    return promisify('update', FirestackDatabase)(path, val)
  }

  removeAt(key) {
    const path = this.dbPath();
    return promisify('remove', FirestackDatabase)(path)
  }

  push(value={}) {
    const path = this.dbPath();
    return promisify('push', FirestackDatabase)(path, value)
      .then(({ref}) => {
        return new DatabaseRef(this.db, ref.split(separator))
      })
  }

  on(evt, cb) {
    const path = this.dbPath();
    const modifiers = this.dbModifiers();
    return this.db.on(path, evt, cb)
      .then((subscription) => {
        return promisify('on', FirestackDatabase)(path, modifiers, evt)
                .then(() => subscription);
    });
  }

  once(evt='once') {
    const path = this.dbPath();
    const modifiers = this.dbModifiers();
    return promisify('onOnce', FirestackDatabase)(path, modifiers, evt)
      .then(({snapshot}) => new DataSnapshot(this, snapshot))
  }

  off(evt='') {
    const path = this.dbPath();
    return this.db.off(path, evt)
      .then(() => promisify('off', FirestackDatabase)(path, evt));
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
    return `firestack:dbRef:${this.dbPath()}`
  }
}

export class Database extends Base {

  constructor(firestack, options={}) {
    super(firestack, options);
    this.log.debug('Created new Database instance', this.options);

    this.listener = null;
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

  handleDatabaseEvent(evt) {
    const body = evt.body;
    const path = body.path;
    const evtName = body.eventName;

    const subscriptions = dbSubscriptions[path];

    if (subscriptions) {
      const cb = subscriptions[evtName];
      if (cb && typeof(cb) === 'function') {
        const snap = new DataSnapshot(this, body.snapshot);
        this.log.debug('database_event received', path, evtName, snap);
        cb(snap, body);
      }
    }
  }

  on(path, evt, cb) {
    const key = this._pathKey(path);

    if (!this.listener) {
      this.listener = FirestackDatabaseEvt
        .addListener(
          'database_event', 
          this.handleDatabaseEvent.bind(this));
    }

    if (!dbSubscriptions[key]) {
      dbSubscriptions[key] = {};
    }

    dbSubscriptions[key][evt] = cb;
    return Promise.resolve(this.listener);
  }

  off(path, evt) {
    if (this.listener) {
      const key = this._pathKey(path);
      // Remove subscription
      if (dbSubscriptions[key]) {
        if (dbSubscriptions[key][evt]) {
          delete dbSubscriptions[key][evt];
        }

        if (Object.keys(dbSubscriptions).length <= 0) {
          // there are no more subscriptions
          // so we can unwatch
          this.listener.remove();
          delete dbSubscriptions[key]
        }
      }
    }
    return Promise.resolve(this.listener);
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
