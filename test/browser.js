// For old-farts (ES3)
require('es5-shim')
require('es5-shim/es5-sham')

// For old DOM farts (IE8-)
var beanB = require('doom-bean')
var nwmatcherB = require('doom-nwmatcher')

// Run all these stuff
var brofist = require('../')
brofist.run( require('./specs')
           , require('brofist-browser')(nwmatcherB, beanB))