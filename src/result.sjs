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
 * Represents and handles test results.
 *
 * @module hifive/result
 */

// -- Dependencies -----------------------------------------------------
var adt = require('adt-simple')



// -- Duration ---------------------------------------------------------

/**
 * The duration of a particular test.
 *
 * @class
 * @summary
 * { started       : Date
 * , finished      : Date
 * , slowThreshold : &lt;Number/ms&gt;
 * }
 */
data Duration { started       : Date
              , finished      : Date
              , slowThreshold : Number
              } deriving (adt.Base)

/**
 * Whether this duration should be considered slow.
 *
 * @summary @Duration => Void → Boolean
 */
Duration::isSlow = function() {
  return this.time() >= this.slowThreshold;
};

/**
 * The total time of this duration in milliseconds.
 *
 * @summary @Duration => Void → &lt;Number/ms&gt;
 */
Duration::time = function() {
  return this.finished - this.started;
};

/**
 * The textual representation of this duration.
 *
 * @summary @Duration => Void → String
 */
Duration::toString = function() {
  return this.time() + 'ms';
};



// -- LogEntry ---------------------------------------------------------

/**
 * Represents content that has been logged during the execution of a test.
 *
 * @class
 * @summary
 * { date: Date
 * , log:  Array[Any]
 * }
 */
data LogEntry { date : Date
              , log  : Array
              } deriving (adt.Base)



// -- Result -----------------------------------------------------------

/**
 * Represents the results of each test.
 *
 * @class
 * @summary
 * | Success: { title    : Array[String]
 *            , duration : Duration
 *            , log      : Array[LogEntry]
 *            }
 * | Failure: { title     : Array[String]
 *            , exception : Any
 *            , duration  : Duration
 *            , log       : Array[LogEntry]
 *            }
 * | Ignored: { title: Array[String] }
 */
union Result {
  Success { title    : Array
          , duration : Duration
          , log      : Array
          },

  Failure { title     : Array
          , exception : *
          , duration  : Duration
          , log       : Array
          },

  Ignored { title: Array }
} deriving (adt.Base, adt.Cata)

/**
 * Returns the full title of the test that yielded this result, that is, the
 * name of the test preceded by the name of all the Suites it's in.
 *
 * @summary @Result => Void → String
 */
Result::fullTitle = function() {
  return this.title.join(' ');
}

/**
 * Returns the name of the test that yielded this result.
 *
 * @summary @Result => Void → String
 */
Result::name = function() {
  return this.title[this.title.length - 1];
}


// -- Exports ----------------------------------------------------------
module.exports = { Duration : Duration
                 , LogEntry : LogEntry
                 , Result   : Result
                 }
