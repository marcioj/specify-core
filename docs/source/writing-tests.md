# Writing tests

Writing tests in Hi-Five is simple and straight-forward, regardless of whether
you're dealing with synchronous or asynchronous code.


## Defining tests and test groups

Hi-Five works with the core idea of "test cases as values", but it provides
users with a declarative layer for specifying your behaviours without getting
lost on all these technicalities. By instantiating the library, you get back a
`specification` declarative form:

```js
var spec = require('hifive')()
// This will be the root of your specific test cases.
// If you pass a String to it, it'll use it as a title.
```

From there on, Hi-Five works in a manner similar to other BDD inteface
frameworks, like [Mocha](http://visionmedia.github.io/mocha/). You call the
specification function passing a title, and a function that'll define
tests. The main difference is that Hi-Five won't mess up with your globals,
instead you'll get a reference to the functions to define your tests and
sub-specifications as an argument to your callback:

```js
spec('Array', function(it, subSpec) {
  // `it` will define a new test:
  it('should be a function', function() {
    assert.equal('function', typeof Array)
  })

  // `subSpec` works like `spec`, except it'll be nested in its parent
  subSpec('indexOf()', function(subIt, subSubSpec) {
    ...
  })
})
```

If you work with a language like CoffeeScript or LiveScript, you can also take
advantage of the fact that these functions are available in the `this` context
of the specification callback:

```coffee
# It gets much cleaner!
spec 'Array' ->
  @it 'should be a function ->
    assert.equal 'function', (typeof Array)

  @spec 'indexOf()' ->
    ...
```

## Synchronous tests

Synchronous tests are pretty straight forward, Buddy will work with anything
that can throw an error in case of failures — this means you can bring-your-own
assertion library. Node's assert, Chai, should.js? They all get some love!

```js
var chai   = require('chai')
var expect = chai.expect

spec('Array', function(it) {
  it('Should be a function', function() {
    expect(Array).to.be.a('function')
  })

  it('Given a Number, should return an array of that length.', function() {
    expect(Array(3)).to.have.length(3)
  })

  it('Given one or more values, should return an array with those values.', function() {
    expect(Array(1, 2, 3)).to.deep.equal([1, 2, 3])
  })
})
```

## Asynchronous tests

Hi-Five uses promises for managing asynchronous tests execution (in essence,
this means we treat all tests as asynchronous). If the thing you're testing
already uses [Promises/A+](http://promises-aplus.github.io/promises-spec/), you
just need to return the promise and you're all set:

```js
var chai = require('chai')
chai.use(require('chai-as-promised'))
var expect = chai.expect

spec('request()', function(it) {
  it('Should return the data from the given HTTP endpoint.', function() {
    return expect(request('/foo')).to.become("foo's contents")
    // Note the return here. You return a promise from your test to let
    // Hi-Five wait for the resolution of this promise before moving over
    // to the next one!
  })
})
```

If your thing isn't already using promises, this means you'll have a little bit
more of work, since you'll need to create and return a promise manually. You
can easily do so using [Pinky](https://github.com/killdream/pinky):

```js
var pinky = require('pinky')

spec('delay(n)', function(it) {
  it('Should call the callback after N miliseconds.', function() {
    // You need to create a new Promise
    var promise = pinky()

    var started = new Date
    delay(200, function(){
                 var t = new Date - started
                 // Fulfill or reject it depending on whether your test
                 // passed or failed.
                 if (t > 200)  promise.fulfill()
                 else          promise.reject()
               })

    // And don't forget to return the promise back to Buddy!
    return promise
  })
})
```

Pinky's core library is fairly minimal, but there are plenty of separate
modules providing common combinators, like sequentially, compose, pipeline,
all, lift, etc. If you don't want to use Pinky, it's no biggie, you can use any
Promises/A+ compliant library you're most comfortable with :3


## Sloooow asynchronous tests

By default, Hi-Five will assume that all tests will last no longer than 2
seconds, but it'll warn you if a test runs for longer than half a second (slow
tests are likely to be a problem). You can override these for any particular
test, or override them on the root `Test` object directly (in which case, all
tests will use that value):

```js
spec('request()', function() {
  it('should return the contents of /foo', function() {
    return expect(request('/foo')).to.become("foo's contents")
  }).setTimeout(5000)  // lets it run for no longer than 5 seconds
    .setSlow(2000)     // consider it to be slow if it lasts more than 2s
})
```


## Deciding what gets to be ran

Tests and Suites both get a `enabled` field, which is a function that gets
called to decide if the test/suite should be ran or not. You can easily disable
a particular test or suite by calling the convenience method `disable`:

```js
spec('Array', function(it) {
  it('Should be a function', function() {
    assert.equal('string', typeof Array)
  }).disable()
})

spec.run(require('buddy-minimal')())
// => Success. 0/0 tests. (1 ignored)
```

You can force one test to run by calling the inverse function, `enable`. Or you
can define a more complex rule by changing the `enabled` function to something
else:

```js
Test.enabled = function() {
  return /^foo/.test(this.title)
}

spec('Something', function() {
  it('foo', function(){ /* will be executed */ })
  it('bar', function(){ /* will not be executed */ })
})
```


## Specifying the state for a test

Hi-Five gives you `beforeAll`, `beforeEach`, `afterAll` and `afterEach` hooks,
which can be used to put the application in a particular state before a test,
and clean-up afterwards. These hooks can be either synchronous or asynchronous,
by way of Promises — just like the test cases.

These functions are available on the `this` context of each specification callback:

```js
spec('Validation', function() {
  var data
  this.beforeEach(function() {
    return data = application.load()
  })

  this.afterEach(function() {
    return application.tearDown()
  })

  it('Should validate the user data.', function() {
    expect(data.isValid()).to.be.ok
  })
})
```

## Structuring your tests

Due to the "test cases as values" philosophy in Hi-Five, the best approach to
structure your tests is to separate each high-level specification in a module,
which returns a `Suite` object (this is what you get from a `spec` call, by the
way). For example:

```text
  + /tests
  |--o runner.js
  `--+ /specs
     |--o user.js
     |--o post.js
     `--o validation.js
```

In your files, you just `export` the suites:

```js
// specs/user.js
var spec = require('hifive')()

module.exports = spec('User', function(it, topic) {
  ...
})
```

And in the runner, you define how you want to run these specs:

```js
// runner.js
var buddy = require('hifive')

buddy.run([
  require('./specs/user.js')
, require('./specs/post.js')
, ...
], require('hifive-tap')())
```

One of the advantages are that you can easily support different environments,
which require different configurations, or support a different set of
specs. Another advantage is that it works neatly with **any continuous
integration** that supports plain Node, no special configuration or official
support required!
