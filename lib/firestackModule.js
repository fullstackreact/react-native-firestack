import firebase from 'firebase'
import db from 'firebase/database'
// import {createConstants} from 'redux-module-builder'

// const createTypes = (prefix) => createConstants({
//   prefix,
//   customTypes: {
//     'action': ['LISTEN', 'UNLISTEN', 'remove', 'update', 'set', 'get'],
//     'events': ['VALUE', 'ADDED', 'REMOVED', 'CHANGED']
//   }
// })(
//   {'ACTION': { types: 'action' }},
//   {'ITEM': { types: 'events' }},
//   'UPDATED'
// )

const createTypes = (prefix) => {
  const c = (str) => `${prefix.toUpperCase()}_${str.toUpperCase()}`
  return {
    ACTION_LISTEN: c('listen'),
    ACTION_UNLISTEN: c('unlisten')
  }
}

const defaultToObject = child => ({_key: child.key, ...child.val()})
const noop = (i) => i
const defaultSortFn = (a, b) => a.timestamp < b.timestamp
const defaultInitialState = {
  items: [],
}

export class FirestackModule {
  constructor(refName, opts={}) {
    this._refName = refName;
    this._makeRef = opts.makeRef || noop;
    this._dispatchFn = noop;

    this._ref = this._makeRef(db.ref(this._refName))
                    .orderByChild('timestamp')

    this._callback = this.createCallback(this._ref, opts);

    this._initialState = Object.assign({}, opts.initialState || defaultInitialState, {
      listening: false
    })

    this._types = createTypes(this._refName);
    this._toObject = opts.toObject || defaultToObject
    this._sortFn = opts.sortFn || defaultSortFn
    this._onChange = opts.onChange || noop;
  }

  /*
   * Actions
   */
  listen(cb) {
    return (dispatch, getState) => {
      this._dispatchFn = dispatch;
      this._callback = this._runCallback(dispatch, getState);
      const T = this._types;
      const listenRef =
          this._makeRef(db.ref(this._refName))
          .orderByChild('timestamp')

      this._ref = listenRef;

      const _itemAdded = (dispatch, getState) => {
        return new Promise((resolve, reject) => {

        })
      }

      // listenRef.on('value', snapshot => {
      //   dispatch({
      //     type: T.ITEM_VALUE,
      //     payload: snapshot
      //   })
      // })
      listenRef.on('child_added', this._itemAdded(dispatch, getState));
      listenRef.on('child_removed', this._itemRemoved(dispatch, getState));
      listenRef.on('child_changed', this._itemChanged(dispatch, getState))
      dispatch({type: T.ACTION_LISTEN})
    }
  }

  /*
   * Firebase handlers
   */
  _itemAdded(dispatch, getState) {
    const toObject = this._toObject;
    return (snapshot, prev) => {
      const state = getState()[this._refName];
      const newItem = toObject(snapshot, state);
      let list = state.items || [];
      list.push(newItem)
      list = list.sort(this._sortFn)
      this._callback({ type: this._types.ITEM_ADDED, payload: list });
    }
  }

  _itemRemoved(dispatch, getState) {
    return (snapshot, prev) => {
      const state = getState()[this._refName];
      const itemKeys = state.items.map(i => i._key);
      const itemIndex = itemKeys.indexOf(snapshot.key);
      let newItems = [].concat(state.items);
      newItems.splice(itemIndex, 1);
      let list = newItems.sort(this._sortFn)
      this._callback({type: this._types.ITEM_REMOVED, payload: list});
    }
  }

  _itemChanged(dispatch, getState) {
    const toObject = this._toObject;
    return (snapshot, prev) => {
      const state = getState()[this._refName];
      const existingItem = toObject(snapshot, state);

      let list = state.items;
      let listIds = state.items.map(i => i.uid);
      const itemIdx = listIds.indexOf(existingItem.uid);
      list.splice(itemIdx, 1, existingItem);
      this._callback({ type: this._types.ITEM_CHANGED, payload: list })
    }
  }

  unlisten() {
    return (dispatch, getState) => {
      const {firestack} = getState();
      firestack.off(this._ref);
      dispatch({type: this._types.ACTION_UNLISTEN})
    }
  }

  get(path) {
    return (dispatch, getState) => {
      this._ref.child(path)
        .once('value', snaphot => {
          dispatch({ type: this._types.ACTION_GET, path, snapshot })
        })
    }
  }

  set(path, value) {
    return (dispatch, getState) => {
      const {firestack} = getState();
      this._ref.child(path)
        .set(value, error => {
          dispatch({type: this._types.ACTION_SET, path, value, error})
        })
    }
  }

  update(path, value) {
    return (dispatch, getState) => {
      const {firestack} = getState();
      this._ref.child(path).update(value, error => {
        dispatch({type: this._types.ACTION_UPDATE, path, value, error})
      })
    }
  }

  remove(path) {
    return (dispatch, getState) => {
      const {firestack} = getState();
      this._ref.child(path).remove(error => {
        dispatch({type: this._types.ACTION_REMOVE, path, error})
      })
    }
  }

  // hackish, for now
  get actions() {
    return [
      'listen', 'unlisten',
      'get', 'set', 'update', 'remove'
    ].reduce((sum, name) => {
      return {
        ...sum,
        [name]: this[name].bind(this)
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
    return {
      [T.ACTION_LISTEN]: (state) => ({...state, listening: true}),
      [T.ACTION_UNLISTEN]: (state) => ({...state, listening: false}),

      [T.ITEM_VALUE]: (state, {payload}) => {
        const toObject = this._toObject;
        let list = [];
        payload.forEach(child => list.push(toObject(child, state)))
        list = list.sort(this._sortFn)

        return this._runCallback({...state, items: list})
      },

      [T.ITEM_ADDED]: (state, {payload}) => ({...state, items: payload}),
      [T.ITEM_CHANGED]: (state, {payload}) => ({...state, items: payload}),
      [T.ITEM_REMOVED]: (state, {payload}) => ({...state, items: payload})
    }
  }

  _runCallback(dispatch, getState) {
    return (action) => {
      if (this._onChange && typeof this._onChange === 'function') {
        try {
          dispatch(action);
          return this._onChange(dispatch, getState)(action)
        } catch (e) {
          console.log('Error in callback', e);
        }
      }
      return newState;
    }
  }

}

export default FirestackModule
