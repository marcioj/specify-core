// For old-farts
require('es5-shim')
require('es5-shim/es5-sham')

var buddy = require('../')

buddy.run(require('./specs'), require('buddy-tap')())