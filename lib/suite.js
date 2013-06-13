// # Module suite
//
// Provides a way of grouping test cases.
//
//
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

// -- Dependencies -----------------------------------------------------
var run      = require('./runner').run
var Test     = require('./test').Test
var pipeline = require('pinky-combinators').pipeline


// -- Helpers ----------------------------------------------------------

// ### K(a)()
//
// The constant function.
//
// :: a -> () -> a
function K(a){ return function() { return a }}


// ### hook(title)
//
// Constructs a Hook object.
//
// A Hook is something that users can attach listeners to, and those can
// be later on ran in the order they were attached (asynchronous hooks
// fully wait for the previous one to finish).
//
// :: String -> Hook
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

// ### {} Suite
//
// Represents a logical group of test cases.
//
// :: Test <| Suite
var Suite = Test.derive({

  // #### init(parent, title)
  //
  // Initialises a Suite instance.
  //
  // :: @Suite => Suite, String -> ()
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


  // #### add(test)
  //
  // Adds a test case to the Suite.
  //
  // :: @Suite => Test -> ()
, add:
  function _add(test) {
    var self = this
    this.tests.push(test.derive({
      run: function(reporter) {
        return pipeline([ self.beforeEach.run
                        , test.run.bind(test, reporter)
                        , self.afterEach.run
                        ]) }}))}


  // #### run(report)
  //
  // Runs all tests in the Suite, sequentially.
  //
  // :: @Suite => Report -> Promise [Result]
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