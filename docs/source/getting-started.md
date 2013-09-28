Getting Started
===============

Getting started with Hi-Five is really simple, since the library is designed to
stay out of your way and just let you do the testing.


## 1) Install Hi-Five

First things first, you should install Hi-Five in your project. You can easily
do so using NPM:

```bash
$ npm install --save-dev hifive
```

## 2) Write some test specs

Once you've got the dependencies out of your way, you can start writing your
tests. Unlike most other test frameworks, Hi-Five chooses to work with "test
cases as values". Because of this, the better way to write tests is to have a
separate module for each high-level specification, and have them export the
specification object:

```js
var spec   = require('hifive')()
var assert = require('assert')

module.exports = spec('Array', function(it, topic) {
  topic('concat()', function(it) {
    it('Should return a new Array.', function() {
      var a = [1, 2, 3]
      assert.notEqual(a, a.concat([])
    })
    
    it('Should return an Array containing elements from both arrays.', function() {
      var a = [1, 2, 3], b = [4, 5]
      assert.deepEqual([1, 2, 3, 4, 5], a.concat(b))
    })
  })
})
```

## 3) Run the tests through a reporter

Once you've finished writing your specs, you should define a runner and a
reporter. There are some reporters to choose from. Let's go with the
[minimal][] reporter for now:

[minimal]: https://github.com/hifivejs/hifive-minimal

```bash
$ npm install --save-dev hifive-minimal
```

So you just specify which test cases you want to run:

```js
// Get a reference to Hi-Five
var hifive = require('hifive')

// then pass your specs to the runner (and a reporter!)
hifive.run( [ require('./your-spec') ]
          , require('hifive-minimal')())

// You can also run specs directly:
// require('./your-spec').run(require('hifive-minimal')())
```

And you get the verdict!

```bash
$ node your-runner.js
Success. 2/2 tests.
```
