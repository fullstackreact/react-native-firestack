import promisify from '../promisify'
import { Base, ReferenceBase } from './base'

class PresenceRef extends ReferenceBase {
  constructor(presence, ref) {
    super(presence.firestack);

    const db = this.firestack.database;
    this.ref = ref;
    this._connectedRef = db.ref('.info/connected');

    this._onConnect = [];
  }

  setOnlineFor(path) {
    const connectedDeviceRef = this.ref.child(path)
    this._lastOnlineRef = connectedDeviceRef.child('lastOnline');

    this._connectedRef.on('value', (snapshot) => {
      const val = snapshot.val();
      if (val) {
        // add self to connection list
        // this.ref.push()
        connectedDeviceRef.setAt({
          online: true
        })
          .then(() => {
            connectedDeviceRef.onDisconnect()
              .setValue({
                online: false
              });

            this._lastOnlineRef.onDisconnect()
              .setValue(this.firestack.ServerValue.TIMESTAMP)

            this._onConnect.forEach(fn => {
              if (fn && typeof fn === 'function') {
                fn.bind(this)(connectedDeviceRef);
              }
            })
          })
      }
    })
  }

  onConnect(cb) {
    this._onConnect.push(cb);
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