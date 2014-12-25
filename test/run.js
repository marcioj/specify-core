require('es5-shim')
require('es5-shim/es5-sham')

var specify = require('specify-core')
specify.runWithDefaults(require('./specs'), require('specify-reporter-spec')())
