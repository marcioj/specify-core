Introduction
============

This documentation will guide you through all the concepts in the Hi-Five
library. Hi-Five is a minimal BDD test runner designed to stay out of your way
and just let you do your testing, as well as easily integrate with any other
JavaScript system/platform.


Why use Hi-Five?
----------------

Since JavaScript isn't a particularly well suited language for guaranteeing the
quality of programs written in it, programmers need to rely on external
analysis and assurance tools for that. One particularly well used tool is
automatic testing.

Hi-Five provides a library designed towards the Behaviour-Driven Development
methodology to software testing, that can fit any environment and
work-flow. This is done by making the whole framework completely modular, such
that you can pick and match the features you're interested in, and use each
library independently in any context.

The framework follows this philosophy:

Not-A-Framework
    Hi-Five should let you, the programmer, lead the way and define how testing
    should be done. Bring your own reporters & assertion libraries.

Run anywhere
    Hi-Five should run in any JS VM that supports at least the ECMAScript 3
    specification.

Easy to integrate
    Hi-Five should be easy to integrate with any CI or other system.

Support async
    Hi-Five should support asynchronous tests as first-class.



Hi-Five vs Alternatives
-----------------------

`Mocha`_
    Mocha is a fairly popular testing framework that also supports BDD-style
    tests, and comes out of the box with everything you need to write your
    tests (although it allows you to choose an assertion library). While Mocha
    can be also used in non-Node platforms, the code has been written with Node
    in mind, and you have to use two different versions of the code for
    supporting Node and browser platforms. No guarantees are made for running
    the code in platforms other than that.

    Hi-Five is less opinionated. It's structured as a set of libraries rather
    than a "here's how you do it" framework. In a sense, this gives you a more
    powerful set of tools, but it also adds some upfront effort on picking the
    pieces you want and putting them together. Unlike Mocha, Hi-Five has been
    designed to work on any ECMAScript 3 platform (though older platforms will
    require some of the shims provided by the es5-shim library).

    For asynchronous tests, Mocha supports using callbacks or Promises/A+,
    whereas Hi-Five uses `data.future`_.

    Mocha tests are written in pure JavaScript, with an embedded DSL exposed as
    global functions depending on which interface you run the test runner
    with. While Hi-Five gives you the flexibility of using any interface (tests
    are just regular JavaScript data structures!), the ecosystem leans more
    towards using Sweet.js macros to describe the tests.

`Jasmine`_
    Jasmine is a full-featured testing framework using the BDD-style for
    tests. It includes its own assertion library, its own test runner, and its
    own spies/mocking library. While you can use Jasmine for platforms that are
    not the browser, that's what it was originally meant for, and running it in
    other platforms might be more difficult.

    Again, Hi-Five is much less opinionated, which means that you get to pick
    the parts you want from any library (more flexibility, but also more work
    upfront), and was designed to run on any ECMAScript 3 platform.

    For asynchronous tests, Jasmine uses callbacks, whereas Hi-Five uses
    `data.future`_.

    Jasmine has only a BDD interface, which is exposed as global functions by
    the library, so you write your tests as pure JavaScript using the embedded
    DSL. Hi-Five gives you the flexibility of using any interface (tests are
    just regular JavaScript data structures!), but the ecosystem leans more
    towards using Sweet.js macros to describe the tests.


.. _Jasmine: http://jasmine.github.io/
.. _data.future: https://github.com/folktale/data.future
.. _Mocha: http://visionmedia.github.io/mocha/


Hi-Five in other systems/platforms
----------------------------------

You can run Hi-Five in any platform that supports the ECMAScript 5
specification without doing any additional work, and you can run Hi-Five in any
platform that supports ECMAScript 3 by loading the `es5-shim`_ library before.

For platforms that don't support Node modules, you'll need to compile the
library using `browserify`_, or use the pre-built bundle.

.. _es5-shim: https://github.com/es-shims/es5-shim
.. _browserify: http://browserify.org/
