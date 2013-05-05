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
var timeout = require('./utils').timeout


//// -- Interfaces -----------------------------------------------------

///// type Verdict
// The verdict of running a test.
//
// :: String ('success' | 'failure' | 'ignored')


///// type Result
// The result of running a test.
//
// :: verdict   :: Verdict      --^ The verdict about the test
// .. started   :: Date         --^ When it started
// .. finished  :: Date         --^ When it finished
// .. exception :: Error        --^ The exception thrown (if any)
// .. slow      :: Boolean      --^ Was it slower than the threshold?
// .. test      :: Test         --^ The test that we ran


///// type TestMeta
// Meta information about a Test.
//
// :: title   :: String             --^ The name of the test
// .. test    :: () -> Promise a    --^ The test code
// .. timeout :: Number             --^ How long to wait for async (ms)
// .. slow    :: Number             --^ What to consider slow (ms)
// .. enabled :: Test -> Boolean    --^ Should we run this at all?


///// type Test
// Represents a single test.
//
// :: Test -: TestMeta
// ..   -- | Yields all the components of the Test's title.
// ..   full-title :: @TestMeta => () -> [String]


///// type Runnable a
// The type of all the things we can run.
//
// :: run :: Reporter, Report -> Promise a


//// -- Results --------------------------------------------------------

///// λ isSlow
// :internal:
// Checks if a test should be considered slow.
//
// :: Test, Date, Date -> Boolean
function isSlow(test, started, finished) {
  return (finished - started) >= test.slow
}

///// λ makeResult
// :internal:
// Constructs an object of the Result type.
//
// :: Test, Date, Date -> Result
function makeResult(test, started, finished) {
  return { started  : started
         , finished : finished
         , slow     : isSlow(test, started, finished)
         , test     : test
         }
}

///// λ success
// :internal:
// Constructs a Result for successful tests.
//
// :: Test, Date, Date -> Result
function success(test, started, finished) {
  return boo.merge( makeResult(test, started, finished)
                  , { verdict: 'success' })

}

///// λ fail
// :internal:
// Constructs a Result for failed tests.
//
// :: Test, Date, Date, Error -> Result
function fail(test, started, finished, error) {
  return boo.merge( makeResult(test, started, finished)
                  , { verdict   : 'failure'
                    , exception : error })
}

///// λ ignore
// :internal:
// Constructs a Result for a test that didn't ran.
//
// :: Test -> Result
function ignore(test) {
  return boo.merge( makeResult(test, new Date, new Date)
                  , { verdict: 'ignored' })
}

//// -- Base test class ------------------------------------------------

///// {} Test
//
// Represents a single test.
//
// :: boo.Base <| Test -: ((Runnable Result) + Test)
var Test = boo.Base.derive({

  ///// -- Interface: TestMeta -----------------------------------------

  ////// data slow
  // The slow threshold for this test.
  // :: Number
  slow: 500

  ////// data timeout
  // The timeout threshold for this test.
  // :: Number
, timeout : 2000

  ////// λ enabled
  // Should we run this test at all?
  // :: Test -> Bool
, enabled:
  function _enabled() {
    return true
  }

  ///// -- Interface: Instantiable -------------------------------------

  ////// λ init
  // Initialises a instance of Test.
  //
  // :: @Test => Suite, String, (() -> Promise a), TestOptions -> ()
, init:
  function _init(suite, title, fn, options) {
    this.parent = suite
    this.title  = title
    this.test   = fn

    boo.extend(this, options || {})
    if (suite)  suite.add(this)
  }

  ///// -- Interface: Test ---------------------------------------------

  ////// λ fullTitle
  // Returns all the components of the fully qualified title for this
  // test.
  //
  // :: () -> [String]
, fullTitle:
  function _fullTitle() {
    var parentTitle = this.parent?     this.fullTitle.call(this.parent)
                    : /* otherwise */  []

    return parentTitle.concat(this.title).filter(Boolean)
  }

, ////// λ enable
  // Enables a test.
  //
  // :: @Test => () -> Test
  enable:
  function _enable() {
    return this.setEnabled(function(){ return true })
  }

, ////// λ disable
  // Disables a test.
  //
  // :: @Test => () -> Test
  disable:
  function _disable() {
    return this.setEnabled(function(){ return false })
  }

  ////// λ setEnabled
  // Sets the enabled property of this test.
  //
  // :: @Test => (Test -> Bool) -> Test
, setEnabled:
  function _setEnabled(f) {
    this.enabled = f
    return this
  }

  ////// λ setTimeout
  // Defines the timeout of this test.
  //
  // :: @Test => Number -> Test
, setTimeout:
  function _setTimeout(n) {
    this.timeout = n
    return this
  }

  ////// λ setSlow
  // Defines the slow threshold for this test.
  //
  // :: @Test => Number -> Test
, setSlow:
  function _setSlow(n) {
    this.slow = n
    return this
  }


  ///// -- Interface: Runnable -----------------------------------------

  ////// λ run
  // Runs the test.
  //
  // :: Reporter, Report -> Promise Result
, run:
  function _run() {
    if (!this.enabled())  return pinky(ignore(this))

    var test  = this
    var start = new Date
    var p     = pinky(undefined)

    return timeout(this.timeout, p.then(this.test))
           .then(ok, failure)

    function ok()       { return success(test, start, new Date) }
    function failure(e) { return fail(test, start, new Date, e) }
  }
})

//// -- Exports --------------------------------------------------------
module.exports = { Test: Test }