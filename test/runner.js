// For old-farts
require('es5-shim')
require('es5-shim/es5-sham')

var spec = require('../')()

require('./specs/test')(spec)
require('./specs/suite')(spec)
require('./specs/runner')(spec)

function log() {
  console.log([].join.call(arguments, ' '))
}

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

log('TAP version 13')
spec.run(function(report) {
  var i = 0;

  report.on('success', function(ev, result) {
    log('ok', ++i, fullTitle(result.test))
  })

  report.on('failure', function(ev, result) {
    log('not ok', ++i, fullTitle(result.test))
    log(describeFailure(result.exception))
  })

  report.on('ignored', function(ev, result) {
    log('# ignored:', fullTitle(result.test))
  })

  report.on('done', function(ev, results) {
    log('')
    log('1..' + i)
    log('# tests', i)
    log('# pass', results.passed.length)
    log('# fail', results.failed.length)
    log('# ignored', results.ignored.length)

    if (results.failed.length && typeof process != 'undefined')
      process.exit(1)
  })
})