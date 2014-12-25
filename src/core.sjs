/**
 * Represents and handles tests.
 *
 * @module specify-core/lib/core
 */


// -- Dependencies -----------------------------------------------------
var Future = require('data.future');
var Maybe  = require('data.maybe');
var rx     = require('rx');
var Async  = require('control.async')(Future);
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
 * | Started:    { value: Test, path: Array[String] }
 * | Finished:   { value: Test, path: Array[String] }
 */
union Signal {
  Started  { value: Test
           , path: Array
           },
  Finished { value: Test
           , path: Array
           },
  TestResult { value: Result }
} deriving (adt.Base, adt.Cata)

/**
 * Returns the full path of a Signal.
 *
 * @summary @Signal => Void → String
 */
Signal::fullTitle = function() {
  return this.path.concat([this.value.name]).join(' ');
}
TestResult::fullTitle = function() {
  return this.value.fullTitle();
}



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
 * @memberof module:specify-core/lib/core~Test
 * @summary [String], Config → Rx.Observable[Error, Signal]
 */
Case::run = function(path, config) {
  var title   = path.concat([this.name]);
  var enabled = (this.enabled <|> Maybe.Just(config.runOnly)).get();

  return enabled(this)?   rx.Observable.fromNodeCallback(toNode <| runTest(this))()
  :      /* otherwise */  rx.Observable.return(TestResult <| Ignored(title))


  function runTest(testCase) {
    return new Future(function(_, resolve) {
      var mSlow          = testCase.slow    <|> Maybe.Just(config.slowThreshold);
      var mTimeout       = testCase.timeout <|> Maybe.Just(config.timeout);
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
  var thisPath = path.concat([this.name])
  
  return rx.Observable.return(Started(this, path))
     +++ this.beforeAll.run()
     +++ this.tests.map(execute.bind(this))
                    .reduce(λ(a, b) -> a +++ b, rx.Observable.empty())
     +++ this.afterAll.run()
     +++ rx.Observable.return(Finished(this, path));

  function execute(test) {
    return this.beforeEach.run()
       +++ (test.isCase? rx.Observable.return(Started(test, thisPath))
                       : rx.Observable.empty())
       +++ test.run(thisPath, config)
       +++ (test.isCase? rx.Observable.return(Finished(test, thisPath))
                       : rx.Observable.empty())
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
