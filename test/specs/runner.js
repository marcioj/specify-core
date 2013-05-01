module.exports = function(spec) {
  var chai = require('chai')
  chai.use(require('chai-as-promised'))
  var expect = chai.expect

  var pinky = require('pinky')

  var runner = require('../../lib/runner')
  var run    = runner.run
  var Report = runner.Report

  var Suite = require('../../lib/suite').Suite
  var Test  = require('../../lib/test').Test

  function K(a){ return function(){ return a }}
  function verdict(a){ return a.verdict }
  function map(f){ return function(as) { return as.map(f) }}


  return spec('λ run()'
, function(it, spec) {
    it('Should return a promise of each tests\'s result.', function() {
      var t1 = Test.make(null, null, function() { })
      var t2 = Test.make(null, null, function() { throw new Error })
      var t3 = Test.make(null, null, null, { enabled: function(){ return false }})

      return expect(run([t1, t2, t3]).then(map(verdict))).to.become(['success', 'failure', 'ignored'])
    })

    it('Should take a reporter function.', function() {
      var p = pinky()
      run([], function(report) { report.on('done', p.fulfill) })

      return expect(p).to.be.fulfilled
    })

    spec('the reporter', function(it) {
      it('Should emit `done` when all tests finish.', function() {
        var p = pinky()
        var a = []
        var t1 = Test.make(null, null, function(){ a.push(1) })
        var t2 = Test.make(null, null, function(){ a.push(2) })
        run([t1, t2], function(report){
          report.on('done', function(){ p.fulfill(a) })
        })

        return expect(p).to.become([1, 2])
      })

      it('Should emit `result` when any test is added.', function() {
        var a  = []
        var t1 = Test.make(null, null, function(){ })
        var t2 = Test.make(null, null, function(){ throw new Error })
        var t3 = Test.make(null, null, null, { enabled: function(){ return false }})

        var p2 = run([t1, t2, t3], function(report) {
                   report.on('result', function(ev, r) {
                     a.push(r.verdict)
                   })
                 })

        return expect(p2.then(function(){ return a })).to.become(['success', 'failure', 'ignored'])
      })
    })
  })
}