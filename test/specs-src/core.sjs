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

var Future  = require('data.future');
var fail    = require('control.async').fail;
var delay   = require('control.async').delay;
var Maybe   = require('data.maybe');
var alright = require('alright');
var hifive  = require('hifive');
var AssertionError = require('assertion-error');

var _       = alright;
var Nothing = Maybe.Nothing;
var Just    = Maybe.Just;

function noop(){}

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

function toError(x) {
  return new AssertionError( 'Expected ' + divergence.toString()
                           , divergence)
}


module.exports = spec 'Core' {
  spec 'Hook#run()' {
    async 'Should run all attached actions in sequence.' {
      var result = new Future(function(_, resolve){ 
        var ax  = [];
        var add = λ(x) -> new Future(λ(_,f) -> f(x, ax.push(x)));
        hifive.Hook([add(1), add(2), add(3)])
              .run()
              .subscribe(noop, noop, function() {
                                       resolve(ax) })});

      return result will _.equal([1, 2, 3])
    }

    it 'Should stop at the first error.' {
      var ax  = [];
      var add = λ(x) -> x === 1? new Future(λ(f,_) -> f(x, ax.push(x)))
                               : new Future(λ(_,f) -> f(x, ax.push(x)))

      hifive.Hook([add(0), add(1), add(2)])
            .run()
            .subscribe(noop, function(e){ e => 1 });

      ax => [0, 1]
    }
  }

  spec 'Case#run()' {
    it 'If not enabled, should return Observable[Ignored]' {
      var t = Test();
      t.run([], cfgDisabled)
       .subscribe(λ(x) -> x.value.isIgnored => true);
    }
    it 'If explicitly diabled, should return Observable[Ignored]' {
      var t = Test({ enabled: Just(λ[false]) });
      t.run([], cfg)
       .subscribe(λ(x) -> x.value.isIgnored => true);
    }
    it 'If the future resolves, should pass' {
      var t = Test();
      t.run([], cfg)
       .subscribe(λ(x) -> x.value.isSuccess => true);
    }
    it 'If the future fails, should fail' {
      var t = Test({ test: fail() });
      t.run([], cfg)
       .subscribe(λ(x) -> x.value.isFailure => true);
    }
    it 'Should consider the slow threshold in the test' {
      var t = Test({ slow: Just(1) });
      t.run([], cfg)
       .subscribe(λ(x) -> x.value.duration.slowThreshold => 1);
    }
    it 'Should consider the slow threshold of the configuration if not explicit' {
      var t = Test();
      t.run([], cfg)
       .subscribe(λ(x) -> x.value.duration.slowThreshold => 100);
    }
    async 'Should fail if the test takes too long.' {
      return new Future(function(f,g) {
        var t = Test({ test: delay(200) });
        t.run([], cfg)
         .subscribe(λ(x) -> _.ok(x.value.isFailure).fold(λ[f(toError(#))], g))
      })
    }
    async 'Should fail if the test takes too long.'  {
      return new Future(function(f, g) {
        var t = Test({ test: delay(50), timeout: Just(10) });
        t.run([], cfg)
         .subscribe(λ(x) -> _.ok(x.value.isFailure).fold(λ[f(toError(#))], g))
      })
    }
    it 'Should capture all things logged to the console.' {
      var t = Test({ test: new Future(function(_, f) {
        console.log(1, 'a');
        console.log(2);
      })})
      t.run([], cfg)
       .subscribe(function(x) {
         var l = x.value.log;
         l.length => 2;
         l[0].log => [1, 'a'];
         l[1].log => [2];
       })
    }
  }

  spec 'Suite#run()' {
    async 'Should run all things in sequence.' {
      return new Future(function(reject, resolve) {
        var ax = [];
        var t1 = Test({ name: 'a', test: new Future(λ(_,f) -> f(1, ax.push(1))) });
        var t2 = Test({ name: 'b', test: new Future(λ(f,_) -> f(2, ax.push(2))) });
        var t3 = Test({ name: 'c', test: delay(50) });
        var t4 = Test({ name: 'd', test: delay(2000), enabled: Just(λ[false]) });
        var h1 = delay(10).chain(λ(x) -> Future.of(ax.push('h1')));
        var h2 = delay(30).chain(λ(x) -> Future.of(ax.push('h2')));
        var s1 = Suite({ name: 'A'
                       , tests: [t1, t4, t3]
                       , beforeEach: hifive.Hook([h2])
                       , afterEach: hifive.Hook([h1])
                       });
        var s2 = Suite({ name: 'B'
                       , tests: [t1, s1, t2]
                       , beforeAll: hifive.Hook([h1, h2])
                       , afterAll: hifive.Hook([h1, h1])
                       });

        s2.run([], cfg)
          .reduce(function(acc, x) {
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
            _.equal(v
                   ,[['s','B']
                     ,['s','B a'],['rs','B a'],['f','B a']
                     ,['s','B A']
                      ,['s','B A a'],['rs','B A a'],['f','B A a']
                      ,['s','B A d'],['ri','B A d'],['f','B A d']
                      ,['s','B A c'],['rs','B A c'],['f','B A c']
                     ,['f','B A']
                     ,['s','B b'],['rf','B b'],['f','B b']
                    ,['f','B']])
              .fold(reject, function() {
                _.equal( ax
                       , ['h1','h2',1,'h2',1,'h1','h2','h1','h2','h1',2,'h1','h1'])
                 .fold(reject, resolve)
              });
          }, function(e) { reject(e); });
      })
    }
  }
}
