/**
 * Database representation wrapper
 */
import {NativeModules, NativeEventEmitter} from 'react-native';
const FirestackDatabase = NativeModules.FirestackDatabase;
const FirestackDatabaseEvt = new NativeEventEmitter(FirestackDatabase);

import promisify from '../promisify'
import { Base } from './base'

class DataSnapshot {
  static key:String;
  static value:Object;
  static exists:boolean;
  static hasChildren:boolean;
  static childrenCount:Number;

  constructor(snapshot) {
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

// https://firebase.google.com/docs/reference/js/firebase.database.Reference
const separator = '/';
class DatabaseRef {
  constructor(db, path) {
    this.db = db;
    this.path = Array.isArray(path) ? 
                      path : 
                      (typeof path == 'string' ? 
                        [path] : []);

    this.dbSort = null;
    this.dbFilters = [];

    this.handles = [];

    // Aliases
    this.get = this.getAt;
    this.set = this.setAt;
    this.update = this.updateAt;
    this.remove = this.removeAt;
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
    this.path = this.path.concat(paths);
    return this;
  }

  // Get the value of a ref either with a key
  getAt(key) {
    const {path} = this.dbPath([key]);
    const modifiers = this.dbModifiers();
    return promisify('onOnce', FirestackDatabase)(path, modifiers, 'value');
  }

  setAt(key, val) {
    const {path, value} = this.dbPath([key, val]);
    return promisify('set', FirestackDatabase)(path, value)
  }

  updateAt(key, val) {
    const {path, value} = this.dbPath([key, val]);
    return promisify('update', FirestackDatabase)(path, value)
  }

  removeAt(key) {
    const {path} = this.dbPath([key]);
    return promisify('remove', FirestackDatabase)(path)
  }

  push(value={}) {
    const {path} = this.dbPath();
    return promisify('push', FirestackDatabase)(path, value)
      .then(({ref}) => new DatabaseRef(this.db, ref))
  }

  on(evt, cb) {
    const {path, value} = this.dbPath();
    const modifiers = this.dbModifiers();

    this.db.on(evt, (data) => {
      this.db.log.debug('Got a snapshot', data, 'at', path);
      const snap = new DataSnapshot(data.snapshot);
        if (cb && typeof(cb) === 'function') {
          cb(snap, data);
        }
    }, FirestackDatabaseEvt);

    return promisify('on', FirestackDatabase)(path, modifiers, evt)
      .then(handle => {
        this.handles.push(handle.handle);
        return handle;
      })
  }

  once(evt='once') {
    const {path} = this.dbPath();
    const modifiers = this.dbModifiers();
    return promisify('onOnce', FirestackDatabase)(path, modifiers, evt)
  }

  off(evt) {
    const {path, value} = this.dbPath();
    let promises = [];
    this.db.off(evt);
    this.handles.forEach(handle => {
      const p = promisify('off', FirestackDatabase)(path, handle)
        .then(val => {
          return val;
        })
      promises.push(p);
    });

    return Promise.all(promises);
  }

  // Modifiers
  orderByKey() {
    this.dbSort = 'orderByKey';
    return this;
  }

  orderByPriority() {
    this.dbSort = 'orderByPriority';
    return this;
  }

  orderByValue() {
    this.dbSort = 'orderByValue';
    return this;
  }

  orderByChild(key) {
    this.dbSort = `orderByChild:${key}`
    return this;
  }


  limitToLast(limit) {
    this.dbFilters.push(`limitToLast:${limit}`)
    return this;
  }

  limitToFirst(limit) {
    this.dbFilters.push(`limitToFirst:${limit}`)
    return this;
  }

  equalTo(value, key) {
    this.dbFilters.push(`equalTo:${value}:${key}`)
    return this;
  }

  endAt(value, key) {
    this.dbFilters.push(`endAt:${value}:${key}`)
    return this;
  }

  // attributes
  get fullPath() {
    return this.dbPath().path;
  }

  get name() {
    return this.path.splice(-1);
  }

  dbPath(arr) {
    let path = this.path;
    let key, value;
    if (arr && arr.length > 0) {
      key = arr[0];
      value = arr[1];
      // A key and a value were passed, to parse, if necessary
      if (arr.length == 1) {
        if (key && typeof(key) == 'string') {
          path.push(key);
        }
      } else {
        if (key && typeof(key) == 'string' && value) {
          path.push(key);
        } else {
          value = key;
        }
      }
    }

    let pathStr = (path.length > 0 ? path.join('/') : '/');
    if (pathStr[0] != '/') {
      pathStr = `/${pathStr}`
    }
    return {path: pathStr, value, key};
  }

  dbModifiers() {
    let arr = [];
    if (this.dbSort) {
      arr.push(this.dbSort);
    }
    if (this.dbFilters.length > 0) {
      arr = arr.concat(this.dbFilters);
    }
    return arr;
  }
}

export class Database extends Base {

  constructor(firestack, options={}) {
    super(firestack, options);
    this.refs = {};

    this.log.debug('Created new Database instance', this.options);
  }

  ref(...path) {
    return new DatabaseRef(this, path);
  }

  on(evt, cb) {
    return this.firestack.on(evt, cb, FirestackDatabaseEvt);
  }

  off(evt) {
    return this.firestack.off(evt);
  }

  get namespace() {
    return 'firestack:database'
  }
}

export default Database