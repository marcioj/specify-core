module.exports = function(spec) {
  var chai = require('chai')
  var expect = chai.expect

  var Test  = require('../lib/test').Test
  var Suite = require('../lib/suite').Suite

  return spec('{} Test'
, function(it, spec) {
    spec('λ init', function(it) {
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
  })
}