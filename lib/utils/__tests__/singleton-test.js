jest.unmock('../singleton');

import Singleton from '../singleton';
import sinon from 'sinon'

let created = 0;
class TestClass extends Singleton {
  constructor() {
    super();
    created += 1;
  }

  get namespace() {
    return 'firestack:TestClass'
  }
}

describe('singleton', () => {
  let tc;

  beforeEach(() => {
    created = 0;
    TestClass.reset();
  })

  it('creates an instance of the class', () => {
    expect(created).toBe(0);
    TestClass.instance
    expect(created).toBe(1);
  })

  it('returns the singleton instance of the class when called a subsequent times', () => {
    expect(created).toBe(0);
    tc = TestClass.instance
    let tc2 = TestClass.instance
    expect(created).toBe(1);
    expect(tc).toBe(tc2);
  })

});