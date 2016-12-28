jest.unmock('../log');
jest.unmock('../window-or-global')
import Log from '../log';
import root from '../window-or-global';

describe('Log', () => {
  let log;

  beforeEach(() => {
    root.localStorage = {};
  })

  it('does not explode on import', () => {
    log = new Log('test');
    expect(log).toBeDefined();
  });

  it('can be enabled', () => {
    log = new Log('test', true);
    expect(log.enabled).toBeTruthy();
  });

  it('can be disabled', () => {
    log = new Log('test', true);
    expect(log.enabled).toBeTruthy();
    log.enable(false);
    expect(log.enabled).toBeFalsy();
  });

  describe('levels', () => {
    beforeEach(() => {
      log = new Log('test', true);
    });

    it('has an info level', () => {
      expect(() => {
        log.info('Testing')
      }).not.toThrow();
    });

    it('has a debug level', () => {
      expect(() => {
        log.debug('Testing')
      }).not.toThrow();
    });

    it('has an error level', () => {
      expect(() => {
        log.error('Testing')
      }).not.toThrow();
    });

  })

})