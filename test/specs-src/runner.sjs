var alright = require('alright')
var specify  = require('specify-core')
var Future  = require('data.future')
var fail    = Future.rejected;
var Maybe   = require('data.maybe');

var _       = alright;
var Nothing = Maybe.Nothing;
var Just    = Maybe.Just;

var cfg = specify.Config(100, 100, λ(x) -> true);
var cfgDisabled = specify.Config(100, 100, λ(x) -> false);

function Test(x) {
  x = x || {};
  return specify.Test.Case.create({
    name: x.name || '',
    test: x.test || Future.of(),
    timeout: x.timeout || Nothing(),
    slow: x.slow || Nothing(),
    enabled: x.enabled || Nothing()
  });
}
function Suite(x) {
  x = x || {};
  return specify.Test.Suite.create({
    name: x.name || '',
    tests: x.tests || [],
    beforeAll: x.beforeAll || specify.Hook([]),
    beforeEach: x.beforeEach || specify.Hook([]),
    afterAll: x.afterAll || specify.Hook([]),
    afterEach: x.afterEach || specify.Hook([])
  })
}

var t1 = Test({ name: 'a', test: Future.of(1) });
var t2 = Test({ name: 'b', test: Future.of(2), enabled: Just(λ[false]) });
var t3 = Test({ name: 'c', test: fail(3) });
var s1 = Suite({ name: 'A', tests: [t1, t2, t3] });
var s2 = Suite({ name: 'B', tests: [t1, s1, t2] });
var s3 = Suite({ name: 'C', tests: [t2] });

function noop(){}

module.exports = spec 'Runner' {
  spec 'run()' {
    it 'Should return a report with the results of the tests.' {
      specify.makeRunner(cfg, [s2, s3], noop)
            .fork(noop, function(report) {
              report.passed.map(λ[#.fullTitle()]) => ['B a', 'B A a'];
              report.failed.map(λ[#.fullTitle()]) => ['B A c'];
              report.ignored.map(λ[#.fullTitle()]) => ['B A b', 'B b', 'C b'];
            });
    }

    it 'Should pass the stream of things to the reporter.' {
      specify.makeRunner(cfg, [s2, s3], function(xs) {
        xs.reduce(function(acc, x) {
          return x.cata({
            Started: λ(_) -> acc.concat([['s', x.fullTitle()]]),
            Finished: λ(_) -> acc.concat([['f', x.fullTitle()]]),
            TestResult: λ(x) -> x.cata({
              Success: λ(_) -> acc.concat([['rs', x.fullTitle()]]),
              Failure: λ(_) -> acc.concat([['rf', x.fullTitle()]]),
              Ignored: λ(_) -> acc.concat([['ri', x.fullTitle()]])
            })
          })
        }, []).subscribe(function(v) {
          v => [['s', 'B']
                 ,['s', 'B a'], ['rs', 'B a'], ['f', 'B a']
                 ,['s', 'B A']
                  ,['s', 'B A a'], ['rs', 'B A a'], ['f', 'B A a']
                  ,['s', 'B A b'], ['ri', 'B A b'], ['f', 'B A b']
                  ,['s', 'B A c'], ['rf', 'B A c'], ['f', 'B A c']
                 ,['f', 'B A']
                 ,['s', 'B b'], ['ri', 'B b'], ['f', 'B b']
                ,['f', 'B']
                ,['s', 'C']
                 ,['s', 'C b'], ['ri', 'C b'], ['f', 'C b']
                ,['f', 'C']]
        })}).fork(noop, noop)
    }

    it 'Should pass the report to the reporter.' {
      specify.makeRunner(cfg, [s2, s3], function(_, reportStream) {
        reportStream.subscribe(function(report) {
          report.passed.map(λ[#.fullTitle()]) => ['B a', 'B A a'];
          report.failed.map(λ[#.fullTitle()]) => ['B A c'];
          report.ignored.map(λ[#.fullTitle()]) => ['B A b', 'B b', 'C b'];
        })
      }).fork(noop, noop)
    }
  }
}
