module.exports = function(spec) {
  var chai = require('chai')
  chai.use(require('chai-as-promised'))
  var expect = chai.expect

  var pinky = require('pinky')
  var all   = require('pinky-combinators').all

  var Test = require('../lib/test').Test
  var Suite = require('../lib/suite').Suite

  var protoOf = Object.getPrototypeOf

  function K(a){ return function(){ return a }}
  function verdict(a){ return a.verdict }
  function map(f){ return function(as) { return as.map(f) }}

  return spec('{} Suite'
, function(it, spec) {

    spec('init()', function(it) {
      it('Given a Suite, should add itself to that Suite.', function() {
        var s1 = Suite.make()
        var s2 = Suite.make(s1)

        expect(protoOf(s1.tests[0])).to.equal(s2)
      })

      it('Given a title, should define that title.', function() {
        var s1 = Suite.make(null, 'foo')

        expect(s1.title).to.equal('foo')
      })
    })

    spec('add(a)', function(it) {
      it('Should add the test to the suite.', function() {
        var s1 = Suite.make()
        var s2 = Suite.make()
        s1.add(s2)

        expect(protoOf(s1.tests[0])).to.equal(s2)
      })

      it('Should wrap the `run` method to run before/after hooks.', function() {
        var s1 = Suite.make()
        var t1 = Test.make(s1, null, function(){ p3.fulfill() })

        var p1 = pinky(), p2 = pinky(), p3 = pinky()

        s1.beforeEach(function(){ p1.fulfill() })
        s1.afterEach(function(){ p3.then(p2.fulfill) })

        s1.tests[0].run()

        return expect(all([p1, p2, p3])).to.be.fulfilled
      })
    })

    spec('beforeEach(f)', function(it) {
      it('Should add a hook to run before each test.', function() {
        var a  = []
        var s1 = Suite.make()
        var t1 = Test.make(s1, null, function(){ a.push(1) })
        var t2 = Test.make(s1, null, function(){ a.push(2) })

        s1.beforeEach(function(){ a.push(0) })

        return expect(s1.run().then(K(a))).to.become([0, 1, 0, 2])
      })
    })

    spec('afterEach(f)', function(it) {
      it('Should add a hook to run after each test.', function() {
        var a  = []
        var s1 = Suite.make()
        var t1 = Test.make(s1, null, function(){ a.push(1) })
        var t2 = Test.make(s1, null, function(){ a.push(2) })

        s1.afterEach(function(){ a.push(0) })

        return expect(s1.run().then(K(a))).to.become([1, 0, 2, 0])
      })
    })


    spec('beforeAll(f)', function(it) {
      it('Should add a hook to run before all tests.', function() {
        var a  = []
        var s1 = Suite.make()
        var t1 = Test.make(s1, null, function(){ a.push(1) })
        var t2 = Test.make(s1, null, function(){ a.push(2) })

        s1.beforeAll(function(){ a.push(0) })

        return expect(s1.run().then(K(a))).to.become([0, 1, 2])
      })
    })

    spec('afterAll(f)', function(it) {
      it('Should add a hook to run after all tests.', function() {
        var a  = []
        var s1 = Suite.make()
        var t1 = Test.make(s1, null, function(){ a.push(1) })
        var t2 = Test.make(s1, null, function(){ a.push(2) })

        s1.afterAll(function(){ a.push(0) })

        return expect(s1.run().then(K(a))).to.become([1, 2, 0])
      })
    })

    spec('run(report)', function(it) {
      it('Should run all tests sequentially.', function() {
        var a  = []
        var s1 = Suite.make()
        var t1 = Test.make(s1, null, function(){ a.push(1) })
        var t2 = Test.make(s1, null, function(){ a.push(2) })

        return expect(s1.run().then(K(a))).to.become([1, 2])
      })

      it('Should return a promise with the result of each test.', function() {
        var s1 = Suite.make()
        var t1 = Test.make(s1, null, function(){ })
        var t2 = Test.make(s1, null, function(){ throw new Error })

        return expect(s1.run().then(map(verdict))).to.become(['success', 'failure'])
      })
    })
  })
}