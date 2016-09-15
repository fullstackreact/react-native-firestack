import promisify from '../utils/promisify'
import { Base, ReferenceBase } from './base'

class PresenceRef extends ReferenceBase {
  constructor(presence, ref) {
    super(presence.firestack);

    const db = this.firestack.database;
    this.ref = ref;
    this._connectedRef = db.ref('.info/connected');

    this._onConnect = [];
  }

  setOnline(path) {
    const connectedDeviceRef = path ? this.ref.child(path) : this.ref;
    this._lastOnlineRef = connectedDeviceRef.child('lastOnline');

    this.connectedDeviceRef = connectedDeviceRef;
    this._connectedRef.on('value', (snapshot) => {
      const val = snapshot.val();
      if (val) {
        // add self to connection list
        // this.ref.push()
        connectedDeviceRef.setAt({
          online: true
        })
          .then(() => {
            this._disconnect(true);

            this._onConnect.forEach(fn => {
              if (fn && typeof fn === 'function') {
                fn.bind(this)(connectedDeviceRef);
              }
            })
          })
      }
    });
    return this;
  }

  setOffline() {
    this._disconnect();
  }

  _disconnect(onDisconnect) {
    if (onDisconnect) {
      this.connectedDeviceRef.onDisconnect()
        .setValue({online: false});
      // set last online time
      this._lastOnlineRef.onDisconnect()
        .setValue(this.firestack.ServerValue.TIMESTAMP)
    } else {
      this.connectedDeviceRef
        .setValue({online: false});
      this._lastOnlineRef
        .setValue(this.firestack.ServerValue.TIMESTAMP)
    }
  }

  onConnect(cb) {
    this._onConnect.push(cb);
    return this;
  }

}

export class Presence extends Base {
  constructor(firestack, options={}) {
    super(firestack, options);
  }

  on(path='presence/connections') {
    const _ref = this.firestack.database.ref(path);
    return new PresenceRef(this, _ref);
  }

  ref(dbRef, path) {
    return new PresenceRef(this, dbRef, path);
  }

  _pathKey(...path) {
    return path.join('-');
  }

  get namespace() {
    return 'firestack:presence'
  }
}

export default Presence;