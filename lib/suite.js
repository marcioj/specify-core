/// Module suite
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
//

var boo = require('boo')
var run = require('./runner').run
var pipeline = require('pinky-combinators').pipeline

function K(a){ return function() { return a }}

function hook(title) {
  var fns = []

  function add(fun) {
    fns.push(fun) }

  function run(value) {
    return pipeline(fns.concat([K(value)])) }

  add.run = run

  return add
}

var Suite = boo.Base.derive({
  init:
  function _init(parent, title) {
    this.parent     = parent
    this.title      = title
    this.tests      = []
    this.beforeAll  = hook('Before All')
    this.beforeEach = hook('Before Each')
    this.afterAll   = hook('After All')
    this.afterEach  = hook('After Each')

    if (parent)  parent.add(this)
  }

, add:
  function _add(test) {
    var self = this
    this.tests.push(test.derive({
      run: function(reporter) {
        return pipeline([ self.beforeEach.run
                        , test.run.bind(test, reporter)
                        , self.afterEach.run
                        ])
      }}))
  }

, run:
  function _run(test, reporter) {
    return pipeline([ self.beforeAll.run
                    , run(this.tests, reporter)
                    , self.afterAll.run
                    ])
  }
})

module.exports = Suite