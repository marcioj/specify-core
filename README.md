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

The easiest way is to grab it from NPM. If you're running in a Browser
environment, you can use [Browserify][]

    $ npm install hifive


### Using with CommonJS

If you're not using NPM, [Download the latest release][release], and require
the `hifive.umd.js` file:

```js
var hifive = require('hifive')
```


### Using with AMD

[Download the latest release][release], and require the `hifive.umd.js`
file:

```js
require(['hifive'], function(hifive) {
  ( ... )
})
```


### Using without modules

[Download the latest release][release], and load the `hifive.umd.js`
file. The properties are exposed in the global `hifive` object:

```html
<script src="/path/to/hifive.umd.js"></script>
```


### Compiling from source

If you want to compile this library from the source, you'll need [Git][],
[Make][], [Node.js][], and run the following commands:

    $ git clone git://github.com/hifivejs/hifive.git
    $ cd hifive
    $ npm install
    $ make bundle
    
This will generate the `dist/hifive.umd.js` file, which you can load in
any JavaScript environment.

    
## Documentation

You can [read the documentation online][docs] or build it yourself:

    $ git clone git://github.com/hifivejs/hifive.git
    $ cd hifive
    $ npm install
    $ make documentation

Then open the file `docs/index.html` in your browser.


## Platform support

This library assumes an ES5 environment, but can be easily supported in ES3
platforms by the use of shims. Just include [es5-shim][] :)


## Licence

Copyright (c) 2014 Quildreen Motta.

Released under the [MIT licence](https://github.com/hifivejs/hifive/blob/master/LICENCE).

<!-- links -->
[Fantasy Land]: https://github.com/fantasyland/fantasy-land
[Browserify]: http://browserify.org/
[Git]: http://git-scm.com/
[Make]: http://www.gnu.org/software/make/
[Node.js]: http://nodejs.org/
[es5-shim]: https://github.com/kriskowal/es5-shim
[docs]: http://hifivejs.github.io/hifive
<!-- [release: https://github.com/hifivejs/hifive/releases/download/v$VERSION/hifive-$VERSION.tar.gz] -->
[release]: https://github.com/hifivejs/hifive/releases/download/v0.0.0/hifive-0.0.0.tar.gz
<!-- [/release] -->
