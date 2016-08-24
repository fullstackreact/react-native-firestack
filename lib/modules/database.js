/**
 * Database representation wrapper
 */
import {NativeModules} from 'react-native';
const FirestackDatabase = NativeModules.FirestackDatabase;

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
  constructor(db, ...path) {
    this.db = db;
    this.path = path.join('/');
  }

  on(evt, cb) {
    return promisify('onDBEventOnce', FirestackDatabase)(this.path, evt)
      .then(val => {
        const snap = new DataSnapshot(val);
        if (cb && typeof(cb) === 'function') {
          cb(snap);
        }
        return snap;
      });
  }
}

export class Database extends Base {

  constructor(firestack, options={}) {
    super(firestack, options);

    this.log.debug('Created new Database instance', this.options);
  }

  ref(...path) {
    return new DatabaseRef(this, path);
  }

  get namespace() {
    return 'firestack:database'
  }
}

export default Database