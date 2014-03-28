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

/**
 * Runs a series of tests.
 *
 * @module lib/runner
 */

// -- Dependencies -----------------------------------------------------
var signal   = require('shoutout')
var boo      = require('boo')
var pinky    = require('pinky')
var pipeline = require('pinky-combinators').pipeline
var utils    = require('./utils')
var flatten  = require('prelude-ls').flatten

var sequentially = utils.sequentially


// -- Core implementation ----------------------------------------------

/**
 * Represents the result of running a collection of tests.
 *
 * @class
 * @summary
 *
 * boo.Base <| Report {
 *   passed  : [Result]
 *   failed  : [Result]
 *   ignored : [Result]
 *   all     : [Result]
 *   started : Date
 * }
 */
var Report = boo.Base.derive({

  // -- Events ---------------------------------------------------------
  /**
   * Emitted after all tests have finished running.
   *
   * @event done
   * @memberof module:lib/runner~Report
   * @summary Report
   */

  /**
   * Emitted as soon as we get back a result from running a `Test`.
   *
   * @event result
   * @memberof module:lib/runner~Report
   * @summary Result
   */

  /**
   * Emitted after the report decides that the result is a success.
   *
   * @event success
   * @memberof module:lib/runner~Report
   * @summary Result
   */

  /**
   * Emitted after the report decides that the result is a failure.
   *
   * @event failure
   * @memberof module:lib/runner~Report
   * @summary Result
   */

  /**
   * Emitted after the report decides that the test case was ignored
   * (not ran at all).
   *
   * @event ignored
   * @memberof module:lib/runner~Report
   * @summary Result
   */

  /**
   * Emitted before we run a test.
   *
   * @event test.started
   * @memberof module:lib/runner~Report
   * @summary Test
   */

  /**
   * Emitted after a Test has finished running, regardless of its
   * verdict.
   *
   * It gives you the `Result` of running the test, which includes
   * information about what the verdict of the test was, the exceptions
   * it has thrown, whether it was slow, when it started, when it
   * finished, and so on, and so forth.
   *
   * @event test.finished
   * @memberof module:lib/runner~Report
   * @summary (Result, Test)
   */

  /**
   * Emitted before we run a collection of tests.
   *
   * Suites inherit from `Test`, so you can use the `title` and
   *`fullTitle` properties just fine.
   *
   * @event suite.started
   * @memberof module:lib/runner~Report
   * @summary Suite
   */

  /**
   * Emitted after a collection of tests has finished running.
   *
   * Since test suites are collections of tests, Hi-Five will give you
   *an Array with all the results of the tests under that Suite
   *(directly or indirectly). If you need to compute the overall
   *success/failure/time of the Suite, you'll need to fold over the
   *Result list.
   *
   * For example, if you want to check if all tests passed:
   *
   * ```js
   * report.signals.suite.finished.add(function(results) {
   *   var passed = results.every(function(result){ return
   *                                result.verdict == 'success' })
   *   if (passed)  console.log('All tests passed.')
   *   else         console.log('Some tests failed.')
   * })
   * ```
   *
   * For a real-world example, you can take a look at the [hi-five browser](https://github.com/hifivejs/hifive-browser/blob/master/lib/index.js#L175-L186)
   * code.
   *
   * @event suite.finished
   * @memberof module:lib/runner~Report
   * @summary ([Result], Suite)
   */


  // -- Methods --------------------------------------------------------

  /**
   * Initialises a report instance.
   *
   * @name init
   * @memberof module:lib/runner~Report
   * @method
   * @summary @Report => Void → Void
   */
  init:
  function _init() {
    this.passed  = []
    this.failed  = []
    this.ignored = []
    this.all     = []
    this.started = new Date

    this.signals = { done    : signal()
                   , result  : signal()
                   , success : signal()
                   , failure : signal()
                   , ignored : signal()

                   , test    : { finished : signal()
                               , started  : signal() }

                   , suite   : { finished : signal()
                               , started  : signal() }
                   }

    return this }


  /**
   * Signals we've finished processing the Report.
   *
   * @name done
   * @memberof module:lib/runner~Report
   * @method
   * @summary @Report => Report
   */
, done:
  function _done() {
    this.finished = new Date
    this.signals.done(this)

    return this }


  /**
   * Adds a test result to the Report.
   *
   * @name add
   * @memberof module:lib/runner~Report
   * @method
   * @summary @Report => Result → Report
   */
, add:
  function _add(result) {
    this.all.push(result)

    switch (result.verdict) {
      case 'success': this.addSuccess(result); break
      case 'failure': this.addFailure(result); break
      case 'ignored': this.addIgnored(result); break
    }

    this.signals.result(result)
    return this }


  /**
   * Adds a failure to the Report.
   *
   * @name addFailure
   * @memberof module:lib/runner~Report
   * @method
   * @inner
   * @summary @Report => Result → Report
   */
, addFailure:
  function _addFailure(result) {
    this.failed.push(result)
    this.signals.failure(result)

    return this }


  /**
   * Adds a success to the Report.
   *
   * @name addSuccess
   * @memberof module:lib/runner~Report
   * @method
   * @inner
   * @summary @Report => Result → Report
   */
, addSuccess:
  function _addSuccess(result) {
    this.passed.push(result)
    this.signals.success(result)

    return this }


  /**
   * Adds an ignored result to the Report.
   *
   * @name addIgnored
   * @memberof module:lib/runner~Report
   * @method
   * @inner
   * @summary @Report => Result → Report
   */
, addIgnored:
  function _addIgnored(result) {
    this.ignored.push(result)
    this.signals.ignored(result)

    return this }
})


/**
 * Runs a series of test cases.
 *
 * Optionally we take a reporter, which will be used to bind listeners
 * to the eventful reporter. This is used for interfaces that need to
 * update frequently to provide feedback for the user.
 *
 * The `report` argument is used for passing around the top-level
 * eventful object when recursing through the nested suites.
 *
 * @summary
 * ([Runnable], (Reporter → Void)) → Promise[[Result]]
 * ([Runnable], (Reporter → Void), Report) → Promise[[Result]]
 */
function run(tests, reporter, report) {
  var reportDone
  if (!report) {
    reportDone = true
    report = Report.make(null)
    report.signals.test.finished.add(report.add.bind(report)) }

  if (reporter) reporter(report)

  var promise = sequentially(tests.map(runnerForThing))
  if (reportDone) promise = promise.then(function(results){
                                           report.done()
                                           return report.all })

  return promise


  function runnerForThing(test) {
    return test.tests?      runnerForSuite(test)
    :      /* otherwise */  runnerForTest(test) }


  function runnerForSuite(suite) { return function() {
    report.signals.suite.started(suite)
    return suite.run(report)
                .then(function(xs) {
                        var results = flatten(xs)
                        report.signals.suite.finished(results, suite)
                        return results })}}


  function runnerForTest(test) { return function() {
    report.signals.test.started(test)
    return test.run(reporter)
               .then(function(result) {
                       report.signals.test.finished(result, test)
                       return result })}}
}

// -- Exports ----------------------------------------------------------
module.exports = { run    : run
                 , Report : Report }