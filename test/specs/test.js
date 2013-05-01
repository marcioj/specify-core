module.exports = function(spec) {
  var chai = require('chai')
  chai.use(require('chai-as-promised'))
  var expect = chai.expect

  var pinky = require('pinky')

  var Test  = require('../../lib/test').Test
  var Suite = require('../../lib/suite').Suite

  return spec('{} Test'
, function(it, spec) {
    spec('init()', function(it) {
      it('Given a Suite, should add the test to that Suite.', function() {
        var s1 = Suite.make()
        var t1 = Test.make(s1)
        // Tests get wrapped, so we unwrap =/
        expect(Object.getPrototypeOf(s1.tests[0])).to.equal(t1)
      })

      it('Given a title, should define that title.', function() {
        var t1 = Test.make(null, 'foo')
        expect(t1.title).to.equal('foo')
      })

      it('Given options, should extend the Test.', function() {
        var t1 = Test.make(null, null, null, { slow: 1
                                             , timeout: 2
                                             , enabled: true })
        expect(t1.slow).to.equal(1)
        expect(t1.timeout).to.equal(2)
        expect(t1.enabled).to.equal(true)
      })
    })

    spec('run()', function(it) {
      it('Should always return a promise.', function() {
        var t1 = Test.make(null, null, function(){ })
        return expect(t1.run().then).to.be.a('function')
      })

      it('Should be fulfilled right away for sync tests.', function() {
        var t1 = Test.make(null, null, function(){ })
        return expect(t1.run()).to.be.fulfilled
      })

      it('For promised tests, should be fulfilled when promise is.', function() {
        var p  = pinky()
        var t1 = Test.make(null, null, function(){ return p })
        setTimeout(p.fulfill.bind(null, 'ok'), 100)

        return p.then(function(v) {
                 expect(v).to.equal('ok')
               })
      })

      it('Should reject if a test throws an exception.', function() {
        var e  = new Error('foo')
        var t1 = Test.make(null, null, function(){ throw e })
        return expect(t1.run())
                 .to.eventually.have.property('exception', e)
      })

      it('Should reject if the promised test is rejected.', function() {
        var e = new Error('foo')
        var p = pinky().reject(e)
        var t1 = Test.make(null, null, function(){ return p })
        return expect(t1.run())
                 .to.eventually.have.property('exception', e)
      })

      it('Should reject if a test takes more time than the timeout.', function() {
        var p = pinky()
        var t1 = Test.make(null, null, function(){ return p }
                          , { timeout: 100 })
        setTimeout(p.fulfill.bind(null, 'ok'), 200)
        return expect(t1.run()).to.eventually.have.property('verdict', 'failure')
      })

      it('Should mark the test as `slow` if it runs for longer than the threshold.', function() {
        var p  = pinky()
        var t1 = Test.make(null, null
                          , function(){ return p }
                          , { slow: 100 })
        setTimeout(p.fulfill, 200)
        return expect(t1.run()).to.eventually.have.property('slow', true)
      })

      it('Should not run the test if it\'s disabled.', function() {
        var t1 = Test.make(null, null, null
                          , { enabled: function() { return false }})
        return expect(t1.run()).to.eventually.have.property('verdict', 'ignored')
      })
    })

    spec('fullTitle(s)', function(it) {
      it('Should return a list of name components.', function() {
        var s1 = Suite.make(null, 'a')
        var s2 = Suite.make(s1, 'b')
        var s3 = Suite.make(s2, 'c')
        var t1 = Test.make(s3, 'd')

        expect(t1.fullTitle()).to.deep.equal(['a', 'b', 'c', 'd'])
      })

      it('Should skip objects with no name.', function() {
        var s1 = Suite.make(null)
        var s2 = Suite.make(s1, 'a')
        var s3 = Suite.make(s2, '')
        var t1 = Test.make(s3, 'b')

        expect(t1.fullTitle()).to.deep.equal(['a', 'b'])
      })
    })

    spec('setEnabled(f)', function(it) {
      it('Should define a new condition for running the test.', function() {
        var t = Test.make()
        t.setEnabled(function(){ return false })

        return expect(t.run()).to.eventually.have.property('verdict', 'ignored')
      })
    })

    spec('setTimeout(n)', function(it) {
      it('Should define a new timeout for running the test.', function() {
        var p = pinky()
        var t = Test.make(null, null, function(){ return p })
        t.setTimeout(100)
        setTimeout(p.fulfill, 200)

        return expect(t.run()).to.eventually.have.property('verdict', 'failure')
      })
    })

    spec('setSlow(n)', function(it) {
      it('Should define a new slow threshold.', function() {
        var p = pinky()
        var t = Test.make(null, null, function(){ return p })
        t.setSlow(100)
        setTimeout(p.fulfill, 200)

        return expect(t.run()).to.eventually.have.property('slow', true)
      })
    })
  })
}