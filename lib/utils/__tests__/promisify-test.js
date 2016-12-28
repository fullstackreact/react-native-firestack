jest.unmock('../promisify');

import promisify from '../promisify';
import sinon from 'sinon'

describe('promisify', () => {
  let NativeModule;

  beforeEach(() => {
    NativeModule = {
      nativeFn: sinon.spy(),
      nativeRet: (callback) => callback(null, true),
      nativeErr: (callback) => callback({type: 'error'})
    }
  });

  it('returns a function to be called', () => {
    expect(
      typeof promisify('nativeFn', NativeModule)
    ).toEqual('function')
  })

  it('returns a function which returns a promise', () => {
    const promise = promisify('nativeFn', NativeModule)();
    expect(promise instanceof Promise).toBeTruthy();
  });

  it('calls the native function when called', () => {
    const promise = promisify('nativeFn', NativeModule)();
    expect(NativeModule.nativeFn.called).toBeTruthy();
  });

  it('resolves its promise when the native function returns', (done) => {
    const promise = promisify('nativeRet', NativeModule)();
    promise.then((res) => {
      expect(res).toBeTruthy();
      done();
    });
  });

  it('rejects when the natie function returns an error', (done) => {
    const promise = promisify('nativeErr', NativeModule)();
    promise.catch((err) => {
      expect(err.type).toBe('error')
      done();
    })
  })

})
