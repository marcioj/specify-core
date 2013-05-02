/// Module runner
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

//// -- Dependencies ---------------------------------------------------
var Eventful = require('ekho').Eventful
var pinky = require('pinky')
var pipeline = require('pinky-combinators').pipeline


//// -- Core implementation --------------------------------------------

///// {} Report
//
// Represents the result of running a collection of tests.
//
// :: Eventful <| Report
var Report = Eventful.derive({

  ////// λ init
  //
  // Initialises a Report instance.
  //
  // :: @Report => Eventful -> ()
  init:
  function _init(parent) {
    Eventful.init.call(this, parent)

    this.passed  = []
    this.failed  = []
    this.ignored = []
    this.all     = []
    this.started = new Date

    return this
  }

  ////// λ done
  //
  // Signals we've finished processing the Report.
  //
  // :: @Report => Report
, done:
  function _done() {
    this.finished = new Date
    this.trigger('done', this)

    return this
  }

  ////// λ add
  //
  // Adds a test result to the Report.
  //
  // :: @Report => Result -> Report
, add:
  function _add(result) {
    this.all.push(result)
    this.trigger('result', result)

    var verdict = result.verdict
    return verdict == 'success'?  this.addSuccess(result)
    :      verdict == 'failure'?  this.addFailure(result)
    :      verdict == 'ignored'?  this.addIgnored(result)
    :      /* otherwise */        this
  }

  ////// λ addFailure
  // :internal:
  // Adds a failure to the Report.
  //
  // :: @Report => Result -> Report
, addFailure:
  function _addFailure(result) {
    this.failed.push(result)
    this.trigger('failure', result)

    return this
  }

  ////// λ addSuccess
  // :internal:
  // Adds a success to the Report.
  //
  // :: @Report => Result -> Report
, addSuccess:
  function _addSuccess(result) {
    this.passed.push(result)
    this.trigger('success', result)

    return this
  }

  ////// λ addIgnored
  // :internal:
  // Adds a ignored result to the Report.
  //
  // :: @Report => Result -> Report
, addIgnored:
  function _addIgnored(result) {
    this.ignored.push(result)
    this.trigger('ignored', result)

    return this
  }
})

///// λ sequentially
//
// Runs a series of promise-returning functions sequentially.
//
// :: [a... -> Promise b] -> Promise [b]
function sequentially(fns) {
  if (fns.length == 0)  return pinky([])

  var result  = []
  var promise = pinky()

  next()

  return promise

  function next() {
    var f = fns.shift()
    f().always(function(value) {
      result.push(value)
      if (!fns.length)  promise.fulfill()
      else              next()
    })
  }
}


///// λ run
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
    report.on('test:finished', function(ev, result) {
      report.add(result)
    })
  }
  if (reporter) reporter(report)

  var promise = sequentially(tests.map(runnerForThing))
  if (reportDone) promise = promise.then(function(results){
                              report.done()
                              return report.all
                            })

  return promise

  function runnerForThing(test) {
    return test.tests?      runnerForSuite(test)
    :      /* otherwise */  runnerForTest(test)
  }

  function runnerForSuite(suite) { return function() {
    report.trigger('suite:started', suite)
    return suite.run(report)
                .then(function(result) {
                        report.trigger('suite:finished', result, suite)
                        return result
                      })
  }}

  function runnerForTest(test) { return function() {
    report.trigger('test:started', test)
    return test.run(reporter)
           .then(function(result) {
             report.trigger('test:finished', result, test)
             return result
           })
 }}
}

//// -- Exports --------------------------------------------------------
module.exports = { run: run
                 , Report: Report }