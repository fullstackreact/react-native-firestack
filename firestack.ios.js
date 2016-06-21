/**
 * @providesModule Firestack
 * @flow
 */
'use strict';

var NativeFirestack = require('NativeModules').Firestack;

/**
 * High-level docs for the Firestack iOS API can be written here.
 */

var Firestack = {
  test: function() {
    NativeFirestack.test();
  }
};

module.exports = Firestack;
