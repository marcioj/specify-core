// Copyright (c) 2013-2014 Quildreen Motta <quildreen@gmail.com>
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
 * Runs tests.
 *
 * @module hifive/runner
 */

// -- Dependencies -----------------------------------------------------
var Future = require('data.future');
var rx     = require('rx');
var adt    = require('adt-simple');
var curry  = require('core.lambda').curry;
var Report = require('./report').Report


// -- Helpers ----------------------------------------------------------

/**
 * Constructs a new report that assimilates the result.
 *
 * @summary Signal → Report → Report
 */
function assimilateResult(report, signal) {
  return signal.isTestResult?  report.add(signal.value)
  :                            report
}


// -- Configuration ----------------------------------------------------

/**
 * Represents the configuration for executing a series of tests.
 *
 * @class
 * @summary
 * { slowThreshold : &lt;Number/ms&gt;
 * , timeout       : &lt;Number/ms&gt;
 * , runOnly       : Case → Boolean
 * }
 */
data Config {
  slowThreshold : Number,
  timeout       : Number,
  runOnly       : Function
} deriving (adt.Base)

/**
 * The default configuration for running tests.
 *
 * @static
 * @summary Config
 */
var defaultConfig = Config.create({
  slowThreshold : 300,
  timeout       : 2000,
  runOnly       : function(){ return true }
})



// -- Core functionality -----------------------------------------------

/**
 * Constructs a task for running all tests.
 *
 * @static
 * @method
 * @summary 
 * Config
 * → [Test]
 * → (Rx.Observable[α, Signal], Rx.Observable[α, Report] → Void)
 * → Future[Error, Report]
 */
makeRunner = curry(3, makeRunner)
function makeRunner(config, suites, reporter) { return new Future(function(reject, resolve) {
  var stream = suites.map(λ[#.run([], config)])
                     .reduce(λ[# +++ #], rx.Observable.empty())
                     .publish();
  var reportStream = stream.reduce(assimilateResult, Report.empty());
  
  reporter(stream, reportStream);
  reportStream.subscribe( function onValue(report){ resolve(report) }
                        , function onError(error) { reject(error) }
                        , function onCompleted() { });

  stream.connect();
})}

/**
 * Runs a series of test cases.
 *
 * @static
 * @method
 * @summary
 * Config → [Test] → (Rx.Observable[α, Signal], Rx.Observable[α, Report] → Void) → Void
 */
run = curry(3, run)
function run(config, suites, reporter) {
  makeRunner(config, suites, reporter).fork(
    function(e){ throw e }
  , function(report) {
      if (report.failed.length)  exit(1)
      if (!report.all().length)  exit(1)
      else                       exit(0)
  })

  function exit(status) {
    if (typeof process != 'undefined' && process.exit)  process.exit(status) }
}
 

// -- Exports ----------------------------------------------------------
module.exports = { run             : run
                 , runWithDefaults : run(defaultConfig)
                 , makeRunner      : makeRunner
                 , Config          : Config
                 , defaultConfig   : defaultConfig
                 }
