// For old-farts
require('es5-shim')
require('es5-shim/es5-sham')

var brofist = require('../')

brofist.run(require('./specs'), require('hifive-tap')())