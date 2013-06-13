// # Module runner
//
// Runs a series of tests.
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

// -- Dependencies -----------------------------------------------------
var signal   = require('shoutout')
var boo      = require('boo')
var pinky    = require('pinky')
var pipeline = require('pinky-combinators').pipeline
var utils    = require('./utils')

var flatten      = utils.flatten
var sequentially = utils.sequentially


// -- Core implementation ----------------------------------------------

// ### {} Report
//
// Represents the result of running a collection of tests.
//
// :: Base <| Report
var Report = boo.Base.derive({

  // #### init()
  //
  // Initialises a Report instance.
  //
  // :: @Report => () -> ()
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


  // #### done()
  //
  // Signals we've finished processing the Report.
  //
  // :: @Report => Report
, done:
  function _done() {
    this.finished = new Date
    this.signals.done(this)

    return this }

  // #### add(result)
  //
  // Adds a test result to the Report.
  //
  // :: @Report => Result -> Report
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

  // #### addFailure(result)
  // :internal:
  // Adds a failure to the Report.
  //
  // :: @Report => Result -> Report
, addFailure:
  function _addFailure(result) {
    this.failed.push(result)
    this.signals.failure(result)

    return this }

  // #### addSuccess(result)
  // :internal:
  // Adds a success to the Report.
  //
  // :: @Report => Result -> Report
, addSuccess:
  function _addSuccess(result) {
    this.passed.push(result)
    this.signals.success(result)

    return this }

  // #### addIgnored(result)
  // :internal:
  // Adds a ignored result to the Report.
  //
  // :: @Report => Result -> Report
, addIgnored:
  function _addIgnored(result) {
    this.ignored.push(result)
    this.signals.ignored(result)

    return this }
})


// ### run(tests, reporter)
//
// Runs a series of test cases.
//
// Optionally we take a reporter, which will be used to bind listeners
// to the eventful reporter. This is used for interfaces that need to
// update frequently to provide feedback for the user.
//
// The `report` argument is used for passing around the top-level
// eventful object when recursing through the nested suites.
//
// :: [Runnable], (Reporter -> ()), Report? -> Promise [Result]
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