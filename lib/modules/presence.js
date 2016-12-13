import { Base, ReferenceBase } from './base';

class PresenceRef extends ReferenceBase {
  constructor(presence, ref, pathParts) {
    super(presence.firestack);
    this.ref = ref;
    this._onConnect = [];
    this.presence = presence;
    this._pathParts = pathParts;
    this.lastOnlineRef = this.ref.child('lastOnline');
    this._connectedRef = this.firestack.database().ref('.info/connected');
  }

  setOnline() {
    this.ref.set({ online: true });

    // todo cleanup - creating a ref every time?
    this._connectedRef.on('value', (snapshot) => {
      const val = snapshot.val();
      if (val) {
        // add self to connection list
        // this.ref.push()
        this.ref.set({
          online: true,
        })
          .then(() => {
            this._disconnect();

            // todo switch to event emitter
            // todo this will leak
            this._onConnect.forEach((fn) => {
              if (fn && typeof fn === 'function') {
                fn.bind(this)(this.ref);
              }
            });
          });
      }
    });
    return this;
  }

  setOffline() {
    if (this.ref) {
      this.ref.set({ online: false }).then(() => this.ref.off('value'));
      this.presence.off(this._pathParts);
    }
    return this;
  }

  _disconnect() {
    if (this.ref) {
      this.ref.onDisconnect().setValue({ online: false });
      // todo ServerValue is a promise? so this should be broken..?
      this.lastOnlineRef.onDisconnect().setValue(this.firestack.ServerValue.TIMESTAMP);
    }
  }

  _pathKey() {
    return this._pathParts.join('/');
  }

  // todo switch to event emitter
  // todo this will leak
  onConnect(cb) {
    this._onConnect.push(cb);
    return this;
  }

}

export default class Presence extends Base {
  constructor(firestack, options = {}) {
    super(firestack, options);

    this.instances = {};
    this.path = ['/presence/connections'];
  }

  on(key) {
    if (!key || !key.length) throw new Error('You must supply a key for presence');
    const path = this.path.concat(key);
    const pathKey = this._presenceKey(path);
    if (!this.instances[pathKey]) {
      const _ref = this.firestack.database().ref(pathKey);
      this.log.debug('Created new presence object for ', pathKey);
      this.instances[pathKey] = new PresenceRef(this, _ref, path);
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
    return 'firestack:presence';
  }
}
