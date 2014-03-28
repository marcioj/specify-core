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
 * Provides a way of grouping test cases.
 *
 * @module lib/suite
 */


// -- Dependencies -----------------------------------------------------
var run      = require('./runner').run
var Test     = require('./test').Test
var pipeline = require('pinky-combinators').pipeline


/**
 * A `Hook` is something that users can attach listeners to, and those
 * can be later on ran in the order they were attached. Asynchronous
 * Hooks must return Promises, in order to delay the execution of
 * subsequent Hooks.
 *
 * @name Hook
 * @memberof module:lib/suite
 * @kind typedef
 * @summary
 *
 * (Void → Promise[α]) → Hook,  :: destructive
 * <| { run :: α → Promise[α] }
 */

// -- Helpers ----------------------------------------------------------

/**
 * The constant function.
 *
 * @summary α → β → α
 */
function K(a){ return function() { return a }}


/**
 * Constructs a Hook object.
 *
 * @summary String → Hook
 */
function hook(title) {
  var fns = []

  function add(fun) {
    fns.push(fun)
    return add }

  function run(value) {
    return pipeline(fns.concat([K(value)])) }

  add.run = run

  return add }


// -- Core implementation ----------------------------------------------

/**
 * Represents a logical group of test cases.
 *
 * @class
 * @summary
 *
 * Test <| Suite {
 *   parent     : Suite | Void
 *   title      : String
 *   tests      : [Test]
 *   beforeAll  : Hook
 *   beforeEach : Hook
 *   afterAll   : Hook
 *   afterEach  : Hook
 * }
 */
var Suite = Test.derive({

  /**
   * Initialises a Suite instance.
   *
   * @name init
   * @memberof module:lib/suite~Suite
   * @method
   * @summary @Suite => (Suite, String) → Void
   */
  init:
  function _init(parent, title) {
    this.parent     = parent
    this.title      = title
    this.tests      = []
    this.beforeAll  = hook('Before All')
    this.beforeEach = hook('Before Each')
    this.afterAll   = hook('After All')
    this.afterEach  = hook('After Each')

    if (parent)  parent.add(this) }


  /**
   * Adds a test case to the Suite.
   *
   * @name add
   * @memberof module:lib/suite~Suite
   * @method
   * @summary @Suite => Test → Void
   */
, add:
  function _add(test) {
    var self = this
    this.tests.push(test.derive({
      run: function(reporter) {
        return pipeline([ self.beforeEach.run
                        , test.run.bind(test, reporter)
                        , self.afterEach.run
                        ]) }}))}


  /**
   * Runs all tests in the Suite, sequentially.
   *
   * @name run
   * @memberof module:lib/suite~Suite
   * @method
   * @summary @Suite => Report → Promise[Result]
   */
, run:
  function _run(report) {
    return pipeline([ this.beforeAll.run
                    , run.bind(null, this.tests, null, report)
                    , this.afterAll.run
                    ])}
})


// -- Exports ----------------------------------------------------------
module.exports = { Suite : Suite
                 , hook  : hook }