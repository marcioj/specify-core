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
 * Represents and handles tests.
 *
 * @module hifive/core
 */


// -- Dependencies -----------------------------------------------------
var Future = require('data.future');
var Maybe  = require('data.maybe');
var rx     = require('rx');
var Async  = require('control.async');
var Monads = require('control.monads');
var Lambda = require('core.lambda');
var adt    = require('adt-simple');
var result = require('./result')


// -- Aliases ----------------------------------------------------------
var toArray  = Function.call.bind([].slice);
var toNode   = Async.toNode;
var timeout  = Async.timeout;
var choice   = Async.choice
var sequence = Monads.sequence;

var LogEntry = result.LogEntry;
var Duration = result.Duration;
var Result   = result.Result;
var Success  = Result.Success;
var Failure  = Result.Failure;
var Ignored  = Result.Ignored;


// -- Helpers ----------------------------------------------------------

/**
 * Captures things being output in `console.log`.
 *
 * @summary Void → Void → [LogEntry]
 */
function captureLogs() {
  return typeof console == 'undefined'?  noop()
  :      /* otherwise */                 wrapConsole();


  function wrapConsole() {
    var logs = [];
    var old  = console.log;

    console.log = function() {
      logs.push(LogEntry(new Date, toArray(arguments))) };

    return function releaseConsole() {
      console.log = old;
      return logs }}

  function noop() {
    return function releaseConsole() { return [] }}
}


// -- Hooks ------------------------------------------------------------

/**
 * Represents a list of actions.
 *
 * @class
 * @summary
 * { actions: Array[Future[Error, Void]] }
 */
data Hook { actions: Array } deriving (adt.Base)

/**
 * Runs a Hook
 *
 * @summary @Hook => Void → Rx.Observable[Error, α]
 */
Hook::run = function() {
  return rx.Observable.create(function(observer) {
                                sequence(Future, this.actions)
                                  .fork( function(error){
                                           observer.onError(error);
                                           observer.onCompleted() }
                                       , function(){
                                           observer.onCompleted() })
                              }.bind(this))
}


// -- Signals ----------------------------------------------------------

/**
 * Signals we might have mixed with results
 *
 * @class
 * @summary
 * | TestResult: { value: Result }
 * | Started:    { value: Test }
 * | Finished:   { value: Test }
 */
union Signal {
  TestResult { value: Result },
  Started { value: Test },
  Finished { value: Test }
} deriving (adt.Base, adt.Cata)


// -- Tests ------------------------------------------------------------

/**
 * Models each possibility in a test case.
 *
 * @class
 * @summary
 * | Suite: { name       : String
 *          , tests      : Array[Test]
 *          , beforeAll  : Hook
 *          , afterAll   : Hook
 *          , beforeEach : Hook
 *          , afterEach  : Hook
 *          }
 * | Case:  { name    : String
 *          , test    : Future[Error, Void]
 *          , timeout : Maybe[&lt;Number/ms&gt;]
 *          , slow    : Maybe[&lt;Number/ms&gt;]
 *          , enabled : Maybe[Case → Boolean]
 *          }
 */
union Test {
  Suite { name       : String
        , tests      : Array
        , beforeAll  : Hook
        , afterAll   : Hook
        , beforeEach : Hook
        , afterEach  : Hook
        },

  Case { name    : String
       , test    : Future
       , timeout : *
       , slow    : *
       , enabled : *
       }
} deriving (adt.Base, adt.Cata)


/**
 * Runs a Test.
 *
 * @name run
 * @memberof module:hifive/core~Test
 * @summary [String], Config → Rx.Observable[Error, Signal]
 */
Case::run = function(path, config) {
  var title   = path.concat([this.name]);
  var enabled = (this.enabled <|> new Maybe.Just(config.runOnly)).get();

  return enabled(this)?   rx.Observable.fromNodeCallback(toNode <| runTest(this))()
  :      /* otherwise */  rx.Observable.return(TestResult <| Ignored(title))


  function runTest(testCase) {
    return new Future(function(_, resolve) {
      var mSlow          = testCase.slow    <|> new Maybe.Just(config.slowThreshold);
      var mTimeout       = testCase.timeout <|> new Maybe.Just(config.timeout);
      var started        = new Date();
      var releaseConsole = captureLogs();

      choice([timeout(mTimeout.get()), testCase.test]).fork(
        function(error) {
          resolve <| TestResult <| Failure.create({ title     : title
                                                  , exception : error
                                                  , duration  : getDuration()
                                                  , log       : releaseConsole() })}
      , function() {
          resolve <| TestResult <| Success.create({ title    : title
                                                  , duration : getDuration()
                                                  , log      : releaseConsole() })});

      function getDuration() {
        return Duration.create({ started       : started
                               , finished      : new Date()
                               , slowThreshold : mSlow.get() })}})}
};

Suite::run = function(path, config) {
  return this.beforeAll.run()
     +++ this.tests.map(execute.bind(this))
                    .reduce(λ(a, b) -> a +++ b, rx.Observable.empty())
     +++ this.afterAll.run();

  function execute(test) {
    return this.beforeEach.run()
       +++ rx.Observable.return(Started(test))
       +++ test.run(path.concat([this.name]), config)
       +++ rx.Observable.return(Finished(test))
       +++ this.afterEach.run() }
};


// -- Exports ----------------------------------------------------------
module.exports = { Test     : Test
                 , Result   : Result
                 , Duration : Duration
                 , LogEntry : LogEntry
                 , Signal   : Signal
                 , Hook     : Hook
                 , _Future  : Future
                 , _Maybe   : Maybe
                 }
