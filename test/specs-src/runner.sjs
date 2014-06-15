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

var alright = require('alright')
var hifive  = require('hifive')
var Future  = require('data.future')
var fail    = require('control.async').fail;
var Maybe   = require('data.maybe');

var _       = alright;
var Nothing = Maybe.Nothing;
var Just    = Maybe.Just;

var cfg = hifive.Config(100, 100, λ(x) -> true);
var cfgDisabled = hifive.Config(100, 100, λ(x) -> false);

function Test(x) {
  x = x || {};
  return hifive.Test.Case.create({
    name: x.name || '',
    test: x.test || Future.of(),
    timeout: x.timeout || Nothing(),
    slow: x.slow || Nothing(),
    enabled: x.enabled || Nothing()
  });
}
function Suite(x) {
  x = x || {};
  return hifive.Test.Suite.create({
    name: x.name || '',
    tests: x.tests || [],
    beforeAll: x.beforeAll || hifive.Hook([]),
    beforeEach: x.beforeEach || hifive.Hook([]),
    afterAll: x.afterAll || hifive.Hook([]),
    afterEach: x.afterEach || hifive.Hook([])
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
      hifive.makeRunner(cfg, [s2, s3], noop)
            .fork(noop, function(report) {
              report.passed.map(λ[#.fullTitle()]) => ['B a', 'B A a'];
              report.failed.map(λ[#.fullTitle()]) => ['B A c'];
              report.ignored.map(λ[#.fullTitle()]) => ['B A b', 'B b', 'C b'];
            });
    }

    it 'Should pass the stream of things to the reporter.' {
      hifive.makeRunner(cfg, [s2, s3], function(xs) {
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
      hifive.makeRunner(cfg, [s2, s3], function(_, reportStream) {
        reportStream.subscribe(function(report) {
          report.passed.map(λ[#.fullTitle()]) => ['B a', 'B A a'];
          report.failed.map(λ[#.fullTitle()]) => ['B A c'];
          report.ignored.map(λ[#.fullTitle()]) => ['B A b', 'B b', 'C b'];
        })
      }).fork(noop, noop)
    }
  }
}
