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

var Future  = require('data.future')
var delay   = require('control.async').delay
var alright = require('alright');
var hifive  = require('hifive');
var _       = alright;

module.exports = spec 'Report' {
  spec '.empty()' {
    it 'Should return an empty report.' {
      var report = hifive.Report.empty();
      report.started  should _.haveClass('Date');
      report.finished should _.haveClass('Date');
      report.passed   => [];
      report.failed   => [];
      report.ignored  => [];
    }
  }

  spec '#add(a)' {
    async 'Should update the date.' {
      var r1 = hifive.Report.empty();
      return delay(200).map(function() {
                              var r2 = r1.add(hifive.Result.Ignored([]));
                              return r2.finished > r1.finished
             }) will be _.ok;
    }

    it 'Given a `Success`, should add to .passed.' {
      var r1 = hifive.Report.empty();
      var s1 = Object.create(hifive.Result.Success.prototype)
      var r2 = r1.add(s1)

      r2.passed => [s1];
      r2.failed => [];
      r2.ignored => [];
    }

    it 'Given a `Failure`, should add to .failed.' {
      var r1 = hifive.Report.empty();
      var f1 = Object.create(hifive.Result.Failure.prototype)
      var r2 = r1.add(f1)

      r2.passed => [];
      r2.failed => [f1];
      r2.ignored => [];
    }

    it 'Given an `Ignored`, should add to .ignored.' {
      var r1 = hifive.Report.empty();
      var i1 = Object.create(hifive.Result.Ignored.prototype)
      var r2 = r1.add(i1)

      r2.passed => [];
      r2.failed => [];
      r2.ignored => [i1];
    }
  }

}
