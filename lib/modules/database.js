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
    this.path = path;

    this.handles = [];

    // Aliases
    this.set = this.setAt;
    this.update = this.updateAt;
    this.remove = this.removeAt;
  }

  child(...path) {
    this.path = [this.path, ...path].join(separator);
    return this;
  }

  // Get the value of a ref either with a key
  getAt(key) {
    let path = this.path;
    if (key && typeof(key) == 'string') {
      path = `${path}${separator}${key}`
    }
    return promisify('onOnce', FirestackDatabase)(path);
  }

  setAt(key, value) {
    let path = this.path;
    if (key && typeof(key) == 'string' && value) {
      path = `${path}/${key}`
    } else {
      value = key;
    }
    return promisify('set', FirestackDatabase)(path, value)
  }

  updateAt(key, value) {
    let path = this.path;
    if (key && typeof(key) == 'string' && value) {
      path = `${path}${separator}${key}`
    } else {
      value = key;
    }
    return promisify('update', FirestackDatabase)(path, value)
  }

  removeAt(key) {
    let path = this.path;
    if (key && typeof(key) == 'string') {
      path = `${path}${separator}${key}`
    }
    return promisify('remove', FirestackDatabase)(path)
  }

  on(evt, cb) {
    this.db.on(evt, (data) => {
      this.db.log.debug('Got a snapshot', data, 'at', this.path);
      const snap = new DataSnapshot(data.snapshot);
        if (cb && typeof(cb) === 'function') {
          cb(snap, data);
        }
    }, FirestackDatabaseEvt);

    return promisify('on', FirestackDatabase)(this.path, evt)
      .then(handle => {
        this.handles.push(handle.handle);
        return handle;
      })
  }

  once(evt, cb) {
    return promisify('onOnce', FirestackDatabase)(this.path, evt);
  }

  off(evt) {
    let promises = [];
    this.db.off(evt);
    this.handles.forEach(handle => {
      const p = promisify('off', FirestackDatabase)(this.path, handle)
        .then(val => {
          return val;
        })
      promises.push(p);
    });

    return Promise.all(promises);
  }
}

export class Database extends Base {

  constructor(firestack, options={}) {
    super(firestack, options);
    this.refs = {};

    this.log.debug('Created new Database instance', this.options);
  }

  ref(...path) {
    const name = path.join('${separator}');
    if (!this.refs[name]) {
      this.refs[name] = new DatabaseRef(this, name);
    }
    return this.refs[name];
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