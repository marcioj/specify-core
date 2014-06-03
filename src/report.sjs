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
 * Represents and handles reports.
 *
 * @module hifive/report
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
