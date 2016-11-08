// import 'React'
import Firestack from '../firestack.js'

describe('Firestack', () => {

  it('does not blow up on instantiation', () => {
    expect(function() {
      new Firestack({});
    }).not.toThrow()
  })

})