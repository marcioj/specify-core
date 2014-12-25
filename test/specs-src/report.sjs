var Future  = require('data.future')
var delay   = require('control.async').delay
var alright = require('alright');
var specify  = require('specify-core');
var _       = alright;

module.exports = spec 'Report' {
  spec '.empty()' {
    it 'Should return an empty report.' {
      var report = specify.Report.empty();
      report.started  should _.haveClass('Date');
      report.finished should _.haveClass('Date');
      report.passed   => [];
      report.failed   => [];
      report.ignored  => [];
    }
  }

  spec '#add(a)' {
    async 'Should update the date.' {
      var r1 = specify.Report.empty();
      return delay(200).map(function() {
                              var r2 = r1.add(specify.Result.Ignored([]));
                              return r2.finished > r1.finished
             }) will be _.ok;
    }

    it 'Given a `Success`, should add to .passed.' {
      var r1 = specify.Report.empty();
      var s1 = Object.create(specify.Result.Success.prototype);
      var r2 = r1.add(s1);

      r2.passed => [s1];
      r2.failed => [];
      r2.ignored => [];
    }

    it 'Given a `Failure`, should add to .failed.' {
      var r1 = specify.Report.empty();
      var f1 = Object.create(specify.Result.Failure.prototype);
      var r2 = r1.add(f1);

      r2.passed => [];
      r2.failed => [f1];
      r2.ignored => [];
    }

    it 'Given an `Ignored`, should add to .ignored.' {
      var r1 = specify.Report.empty();
      var i1 = Object.create(specify.Result.Ignored.prototype);
      var r2 = r1.add(i1);

      r2.passed => [];
      r2.failed => [];
      r2.ignored => [i1];
    }
  }

}
