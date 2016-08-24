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
class DatabaseRef {
  constructor(db, path) {
    this.db = db;
    this.path = path;

    this.handle = -1;
  }

  on(evt, cb) {
    this.db.on(evt, (data) => {
      this.db.log.debug('Got a snapshot', data.eventName, 'at', this.path);
      const snap = new DataSnapshot(data.snapshot);
        if (cb && typeof(cb) === 'function') {
          cb(snap);
        }
    }, FirestackDatabaseEvt);

    return promisify('on', FirestackDatabase)(this.path, evt)
      .then(handle => {
        this.handle = handle;
        return handle;
      });
  }

  off(evt) {
    return promisify('off', FirestackDatabase)(this.path, this.handle)
      .then(val => {
        return val;
      })
  }
}

export class Database extends Base {

  constructor(firestack, options={}) {
    super(firestack, options);
    this.refs = {};

    this.log.debug('Created new Database instance', this.options);
  }

  ref(...path) {
    const name = path.join('/');
    if (!this.refs[name]) {
      this.refs[name] = new DatabaseRef(this, name);
    }
    return this.refs[name];
  }

  get namespace() {
    return 'firestack:database'
  }
}

export default Database