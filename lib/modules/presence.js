import invariant from 'invariant'
import promisify from '../utils/promisify'
import { Base, ReferenceBase } from './base'

class PresenceRef extends ReferenceBase {
  constructor(presence, ref, pathParts) {
    super(presence.firestack);

    const db = this.firestack.database;
    this.ref = ref;
    this._connectedRef = db.ref('.info/connected');
    this._pathParts = pathParts;

    this._onConnect = [];
  }

  setOnline(path) {
    let connectedDeviceRef = this.ref;
    if (path) {
      this._pathParts.push(path);
      connectedDeviceRef = this.ref.child(path);
    }

    this._lastOnlineRef = connectedDeviceRef.child('lastOnline');

    this._connectedDeviceRef = connectedDeviceRef;
    this._connectedRef.on('value', (snapshot) => {
      const val = snapshot.val();
      if (val) {
        // add self to connection list
        // this.ref.push()
        connectedDeviceRef.setAt({
          online: true
        })
        .then(() => {
          this._disconnect();

          this._onConnect.forEach(fn => {
            if (fn && typeof fn === 'function') {
              fn.bind(this)(this._connectedDeviceRef);
            }
          })
        })
      }
    });
    return this;
  }

  setOffline() {
    if (this._connectedDeviceRef) {
      this._connectedDeviceRef.setAt({online: false})
        .then(() => this._connectedDeviceRef.off('value'))
    }
    return this;
  }

  _disconnect() {
    if (this._connectedDeviceRef) {
      this._connectedDeviceRef.onDisconnect()
        .setValue({online: false});
      // set last online time
      this._lastOnlineRef.onDisconnect()
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
    this.path = ['/presence/connections'].concat(key);
    return this._presence();
  }

  ref(dbRef, path) {
    return new PresenceRef(this, dbRef, path);
  }

  _presence() {
    const key = this._presenceKey();
    if (!this.instances[key]) {
      const _ref = this.firestack.database.ref(key);
      this.log.debug('Created new presence object for ', key)
      this.instances[key] = new PresenceRef(this, _ref, this.path);
    }
    return this.instances[key];
  }

  _presenceKey() {
    return this.path.join('/');
  }

  get namespace() {
    return 'firestack:presence'
  }
}

export default Presence;