# Buddy [![Build Status](https://travis-ci.org/killdream/buddy.png)](https://travis-ci.org/killdream/buddy)  ![Dependencies Status](https://david-dm.org/killdream/buddy.png)

Minimal BDD test runner that plays along nicely with Browserify.


## Platform support

This library assumes an ES5 environment, but can be easily supported in ES3
platforms by the use of shims. Just include [es5-shim][] :3

[![browser support](http://ci.testling.com/killdream/buddy.png)](http://ci.testling.com/killdream/buddy)


## Example

```js
var describe = require('buddy')()
var it       = describe.it
var assert   = require('assert')

describe('λ compose', function() {
  it('compose(f, g)(x) should be the same as f(g(x))', function() {
    assert.strictEqual(f(g(x)), compose(f, g)(x))
  })
})
```

> B-But I already use Mocha! I don't want to convert all my tests to Buddy, man.

Well, no worries, we've got you covered*.

\* As long as you use BDD.

Note that, however, Buddy uses Promises all the way down, so `done` is just a
convenience to fulfill the promise with a value, which can also be achieved by
just returning something that ain't no Promise.


## Installing

Just grab it from NPM:

    $ npm install buddy


## Documentation

A quick reference of the API can be built using [Calliope][]:

    $ npm install -g calliope
    $ calliope build


## Licence

MIT/X11. ie.: do whatever you want.

[Calliope]: https://github.com/killdream/calliope
[es5-shim]: https://github.com/kriskowal/es5-shim
