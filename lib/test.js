/// Module test
//
// Represents a single test.
//
//
// Copyright (c) 2013 Quildreen Motta
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation files
// (the "Software"), to deal in the Software without restriction,
// including without limitation the rights to use, copy, modify, merge,
// publish, distribute, sublicense, and/or sell copies of the Software,
// and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//

//// -- Dependencies ---------------------------------------------------
var boo   = require('boo')
var pinky = require('pinky')
var any   = require('pinky-combinators').any

//// -- Helpers --------------------------------------------------------

// :: Number, Promise a -> Promise a
function timeout(ms, promise) {
  var err = new Error('Timeout of ' + ms + ' exceeded.')
  var p   = pinky(promise)

  setTimeout(p.reject.bind(null, err), ms)
  return p
}

//// -- Results --------------------------------------------------------

function isSlow(test, started, finished) {
  return (finished - started) >= test.slow
}

function makeResult(test, started, finished) {
  return { started  : started
         , finished : finished
         , slow     : isSlow(test, started, finished)
         , test     : test
         }
}

function success(test, started, finished) {
  return boo.merge( makeResult(test, started, finished)
                  , { verdict: 'success' })

}

function fail(test, started, finished, error) {
  return boo.merge( makeResult(test, started, finished)
                  , { verdict   : 'failure'
                    , exception : error })
}

function ignore(test) {
  return boo.merge( makeResult(test, new Date, new Date)
                  , { verdict: 'ignored' })
}

//// -- Base test class ------------------------------------------------
var Test = boo.Base.derive({
  slow    : 1000
, timeout : 10000

, init:
  function _init(suite, title, fn, options) {
    this.parent = suite
    this.title  = title
    this.test   = fn

    boo.extend(this, options || {})
    if (suite)  suite.add(this)
  }

, enabled:
  function _enabled() {
    return true
  }

, run:
  function _run() {
    if (!this.enabled())  return pinky(ignore(this))

    var test  = this
    var start = new Date
    var p     = pinky(undefined)
    var fn    = this.test.bind(null, p.fulfill)

    return timeout(this.timeout, p.then(fn))
           .then(ok, failure)

    function ok()       { return success(test, start, new Date) }
    function failure(e) { return fail(test, start, new Date, e) }
  }
})

//// -- Exports --------------------------------------------------------
module.exports = Test