import invariant from 'invariant'
import promisify from '../utils/promisify'
import { Base, ReferenceBase } from './base'

class PresenceRef extends ReferenceBase {
  constructor(presence, ref, pathParts) {
    super(presence.firestack);

    this.presence = presence;
    const db = this.firestack.database;
    this.ref = ref;
    this.lastOnlineRef = this.ref.child('lastOnline');

    this._connectedRef = db.ref('.info/connected');
    this._pathParts = pathParts;

    this._onConnect = [];
  }

  setOnline() {
    this.ref.setAt({online: true})
    this._connectedRef.on('value', (snapshot) => {
      const val = snapshot.val();
      if (val) {
        // add self to connection list
        // this.ref.push()
        this.ref.setAt({
          online: true
        })
        .then(() => {
          this._disconnect();

          this._onConnect.forEach(fn => {
            if (fn && typeof fn === 'function') {
              fn.bind(this)(this.ref);
            }
          })
        })
      }
    });
    return this;
  }

  setOffline() {
    if (this.ref) {
      this.ref.setAt({online: false})
        .then(() => this.ref.off('value'))
      this.presence.off(this._pathParts);
    }
    return this;
  }

  _disconnect() {
    if (this.ref) {
      this.ref.onDisconnect()
        .setValue({online: false});
      // set last online time
      this.lastOnlineRef.onDisconnect()
        .setValue(this.firestack.ServerValue.TIMESTAMP)
    }
  }

  _pathKey() {
    return this._pathParts.join('/');
  }

  onConnect(cb) {
    this._onConnect.push(cb);
    return this;
  }

}

export class Presence extends Base {
  constructor(firestack, options={}) {
    super(firestack, options);

    this.instances = {};
    this.path = ['/presence/connections'];
  }

  on(key) {
    invariant(key, 'You must supply a key for presence');
    const path = this.path.concat(key);
    const pathKey = this._presenceKey(path);
    if (!this.instances[pathKey]) {
      const _ref = this.firestack.database.ref(pathKey);
      this.log.debug('Created new presence object for ', pathKey)
      const inst = new PresenceRef(this, _ref, path);

      this.instances[pathKey] = inst;
    }

    return this.instances[pathKey];
  }

  off(path) {
    const pathKey = this._presenceKey(path);
    if (this.instances[pathKey]) {
      delete this.instances[pathKey];
    }
  }

  ref(dbRef, path) {
    return new PresenceRef(this, dbRef, path);
  }

  _presenceKey(path) {
    return (path || this.path).join('/');
  }

  get namespace() {
    return 'firestack:presence'
  }
}

export default Presence;