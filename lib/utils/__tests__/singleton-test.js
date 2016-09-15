jest.unmock('../singleton');

import Singleton from '../singleton';
import sinon from 'sinon'

class TestClass extends Singleton {
  static _createdCount;

  constructor(num) {
    super();
    TestClass._createdCount += TestClass._createdCount + 1;
  }

  get namespace() {
    return 'firestack:TestClass'
  }

  static get createdCount() {
    return TestClass._createdCount || 0;
  }

  static reset() {
    TestClass._createdCount = 0;
  }
}

describe('singleton', () => {
  let tc;

  beforeEach(() => {
    TestClass.reset();
  })

  it('creates an instance of the class', () => {
    expect(TestClass.createdCount).toBe(0);
    new TestClass();
    expect(TestClass.createdCount).toBe(1);
  })

  it('returns the singleton instance of the class when called a subsequent times', () => {
    expect(TestClass.createdCount).toBe(0);
    tc = new TestClass()
    let tc2 = new TestClass()
    expect(tc).toEqual(tc2);
  })

});