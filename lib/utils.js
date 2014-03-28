// Copyright (c) 2013 Quildreen Motta
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
 * Common utilities.
 *
 * (Most of this code should be moved to their own modules given some
 * time, they're just here because it's easy to just put everything here
 * and get a working prototype, then refactor.)
 *
 * @module lib/utils
 */


// -- Dependencies -----------------------------------------------------
var pinky = require('pinky')


// -- Asynchronous stuff -----------------------------------------------

/**
 * Creates a promise that is rejected if not fulfilled within a given
 * timeframe.
 *
 * @summary (Number, Promise[α]) → Promise[α]
 */
function timeout(ms, promise) {
  var err = new Error('Timeout of ' + ms + ' exceeded.')
  var p   = pinky(promise)

  var timer = setTimeout(p.reject.bind(null, err), ms)
  p.always(function(){ clearTimeout(timer) })
  return p }


/**
 * Runs a series of Promise-returning functions sequentially.
 *
 * @summary [α... → Promise[β]] → Promise[β]
 */
function sequentially(fns) {
  if (fns.length == 0)  return pinky([])

  var result  = []
  var promise = pinky()

  next()

  return promise

  function next() {
    var f = fns.shift()
    f().always(function(value) {
                 result.push(value)
                 if (!fns.length)  promise.fulfill(result)
                 else              next() })}}


// -- Exports ----------------------------------------------------------
module.exports = { sequentially : sequentially
                 , timeout      : timeout }