/**
 * Describe, structure and runs tests for the Specify framework.
 *
 * @module specify-core/lib/index
 */

// -- Dependencies -----------------------------------------------------
var extend = require('xtend')


// -- Exports ----------------------------------------------------------
module.exports = [ require('./core')
                 , require('./runner')
                 , require('./report')
                 , require('./result')
                 ].reduce(extend, {})
