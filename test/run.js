require('es5-shim')
require('es5-shim/es5-sham')

var hifive = require('hifive')
hifive.runWithDefaults(require('./specs'), require('hifive-spec')())
