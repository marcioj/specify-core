# Buddy [![Build Status](https://travis-ci.org/buddyjs/buddy.png)](https://travis-ci.org/buddyjs/buddy)  ![Dependencies Status](https://david-dm.org/buddyjs/buddy.png)

Minimal BDD test runner that plays along nicely with Browserify.


## Example

```js
var spec   = require('buddy')()
var assert = require('assert')

spec('λ compose', function(it) {
  it('compose(f, g)(x) should be the same as f(g(x))', function() {
    assert.strictEqual(f(g(x)), compose(f, g)(x))
  })
})

spec.run(require('buddy-minimal')())
```

Then:

```bash
$ node run test.js
Success. 1/1 tests.
```


## Installing

Just grab it from NPM:

    $ npm install test-buddy


## Documentation

A quick reference of the API can be built using [Calliope][]:

    $ npm install -g calliope
    $ calliope build

A lengthy, narrated documentation is available [On the wiki][]

[Calliope]: https://github.com/killdream/calliope
[On the wiki]: https://github.com/buddyjs/buddy/wiki


## Tests

On Node:

    $ npm test
    
On the browser:

    $ npm run test-browser
    # Then open the link on any browser


## Platform support

This library assumes an ES5 environment, but can be easily supported in ES3
platforms by the use of shims. Just include [es5-shim][] :3

Testling CI tests will fail right now because of
https://github.com/substack/testling/pull/34, but it works in the browser, you
can test it by running the browser test cases.

[![browser support](http://ci.testling.com/buddyjs/buddy.png)](http://ci.testling.com/buddyjs/buddy)

[es5-shim]: https://github.com/kriskowal/es5-shim

## Licence

MIT/X11. ie.: do whatever you want.

