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


/**
 * Provides a representation of a single test.
 *
 * @module lib/test
 */

// -- Dependencies -----------------------------------------------------
var boo     = require('boo')
var pinky   = require('pinky')
var timeout = require('./utils').timeout


// -- Aliases ----------------------------------------------------------
var toArray = Function.call.bind([].slice)


// -- Interfaces -------------------------------------------------------

/**
 * The verdict of running a test.
 *
 * @name Verdict
 * @memberof module:lib/test
 * @kind typedef
 * @summary 'success' | 'failure' | 'ignored'
 */


/**
 * Represents things logged while running a test.
 *
 * @name LogEntry
 * @memberof module:lib/test
 * @kind typedef
 * @summary
 *
 * { date: Date       --^ When the entry was created
 * , data: [Any]      --^ Whatever was logged
 * }
 */


/**
 * The result of running a test.
 *
 * @name Result
 * @memberof module:lib/test
 * @kind typedef
 * @summary
 *
 * { verdict   : Verdict      --^ The verdict about the test
 * , started   : Date         --^ When it started
 * , finished  : Date         --^ When it finished
 * , exception : Error        --^ The exception thrown (if any)
 * , slow      : Boolean      --^ Was it slower than the threshold?
 * , test      : Test         --^ The test that we ran
 * , log       : [LogEntry]   --^ All information logged on console.log
 * }
 */


/**
 * Meta information about a test.
 *
 * @name TestMeta
 * @memberof module:lib/test
 * @kind typedef
 * @summary
 *
 * { title   : String             --^ The name of the test
 * , test    : Void -> Promise[α] --^ The test code
 * , timeout : Number             --^ How long to wait for async (ms)
 * , slow    : Number             --^ What to consider slow (ms)
 * , enabled : Test -> Boolean    --^ Should we run this at all?
 * }
 */


/**
 * Represents a single test
 *
 * @name Test
 * @memberof module:lib/test
 * @kind typedef
 * @summary
 *
 * Test < TestMeta {
 *   -- | Yields all the components of the Test's title.
 *   fullTitle : @TestMeta => Void -> [String]
 * }
 */


/**
 * The type of all things we can run.
 *
 * @name Runnable
 * @memberof module:lib/test
 * @kind typedef
 * @summary
 *
 * { run : (Reporter, Report) -> Promise[α] }
 */


// -- Results ----------------------------------------------------------

/**
 * Checks if a test should be considered slow.
 *
 * @summary (Test, started:Date, finished:Date) → Boolean
 */
function isSlow(test, started, finished) {
  return (finished - started) >= test.slow }


/**
 * Constructs an object of the Result type.
 *
 * @summary (Test, started:Date, finished:Date) → Result
 */
function makeResult(test, started, finished, logs) {
  return { started  : started
         , finished : finished
         , slow     : isSlow(test, started, finished)
         , test     : test
         , logs     : logs.slice()
         }}


/**
 * Constructs a result for successful tests.
 *
 * @summary (Test, started:Date, finished:Date, [LogEntry]) → Result
 */
function success(test, started, finished, logs) {
  return boo.merge( makeResult(test, started, finished, logs)
                  , { verdict: 'success' })}


/**
 * Constructs a result for failed tests.
 *
 * @summary (Test, started:Date, finished:Date, [LogEntry], Error) → Result
 */
function fail(test, started, finished, logs, error) {
  return boo.merge( makeResult(test, started, finished, logs)
                  , { verdict   : 'failure'
                    , exception : error })}


/**
 * Constructs a result for a test that didn't run.
 *
 * @summary Test → Result
 */
function ignore(test) {
  return boo.merge( makeResult(test, new Date, new Date, [])
                  , { verdict: 'ignored' })}


/**
 * Constructs a log entry for something being logged.
 *
 * Log contents are not restricted to just textual data, but their
 * output representation depends exclusively on the reporter being used
 * to display the test results.
 *
 * @summary Any... → LogEntry
 */
function makeLogEntry() {
  return { date: new Date
         , data: toArray(arguments) }}


/**
 * Captures things being output in `console.log`.
 *
 * @summary Void → Void → [LogEntry]
 */
function captureLogs() {
  return typeof console == 'undefined'?  noop()
  :      /* otherwise */                 wrapConsole()


  function wrapConsole() {
    var logs = []
    var old  = console.log

    console.log = function() {
      logs.push(makeLogEntry.apply(null, arguments)) }

    return function releaseConsole() {
      console.log = old
      return logs }}

  function noop() {
    return function releaseConsole() { return [] }}}



// -- Base test class --------------------------------------------------

/**
 * Represents a single test.
 *
 * @class
 * @summary
 *
 * boo.Base <| Test
 * implements: (Runnable Result), Test {
 *    parent  : Suite | Void
 *    title   : String
 *    test    : Void → Promise[α]
 *    slow    : Number
 *    timeout : Number
 * }
 */
var Test = boo.Base.derive({

  // ---- Interface: TestMeta ------------------------------------------

  /**
   * The slow threshold for this test.
   *
   * @memberof module:lib/test~Test
   * @name slow
   * @kind member
   * @summary Number
   */
  slow: 500

  /**
   * The timeout threshold for this test.
   *
   * @memberof module:lib/test~Test
   * @name timeout
   * @kind member
   * @summary Number
   */
, timeout : 2000

  /**
   * Should we run this test at all?
   *
   * @memberof module:lib/test~Test
   * @name enabled
   * @kind function
   * @summary Test → Boolean
   */
, enabled:
  function _enabled() {
    return true }


  // ---- Interface: Instantiable --------------------------------------

  /**
   * Initialises a new instance of `Test`.
   *
   * This is called automatically when `Test.make()` is invoked.
   *
   * @memberof module:lib/test~Test
   * @name init
   * @kind function
   * @summary @Test => (Suite, String, (Void → Promise[α]), TestOptions) → Void
   */
, init:
  function _init(suite, title, fn, options) {
    this.parent = suite
    this.title  = title
    this.test   = fn

    boo.extend(this, options || {})
    if (suite)  suite.add(this) }


  // ---- Interface: Test ----------------------------------------------

  /**
   * Returns all the components of the fully qualified title for this
   * test.
   *
   * @memberof module:lib/test~Test
   * @name fullTitle
   * @kind function
   * @summary @Test => Void → [String]
   */
, fullTitle:
  function _fullTitle() {
    var parentTitle = this.parent?     this.fullTitle.call(this.parent)
                    : /* otherwise */  []

    return parentTitle.concat(this.title).filter(Boolean) }


  /**
   * Enables a test.
   *
   * @memberof module:lib/test~Test
   * @name enable
   * @kind function
   * @summary @Test => Void → Test
   */
, enable:
  function _enable() {
    return this.setEnabled(function(){ return true }) }


  /**
   * Disables a test.
   *
   * @memberof module:lib/test~Test
   * @name disable
   * @kind function
   * @summary @Test => Void → Test
   */
, disable:
  function _disable() {
    return this.setEnabled(function(){ return false }) }


  /**
   * Sets the enabled property of this test.
   *
   * @memberof module:lib/test~Test
   * @name setEnabled
   * @kind function
   * @summary @Test => (Test → Bool) → Test
   */
, setEnabled:
  function _setEnabled(f) {
    this.enabled = f
    return this }


  /**
   * Defines the `timeout` for this test.
   *
   * @memberof module:lib/test~Test
   * @name setTimeout
   * @kind function
   * @summary @Test => Number → Test
   */
, setTimeout:
  function _setTimeout(n) {
    this.timeout = n
    return this }


  /**
   * Defines the slow treshold for this test.
   *
   * @memberof module:lib/test~Test
   * @name setSlow
   * @kind function
   * @summary @Test => Number → Test
   */
, setSlow:
  function _setSlow(n) {
    this.slow = n
    return this }


  // ---- Interface: Runnable ------------------------------------------

  /**
   * Runs the test.
   *
   * @memberof module:lib/test~Test
   * @name run
   * @kind function
   * @summary @Test => (Reporter, Report) → Promise[Result]
   */
, run:
  function _run() {
    if (!this.enabled())  return pinky(ignore(this))

    var test    = this
    var start   = new Date
    var p       = pinky(undefined)
    var release = captureLogs()

    return timeout(this.timeout, p.then(this.test))
           .then(ok, failure)


    function ok()       { return success(test, start, new Date, release()) }
    function failure(e) { return fail(test, start, new Date, release(), e) }}
})


// -- Exports ----------------------------------------------------------
module.exports = { Test: Test }