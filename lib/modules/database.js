/**
 * Database representation wrapper
 */
import {NativeModules} from 'react-native';
const FirestackDatabase = NativeModules.FirestackDatabase;

import promisify from '../promisify'
import { Base } from './base'

// https://firebase.google.com/docs/reference/js/firebase.database.Reference
class DatabaseRef {
  constructor(db, ...path) {
    this.db = db;
    this.path = path;
  }

  on(evt, cb) {
    console.log('listening on', FirestackDatabase);
    // return promisify('onDBEvent', FirestackDatabase)(this.path, evt);
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