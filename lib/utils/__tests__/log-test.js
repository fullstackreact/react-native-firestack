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