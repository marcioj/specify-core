# Brofist [![Build Status](https://travis-ci.org/brofistjs/brofist.png)](https://travis-ci.org/brofistjs/brofist)  ![Dependencies Status](https://david-dm.org/brofistjs/brofist.png)

Minimal BDD test runner that plays along nicely with Browserify.


## Example

```js
var spec   = require('brofist')()
var assert = require('assert')

spec('λ compose', function(it) {
  it('compose(f, g)(x) should be the same as f(g(x))', function() {
    assert.strictEqual(f(g(x)), compose(f, g)(x))
  })
})

spec.run(require('brofist-minimal')())
```

Then:

```bash
$ node run test.js
Success. 1/1 tests.
```


## Installing

Just grab it from NPM:

    $ npm install brofist


## Documentation

A quick reference of the API can be built using [Calliope][]:

    $ npm install -g calliope
    $ calliope build

A lengthy, narrated documentation is available [On the wiki][]

[Calliope]: https://github.com/killdream/calliope
[On the wiki]: https://github.com/brofistjs/brofist/wiki


## Tests

On Node:

    $ npm test
    
On the browser:

    $ npm install -g brofist-browser
    $ brofist-browser serve test/specs/index.js
    # Then open the link on any browser


## Platform support

This library assumes an ES5 environment, but can be easily supported in ES3
platforms by the use of shims. Just include [es5-shim][] :3

[![browser support](https://ci.testling.com/brofistjs/brofist.png)](http://ci.testling.com/brofistjs/brofist)

[es5-shim]: https://github.com/kriskowal/es5-shim

## Licence

MIT/X11. ie.: do whatever you want.

