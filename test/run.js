require('es5-shim')
require('es5-shim/es5-sham')

var hifive = require('hifive')
hifive.runWithDefaults(require('./specs'), require('hifive-spec')())
      .fork( function(e) { throw e }
           , function(report) {
               if (report.failed.length)  process.exit(1)
               if (!report.all().length)  process.exit(1)
               else                       process.exit(0)
             })
