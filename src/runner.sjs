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
var Signal = require('./core').Signal


// -- Helpers ----------------------------------------------------------

/**
 * Constructs a new report that assimilates the result.
 *
 * @summary Signal → Report → Report
 */
function assimilateResult(report, signal) { return match signal {
  Signal.TestResult(x) => report.add(x),
  Signal.Started(_)    => report,
  Signal.Finished(_)   => report
}}


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
 * Runs a series of test cases.
 *
 * @static
 * @method
 * @summary 
 * Config
 * → [Test]
 * → (Rx.Observable[α, Signal] → Void)
 * → Future[Error, Report]
 */
run = curry(3, run)
function run(config, suites, reporter) { return new Future(function(reject, resolve) {
  var stream = suites.map(λ[#.run([], config)])
                     .reduce(λ[# +++ #], rx.Observable.empty())
                     .publish();

  reporter(stream);
  stream.reduce(assimilateResult, Report.empty())
        .subscribe( function onValue(report){ resolve(report) }
                  , function onError(error) { reject(error) }
                  , function onCompleted() { console.log('-->', arguments) });

  stream.connect();

})}


// -- Exports ----------------------------------------------------------
module.exports = { run             : run
                 , runWithDefaults : run(defaultConfig)
                 , Report          : Report
                 , Config          : Config
                 , defaultConfig   : defaultConfig
                 }
