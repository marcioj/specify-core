# Buddy [![Build Status](https://travis-ci.org/buddyjs/buddy.png)](https://travis-ci.org/buddyjs/buddy)  ![Dependencies Status](https://david-dm.org/buddyjs/buddy.png)

Minimal BDD test runner that plays along nicely with Browserify.


## Example

```js
var describe = require('buddy')()
var assert   = require('assert')

describe('λ compose', function(it) {
  it('compose(f, g)(x) should be the same as f(g(x))', function() {
    assert.strictEqual(f(g(x)), compose(f, g)(x))
  })
})

describe.run(function(runner) {
  runner.on('success', function(ev, test) { console.log('[OK]', test.title()) })

  runner.on('failure', function(ev, test) { console.log('[ERROR]', test.title())
                                        console.log(test.exception) })

  runner.on('ignored', function(ev, test){ console.log('[?]', test.title()) })
  
  runner.on('done', function(ev, report) {
    console.log('')
    console.log(report.passed.length, ' tests passed')
    console.log(report.failed.length, ' tests failed')
    console.log(report.ignored.length, ' tests ignored')
    console.log(report.all.length, ' tests ran')
  })
})
```

> B-But I already use Mocha! I don't want to convert all my tests to Buddy, man.

Well, no worries, we've got you covered. As long as you use the BDD interface,
all your tests will mostly Just Work™.

Note that, however, Buddy uses Promises all the way down, so `done` is just a
convenience to fulfill the promise with a value, which can also be achieved by
just returning something that ain't no Promise.


## Installing

Just grab it from NPM:

    $ npm install test-buddy


## Documentation

A quick reference of the API can be built using [Calliope][]:

    $ npm install -g calliope
    $ calliope build


## Tests

On Node:

    $ npm test
    
On the browser:

    $ npm run pretest-browser
    # Then open `test/browser/index.html` in any browser.

## Platform support

This library assumes an ES5 environment, but can be easily supported in ES3
platforms by the use of shims. Just include [es5-shim][] :3

Testling CI tests will fail right now because of
https://github.com/substack/testling/pull/34, but it works in the browser, you
can test it by running the browser test cases.

[![browser support](http://ci.testling.com/buddyjs/buddy.png)](http://ci.testling.com/buddyjs/buddy)


## Licence

MIT/X11. ie.: do whatever you want.

[Calliope]: https://github.com/killdream/calliope
[es5-shim]: https://github.com/kriskowal/es5-shim
