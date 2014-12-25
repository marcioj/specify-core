var alright = require('alright')
var specify  = require('specify-core')
var moment  = require('moment')
var claire  = require('claire')
var flip    = require('core.lambda').flip

var forAll = claire.forAll
var fmap   = claire.transform
var t      = claire.data

var TDuration = t.Int.then(λ(x) -> flip(fmap)(t.Int, λ(y) ->
                  Duration( moment().toDate()
                          , moment().add('ms', x).toDate()
                          , y)))

var TResultTag = claire.choice('Success', 'Failure', 'Ignored')
var TResult    = TResultTag.then(λ(x) -> flip(fmap)(t.Array(t.Str), λ(y) ->
                   makeResult(x, y)))

function makeResult(tag, path) {
  var d = Duration(new Date(), new Date(), 0);
  return tag === 'Success'? Result.Success(path, d, [])
  :      tag === 'Failure'? Result.Failure(path, null, d, [])
  :      /* otherwise */    Result.Ignored(path)
}

var Duration = specify.Duration;
var Result   = specify.Result;

module.exports = spec 'Result' {
  spec 'Duration#isSlow()' {
    it 'Should be true when the duration is greater than the slow threshold.' {
      Duration(moment().toDate(), moment().add('ms', 100).toDate(), 150).isSlow() => false;
      Duration(moment().toDate(), moment().add('ms', 150).toDate(), 150).isSlow() => true;
      Duration(moment().toDate(), moment().add('ms', 200).toDate(), 150).isSlow() => true
    }
  }

  spec 'Duration#time()' {
    it 'Should return the total duration in milliseconds.' {
      forAll(TDuration).satisfy(function(a) {
        return !!(a.time() => a.finished - a.started)
      }).asTest()();
    }
  }

  spec 'Duration#toString()' {
    it 'Should return the total duration (in ms) as a formatted string.' {
      forAll(TDuration).satisfy(function(a) {
        return !!(a.toString() => ((a.finished - a.started) + 'ms'))
      }).asTest()();
    }
  }

  spec 'Result#name()' {
    it 'Should return only the name of the test.' {
      forAll(TResult).satisfy(function(a) {
        return !!(a.name() === a.title[a.title.length - 1])
      }).asTest()()
    }
  }

  spec 'Result#fullTitle()' {
    it 'Should return the full path of the test.' {
      forAll(TResult).satisfy(function(a) {
        return !!(a.fullTitle() === a.title.join(' '))
      }).asTest()()
    }
  }
}
