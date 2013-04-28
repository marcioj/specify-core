// For old-farts
require('es5-shim')
require('es5-shim/es5-sham')

var spec = require('../')()

require('./test')(spec)

function verdict(result) {
  return result.verdict == 'success'? '[OK]  '
  :      result.verdict == 'failure'? '[FAIL]'
  :      result.verdict == 'ignored'? '[?]   '
  :      /* otherwise */              '[...] '
}

function fullTitle(test) {
  var title = test.title || ''
  if (test.parent) title = [fullTitle(test.parent), title].filter(Boolean).join(' ')
  return title
}

function pad(n, s) {
  var before = Array(n + 1).join(' ')
  return s.split(/\r\n|\r|\n/)
          .map(function(a){ return before + a })
          .join('\n')
}

function describeFailure(ex) {
  return ['  ---'
         ,'    type: ' + ex.name
         ,'    message: >'
         ,       pad(6, ex.message)
         ,'    stack: | '
         ,       pad(6, ex.stack)
         ,'  ...'
         ,'  '
         ].join('\n')
}

spec.run(function(report) {
  var i = 0;

  report.on('success', function(ev, result) {
    console.log('ok', ++i, fullTitle(result.test))
  })

  report.on('failure', function(ev, result) {
    console.log('not ok', ++i, fullTitle(result.test))
    console.log(describeFailure(result.exception))
  })

  report.on('ignored', function(ev, result) {
    console.log('# ignored:', fullTitle(result.test))
  })

  report.on('done', function(ev, results) {
    console.log('')
    console.log('1..' + i)
    console.log('# tests', i)
    console.log('# pass', results.passed.length)
    console.log('# fail', results.failed.length)
    console.log('# ignored', results.ignored.length)

    if (results.failed.length && typeof process != 'undefined')
      process.exit(1)
  })
})