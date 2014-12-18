Understanding Hi-Five
=====================

This page will provide a technical overview of the Hi-Five internals, and guide
you through understanding all of the components of the library, and how they
come together at the higher-levels.


An overview of Hi-Five
----------------------

Hi-Five is a library built on top of the concept of organising tests in a
hierarchy of ``Suites`` and ``Cases``. Where a ``Suite`` is a collection of
``Cases`` (and potentially other ``Suites`` as well), and each ``Case`` defines
an aspect of the code to be tested.

All ``Cases`` are considered to be asynchronous, since it's easy to lift a
synchronous computation to the asynchronous world, but impossible to go the
other way around. This also guarantees that all tests use the same API, which
reduces the amount of things one must learn to use the library.

When a ``Case`` gets ran, it eventually produces a ``Result`` object. Likewise,
when a ``Suite`` gets ran, it eventually produces a collection of ``Result``
objects for all the ``Cases`` in that ``Suite``. To be able to provide
real-time feedback when running a ``Suite``, instead of just giving people a
way of knowing when it's done, we give them a ``Stream of Signals``, where a
``Signal`` may be the result of running a ``Case``, or the beginning and
completion of a ``Case`` or ``Suite``.

This ``Stream of Signals`` is passed to a ``Reporter`` function which takes
care of using the result information, be it presenting that information to the
user, or communicating the results with another computer program.


Tests as a data type
--------------------

Hi-Five structures tests as a tree-like structure. This tree (which we'll call
``Test``) is an `algebraic data type`_ that can be one of two cases:

.. code-block:: haskell
   :linenos:
   :emphasize-lines: 2,10

   type Foo = -- A Test may be a Suite, which might contain zero or more Tests
              Suite { name       :: String
                    , tests      :: [Test]
                    , beforeAll  :: Hook
                    , afterAll   :: Hook
                    , beforeEach :: Hook
                    , afterEach  :: Hook
                    }
            -- Or it may be a Case, which defines a testable aspect of the code
            | Case { name    :: String
                   , test    :: Future(Error, Void)
                   , timeout :: Maybe(<Number/ms>)
                   , slow    :: Maybe(<Number/ms>)
                   , enabled :: Maybe(Case -> Boolean)
                   }

You can easily create these data structures by instantiating the ``Case`` or
``Suite`` objects:

.. code-block:: js
   :linenos:
   :emphasize-lines: 1,2,3,8,15,31

   var hifive = require('hifive');
   var Maybe = require('data.maybe');
   var Future = require('data.future');
   var Suite = hifive.Test.Suite;
   var Case = hifive.Test.Case;
   var Hook = hifive.Hook;
   
   var tests = Suite.create({
     name: "add()",
     beforeAll: Hook([]),
     beforeEach: Hook([]),
     afterAll: Hook([]),
     afterEach: Hook([]),
     tests: [
       Case.create({
         name: "When adding 0 to any value, the result is that value.",
         timeout: Maybe.Nothing(),
         slow: Maybe.Nothing(),
         enabled: Maybe.Nothing(),
         test: new Future(function(reject, resolve) {
           try {
             add(4, 0) => 4;
             add(0, 5) => 5;
             resolve();
           } catch (e) {
             reject(e);
           }
         })
       }),

       Case.create({
         name: "When adding two positive numbers, "
             + "the result is always greater than both.",
         timeout: Maybe.Nothing(),
         slow: Maybe.Nothing(),
         enabled: Maybe.Nothing(),
         test: new Future(function(reject, resolve) {
           try {
             add(4, 5) => 9;
             add(3, 2) => 5;
             resolve();
           } catch (e) {
             reject(e);
           }
         })
       })
     ]
   })
  
.. note::

   Hi-Five makes heavy use of algebraic structures. `Data.Maybe`_ is used in
   the ``Test`` objects to model optional configurations. If you provide a
   ``Maybe.Nothing``, then the global configuration will be used when running
   the test, if you use ``Maybe.Just(a)``, then ``a`` will be used to configure
   running that test.
   

While creating the data structures directly is extremely verbose, this is
pretty interesting for building on top of HiFive, since a library can
manipulate this tree of tests in the same way one could manipulate an object,
string or array in the language. In fact, the macro DSL below just compiles to
the code above::

    var tests = spec 'add()' {
      it 'when adding 0 to any value, the result is that value.' {
        add(4, 0) => 4;
        add(0, 5) => 5;
      }

      it 'when adding two positive numbers, the result is always greater than both.' {
        add(4, 5) => 9;
        add(3, 2) => 5;
      }
    }

But a library could always provide a good interface in plain JavaScript. For
example, making the test tree a first-class value makes the following
possible:

.. code-block:: js
   :linenos:
   :emphasize-lines: 35,36,37,38,39,40,41,42,43,44,45

    var hifive = require('hifive');
    var Maybe = require('data.maybe');
    var Future = require('data.future');

    function pairs(o) {
      return Object.keys(o).map(function(k){ return { key: k, value: o[k] }})
    }

    function suite(name, options, tests) {
      if (arguments.length < 3) {
        tests = options;
        options = {};
      }
      return hifive.Test.Suite.Create({
        name: name,
        beforeAll: Hook(options.beforeAll || []),
        beforeEach: Hook(options.beforeEach || []),
        afterAll: Hook(options.afterAll || []),
        afterEach: Hook(options.afterEach || []),
        tests: pairs(tests).map(function(pair) {
                 return hifive.Test.Case.Create({
                   name: pair.key,
                   timeout: Maybe.Nothing(),
                   slow: Maybe.Nothing(),
                   enabled: Maybe.Nothing(),
                   test: new Future(function(reject, resolve) {
                     try { pair.value(); resolve() }
                     catch(e){ reject(e) }
                   })
                 })
               })
      })
    }

    var tests = suite('add()', {
      'When adding 0 to any value, the result is that value': function() {
        add(4, 0) => 4;
        add(0, 5) => 5;
      },
      'When adding two positive numbers, the result is always greater than both': 
      function() {
        add(4, 5) => 9;
        add(3, 2) => 5;
      }
    })

.. _algebraic data type: http://en.wikipedia.org/wiki/Algebraic_data_type
.. _Data.Maybe: https://github.com/folktale/data.maybe


Case objects
''''''''''''

A ``Case`` object represents a runnable test in a test tree. It has the
following shape:

.. code-block:: haskell
   

   type Case {
     -- A description of this test case.
     name :: String,

     -- The executable code that verifies that the aspect to be tested
     -- by the `Case` object holds.
     test :: Future(Error, Void),

     -- The number of miliseconds to wait for the `Case` to finish executing.
     -- If the `Case` takes longer than this, the test is considered a failure.
     timeout :: Maybe(<Number/ms>),

     -- A number of miliseconds for a threshold on slow test cases. Test cases
     -- that take more time than this to complete are considered slow, and
     -- will have a field indicating so in its `Result` object.
     slow :: Maybe(<Number/ms>),

     -- A predicate that takes the `Case` object as a parameter, and returns
     -- whether it should be ran or not.
     enabled :: Maybe(Case -> Boolean)
  }

Case objects may be created by ``hifive.Test.Case.create({ ... })``.

You'll notice that the configuration fields in the ``Case`` object are wrapped
in a `Data.Maybe`_ structure. This is done because a ``Case`` might not define
a configuration for itself, but rather inherit one from the configuration used
by the runner. If a field has a value ``Maybe.Nothing``, then the value is
inherited from the runner configuration.


Suite objects
'''''''''''''

A ``Suite`` object represents a collection of ``Tests``, and allows tests to be
organised in a tree-like fashion. It has the following shape:

.. code-block:: Haskell

   type Suite {
     -- A description of this suite
     name :: String,

     -- A collection of `Test` objects (either `Suite` or `Case`) that
     -- are part of this `Suite`.
     tests :: [Test],

     -- A list of code that gets executed before all `Tests` in this suite.
     beforeAll :: Hook,

     -- A list of code that gets executed after all `Tests` in this suite.
     afterAll :: Hook,

     -- A list of code that gets executed before each `Test` in this suite.
     beforeEach :: Hook,

     -- A list of code that gets executed after each `Test` in this suite.
     afterEach :: Hook
   }

Suites may be created by ``hifive.Test.Suite.create({ ... })``.


Hook objects
''''''''''''

A Hook is a list of actions, and they're used for running preparation and
cleanup code between tests and suites. It has the following shape:

.. code-block:: Haskell

   type Hook {
     actions :: [Future(Error, Void)]
   }

Hooks may be created by ``hifive.Hook.create({ actions: [...] })`` or by
just passing the array with ``new hifive.Hook([])``.


Running tests
-------------

``Cases`` and ``Suites`` behave in different ways when ran. When you run a
``Case``, its ``test`` future gets evaluated, according to the rules defined by
the configuration options in the object and the ones passed to it, giving you a
``Stream of Signals`` that will only contain a single ``Result`` object. When
you run a ``Suite``, it'll run the ``beforeAll`` hooks before running any
tests, then before and after each test it'll run the ``beforeEach`` and
``afterEach`` hooks, finally it'll run the ``afterAll`` hooks once all tests in
the ``Suite`` have been ran. Running a ``Suite`` gives you a ``Stream of
Signals`` that will receive ``Started``, ``Finished`` and ``Result`` values
over time.

.. note::

   During the time a ``Case`` is being ran, all calls to ``console.log`` are
   intercepted, and the values logged will be available in the ``Result``
   object for that ``Case`` instead.

It's possible to configure how ``Case`` objects get evaluated by the runner by
providing configuration objects, although it is not possible to configure how
``Suite`` objects get evaluated at the time. A configuration object looks like
this:

.. code-block:: haskell
   :linenos:

   type Config {
     -- The number of miliseconds used to consider a `Case` slow or not.
     -- If running a `Case` is considered slow, the corresponding `Result`
     -- object will have a field indicating so.
     slowThreshold :: <Number/ms>,

     -- The number of miliseconds to wait for a running `Case` to finish
     -- executing. If running a `Case` takes more than this time, we'll
     -- consider that code to be stuck and mark it as a failure.
     timeout :: <Number/ms>,

     -- A predicate that decides whether a particular `Case` should be
     -- ran or not.
     runOnly :: Case -> Boolean
   }

The ``runner`` module provides the side-effecting ``run`` function, which takes
a configuration object, a list of ``Test`` objects, and a reporter
function. Additionally, the module provides the ``makeRunner`` function, that
takes the same arguments, but returns a ``Future(Error, Reporter)`` object
instead of executing it.

.. code-block:: js
   :linenos:

   var hifive = require('hifive');

   // :: Config → [Test] → ((Rx.Observable[α, Signal], Rx.Observable[α, Report]) → Void) → Void
   hifive.run(
     hifive.Config.create({
       slowThreshold: 500,
       timeout: 3000,
       runOnly: function(test){ return true }
     }),
     [suiteA, suiteB],
     reporter
   )
   
A default configuration is provided, and will be used when using the
``runWithDefaults`` function::

    var defaultConfig = {
      slowThreshold: 300,
      timeout: 2000,
      runOnly: function(test) { return true }
    }

New configurations may be created from the ``hifive.Config`` object, as shown above.


Signals
-------

Running a ``Suite`` or a ``Case`` will give you a ``Stream of Signals``. This
data structure allows one to provide real-time feedback as tests get ran, and
it fits perfectly with the idea of modular and pluggable reporters.

A ``Signal`` is a type that may have three different forms:

.. code-block:: haskell
   :linenos:

   type Signal = Started { value :: Test
                         , path  :: [String]
                         }
               | Finished { value :: Test
                          , path  :: [String]
                          }
               | TestResult { value :: Result }


A ``Started`` object is added to the stream before we ran a ``Case`` or
``Suite``, and it contains both the test object that's going to be ran,
alongside a list of the names of its parents in the tree. Likewise, a
``Finished`` object is added to the stream after we run each test.

``Result`` objects are added to the stream whenever a ``Case`` finishes
executing, fails to execute altogether, or has been marked to not be ran
(either by its own ``enabled`` field, or by some inherited
configuration). ``Result`` objects, too, may have three different forms:

.. code-block:: haskell
   :linenos:

   type Result = Success { title    :: [String]
                         , duration :: Duration
                         , log      :: [LogEntry]
                         }
               | Failure { title     :: [String]
                         , exception :: Any
                         , duration  :: Duration
                         , log       :: [LogEntry]
                         }
               | Ignored { title :: [String] }


Reports
-------

A report is an object that aggregates test results, and allows one to quickly
assess the overall result of running a set of tests. Reports are returned from
the ``makeRunner`` function, and passed to reporter functions, and it has the
following shape:

.. code-block:: haskell
   :linenos:

   type Report {
     started  :: Date,
     finished :: Date,
     passed   :: [Result],
     failed   :: [Result],
     ignored  :: [Result],
   }

   -- Return the number of miliseconds the entire set of tests took to run
   Report#time :: Void -> <Number/ms>

   -- Returns a list of all test results
   Report#all  :: Void -> [Result]
