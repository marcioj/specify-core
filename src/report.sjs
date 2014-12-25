/**
 * Represents and handles reports.
 *
 * @module specify-core/lib/report
 */

// -- Dependencies -----------------------------------------------------
var adt    = require('adt-simple')
var result = require('./result')


// -- Aliases ----------------------------------------------------------
var Success = result.Result.Success
var Failure = result.Result.Failure
var Ignored = result.Result.Ignored


// -- Report -----------------------------------------------------------

/**
 * Summarises the execution of a series of test cases.
 *
 * @class
 * @summary
 * { started  : Date
 * , finished : Date
 * , passed   : Array[Result]
 * , failed   : Array[Result]
 * , ignored  : Array[Result]
 * }
 */
data Report {
  started  : Date,
  finished : Date,
  passed   : Array,
  failed   : Array,
  ignored  : Array
} deriving (adt.Base)


/**
 * Adds a result to a report.
 *
 * @summary @Report => Result → Report
 */
Report::add = function(result){
  var report = this.set({ finished : new Date() });

  return match result {
    Success(_,_,_)   => report.set({ passed:  report.passed  +++ [result] }),
    Failure(_,_,_,_) => report.set({ failed:  report.failed  +++ [result] }),
    Ignored(_)       => report.set({ ignored: report.ignored +++ [result] })
  }
}

/**
 * Constructs a new empty report.
 *
 * @summary @Report => Void → Report
 */
Report.empty = function() {
  return Report.create({ started  : new Date
                       , finished : new Date
                       , passed   : []
                       , failed   : []
                       , ignored  : [] })
                  
}

/**
 * Computes the duration of the report.
 *
 * @summary @Report => Void → &lt;Number/ms&gt;
 */
Report::time = function() {
  return this.finished - this.started
}

/**
 * Returns all tests in this report.
 *
 * @summary @Report => Void → Array[Result]
 */
Report::all = function() {
  return (this.passed +++ this.failed).sort(λ(a,b) -> a.started - b.started)
     +++ this.ignored
}


// -- Exports ----------------------------------------------------------
module.exports = { Report: Report }
