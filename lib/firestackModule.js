import invariant from 'invariant'

const createTypes = (prefix) => {
  const c = (str) => `${prefix.toUpperCase()}_${str.toUpperCase()}`
  return {
    ACTION_CALL: c('call_function'),
    ACTION_SUCCESS: c('call_function_success'),
    ACTION_FAIL: c('call_function_failure'),

    ACTION_LISTEN: c('listen'),
    ACTION_UNLISTEN: c('unlisten'),
    ACTION_REMOVE: c('remove'),
    ACTION_UPDATE: c('update'),
    ACTION_SET: c('set'),
    ACTION_GET: c('get'),
    ITEM_VALUE: c('value'),
    ITEM_ADDED: c('added'),
    ITEM_REMOVED: c('remove'),
    ITEM_CHANGED: c('changed'),
    UPDATED: c('updated')
  }
}

const defaultToObject = child => ({_key: child.key, ...child.val()})
const identity = (i) => i
const defaultSortFn = (a, b) => a.timestamp < b.timestamp
const defaultInitialState = {
  items: [],
}

export class FirestackModule {
  constructor(refName, opts={}) {
    invariant(refName && typeof refName !== 'undefined', 'No ref name passed');
    
    this._refName = refName;
    this._makeRef = opts.makeRef || identity;

    const initialState = Object.assign({}, opts.initialState || defaultInitialState, {
      listening: false,
      items: []
    })

    this._localState = initialState;

    this._types = createTypes(this._refName);
    this._toObject = opts.toObject || defaultToObject
    this._sortFn = opts.sortFn || defaultSortFn
    this._onChange = opts.onChange || identity;

    if (opts.firestack) {
      this.setFirestack(opts.firestack);
    } else if (opts.store) {
      this.setStore(opts.store);
    }
  }

  makeRef(path) {
    const refName = [this._refName, path]
    const ref = this._firestack.database.ref(...refName);
    return this._makeRef(ref);
  }

  setFirestack(firestack) {
    if (firestack) {
      this._firestack = firestack;
    }
  }

  setStore(store) {
    if (store) {
      this._store = store;
    }
  }

  /*
   * Actions
   */
  listen(cb) {
    let store = this._getStore();
    invariant(store, 'Please set the store');

    const T = this._types;
    const listenRef = this.makeRef();
    const toObject = this._toObject;

    const _itemAdded = (snapshot, prevKey) => {
      const state = this._getState(); // local state
      const newItem = toObject(snapshot, state);
      let list = state.items || [];
      list.push(newItem)
      list = list.sort(this._sortFn)
      return this._handleUpdate(T.ITEM_ADDED, {items: list}, cb);
    }
    const _itemRemoved = (snapshot, prevKey) => {
      const state = this._getState(); // local state
      const itemKeys = state.items.map(i => i._key);
      const itemIndex = itemKeys.indexOf(snapshot.key);
      let newItems = [].concat(state.items);
      newItems.splice(itemIndex, 1);
      let list = newItems.sort(this._sortFn)
      return this._handleUpdate(T.ITEM_REMOVED, {items: list}, cb);
    }
    const _itemChanged = (snapshot, prevKey) => {
      const state = this._getState()
      const existingItem = toObject(snapshot, state);

      let list = state.items;
      let listIds = state.items.map(i => i._key);
      const itemIdx = listIds.indexOf(existingItem._key);
      list.splice(itemIdx, 1, existingItem);

      return this._handleUpdate(T.ITEM_CHANGED, {items: list}, cb);
    }

    return new Promise((resolve, reject) => {
      listenRef.on('child_added', _itemAdded);
      listenRef.on('child_removed', _itemRemoved);
      listenRef.on('child_changed', _itemChanged);

      this._handleUpdate(T.ACTION_LISTEN, null, (state) => {
        resolve(state)
      })
    })
  }

  unlisten() {
    const T = this._types;
    const ref = this.makeRef();

    return new Promise((resolve, reject) => {
      ref.off()
        .then((success) => {
          this._handleUpdate(T.ACTION_UNLISTEN, null, (state) => {
            resolve(state)
          })
        });
    })
  }

  // TODO: Untested
  getAt(path, cb) {
    const T = this._types;
    const ref = this.makeRef(path);
    const toObject = this._toObject;

    return new Promise((resolve, reject) => {
      ref.once('value', snapshot => {
        this._handleUpdate(T.ACTION_GET, null, (state) => {
          if (cb) {
            cb(toObject(snapshot, state));
          }
          resolve(state)
        })
      }, reject);
    });
  }

  setAt(path, value, cb) {
    const T = this._types;
    const ref = this.makeRef(path);
    const toObject = this._toObject;

    return new Promise((resolve, reject) => {
      ref.setAt(value, (error) => {
        this._handleUpdate(T.ACTION_SET, null, (state) => {
          if (cb) {
            cb(error, value);
          }
          return error ? reject(error) : resolve(value)
        });
      })
    });
  }

  updateAt(path, value, cb) {
    const T = this._types;
    const ref = this.makeRef(path);
    const toObject = this._toObject;

    return new Promise((resolve, reject) => {
      ref.updateAt(value, (error, snapshot) => {
        this._handleUpdate(T.ACTION_UPDATE, null, (state) => {
          if (cb) {
            cb(toObject(snapshot, state));
          }
          return error ? reject(error) : resolve(value)
        });
      });
    });
  }

  removeAt(path, cb) {
    const T = this._types;
    const ref = this.makeRef(path);
    const toObject = this._toObject;

    return new Promise((resolve, reject) => {
      ref.removeAt((error, snapshot) => {
        this._handleUpdate(T.ACTION_SET, null, (state) => {
          if (cb) {
            cb(toObject(snapshot, state));
          }
          return error ? reject(error) : resolve(value)
        });
      });
    });
  }

  // hackish, for now
  get actions() {
    const T = this._types;

    const wrap = (fn) => (...args) => {
      const params = args && args.length > 0 ? args : [];
      const promise = fn.bind(this)(...params)
      return {type: T.ACTION_CALL, payload: promise}
    }

    return [
      'listen', 'unlisten',
      'getAt', 'setAt', 'updateAt', 'removeAt'
    ].reduce((sum, name) => {
      return {
        ...sum,
        [name]: wrap(this[name])
      }
    }, {})
  }

  get initialState() {
    return this._initialState;
  }

  get types() {
    return this._types
  }

  get reducer() {
    const T = this._types;
    return (state = this._localState, {type, payload, meta}) => {
      if (meta && meta.module && meta.module === this._refName) {
        switch (type) {
          case T.ACTION_LISTEN:
            return ({...state, listening: true});
          case T.ACTION_UNLISTEN:
            return ({...state, listening: false});
          default:
            return {...state, ...payload};
        }
      }
      return state;
    }
  }

  /**
   * Helpers
   **/

  _handleUpdate(type, newState = {}, cb = identity) {
    const store = this._getStore();
    if (store && store.dispatch && typeof store.dispatch === 'function') {
      store.dispatch({type, payload: newState, meta: { module: this._refName }})
    }
    return cb(newState);
  }

  _getStore() {
    return this._store ? 
            this._store : 
            (this._firestack ? this._firestack.store : null);
  }

  _getState() {
    const store = this._getStore();
    return store.getState()[this._refName];
  }

}

export default FirestackModule
