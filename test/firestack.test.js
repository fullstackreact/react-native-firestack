const should = require('should');
const { shallow } = require('enzyme');
const Firestack = require('..');
const React = require('react');

describe('Firestack', () => {

  let firestackInstance;

  before(() => {
    firestackInstance = new Firestack({

    });
  });

  it('can be configured', () => {
    true.should.be.false;
  });
});