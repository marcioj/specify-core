Hi-Five
=======

[![Build Status](https://travis-ci.org/hifivejs/hifive.png)](https://travis-ci.org/hifivejs/hifive)
[![Dependencies Status](https://david-dm.org/hifivejs/hifive.png)](https://david-dm.org/hifivejs/hifive.png)
[![NPM version](https://badge.fury.io/js/hifive.png)](http://badge.fury.io/js/hifive)
[![unstable](http://hughsk.github.io/stability-badges/dist/unstable.svg)](http://github.com/hughsk/stability-badges)

[![browser support](http://ci.testling.com/hifivejs/hifive.png)](http://ci.testling.com/hifivejs/hifive)

Minimal BDD test runner that plays along nicely with Browserify.


## Philosophy

  - **Not-A-Framework**: Hi-five should let you, the programmer, lead the way
    and define how testing should be done. Bring your own reporters & assertion
    libraries.

  - **Run anywhere**: Hi-five should run in any JS VM that supports at least
    the ECMAScript 3 specification.

  - **Easy to integrate**: Hi-five should be easy to integrate with any CI or
    other system.

  - **Support async**: Hi-five should support asynchronous tests as
    first-class.


## Example

```js
var spec   = require('hifive')()
var assert = require('assert')

spec('λ compose', function(it) {
  it('compose(f, g)(x) should be the same as f(g(x))', function() {
    assert.strictEqual(f(g(x)), compose(f, g)(x))
  })
})

spec.run(require('hifive-minimal')())
```

Then:

```bash
$ node run test.js
Success. 1/1 tests.
```


## Installing

The easiest way is to grab it from NPM (if you're in the Browser, use [Browserify][]):

    $ npm install hifive
    
If you don't want to use NPM and/or Browserify, you'll need to compile the
library yourself. You'll need [Git][], [Make][] and [Node.js][]:

    $ git clone git://github.com/hifivejs/hifive.git
    $ cd hifive
    $ npm install
    $ make bundle
    
And use the `dist/hifive.umd.js` file without a module system, or with an
AMD module system like Require.js.
    
[Browserify]: http://browserify.org/
[Git]: http://git-scm.com/
[Make]: http://www.gnu.org/software/make/
[Node.js]: http://nodejs.org/

## Documentation

You can either [check the documentation on-line][docs], or build them
locally. To build the documentation you'll need to install [type.writer][], and [Node.js][]:

    $ npm install
    $ make documentation
    
This will generate the documentation as a series of HTML files on
`docs/build`.

[type.writer]: http://kurisuwhyte.github.io/type.writer
[docs]: https://hifivejs.github.io/


## Tests

On Node:

    $ npm test
    
On the browser:

    $ npm install -g hifive-browser
    $ hifive-browser serve test/specs/index.js
    # Then open the link on any browser


## Platform support

This library assumes an ES5 environment, but can be easily supported in ES3
platforms by the use of shims. Just include [es5-shim][] :3

[es5-shim]: https://github.com/kriskowal/es5-shim

## Licence

Copyright (c) 2013 Quildreen Motta.

Released under the [MIT licence](https://github.com/hifivejs/hifive/blob/master/LICENCE).
