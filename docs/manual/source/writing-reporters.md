# Writing reporters

If you want Hi-Five to report the test results in a different manner (likely
when supporting a new platform, or multiple platforms), you'll want to write a
custom reporter. Writing a reporter for Hi-Five is a no-brainer, you just write
a module that exports a function taking a `Report` object, and adds listeners
to events emitted by that object.

For example, if you want to write a reporter that sends HTTP requests with the
results to a particular server:

```js
// By convention, the module exports a function that takes some configuration
// and returns a Reporter function.
module.exports = function(server) { return function(report) {
  report.signals.result.add(function(result) {
    http.post(server + '/result', { title: result.test.fullTitle().join(' ')
                                  , verdict: result.verdict
                                  , slow: result.slow
                                  , exception: result.exception })
  })

  report.signals.done.add(function(result) {
    http.post(server + '/done', { total: result.all.length
                                , passed: result.passed.length
                                , failed: result.failed.length
                                , ignored: result.ignored.length })
  })
}}
```

And to use it, just require it as normal:

```js
spec.run(yourTests, require('your-reporter')(config))
```

## Understanding the `Report` object

The `Report` object is something that gathers the results of running a series
of tests, and emits events while gathering this data.

### The interface

The following are the interfaces that the `Report` object (and the values it
stores) follows:

```hs
type Test
  title     :: String         -- ^ The title of this particular test
  fullTitle :: () -> [String] -- ^ Returns all components of a Test's title.


type Verdict :: "success" | "failure" | "ignored"


type Result
  verdict   :: Verdict    -- ^ The verdict about the test
  started   :: Date       -- ^ When it started
  finished  :: Date       -- ^ When it finished
  exception :: Error      -- ^ The exception thrown (if any)
  slow      :: Boolean    -- ^ Was it slower than the threshold?
  test      :: Test       -- ^ The test that we ran
  logs      :: [LogEntry] -- ^ Anything output in console.log

type Report
  passed   :: [Result]
  failed   :: [Result]
  ignored  :: [Result]
  all      :: [Result]
  started  :: Maybe Date
  finished :: Maybe Date

type LogEntry
  date :: Date
  data :: [Any]
```

### Events

The `Report` object integrates with the custom test reporter by emitting
events. You can then add listeners to these events by way of the `add` method
of each signal. Hi-Five uses the
[Shoutout](https://github.com/killdream/shoutout) library for its signals,
which is rather simple and documented. All signals live in the `report.signals`
object.

#### `test.started :: (Test)`

Emitted before a Test is ran.

### `test.finished :: (Result, Test)`

Emitted after a Test has finished running, regardless of its verdict. It gives
you the `Result` of running the test, which includes information about what the
verdict of the test was, the exceptions it has thrown, whether it was slow,
when it started and when it finished, and so on and so forth.

### `suite.started :: (Suite)`

Emitted before a collection of tests is ran. Suites inherit from `Test`, so you
can use the `title` and `fullTitle` properties just fine!

### `suite.finished :: ([Result], Suite)`

Emitted after a collection of tests has finished running. Since suites are just
collections of tests, Hi-Five will give you an Array with all the tests that
are under that `Suite` (directly or indirectly). If you need to compute the
overall success/failure/time of the Suite, you'll need to fold over the
`Result` list.

For example, if you want to check if all tests passed:

```js
report.signals.suite.finished(function(results) {
  var passed = results.every(function(result){ return result.verdict = 'success' })
  if (passed)  console.log('All tests passed!')
  else         console.log('Some tests failed.')
})
```

For a real-world example, you can take a look at the
[hifive-browser](https://github.com/hifivejs/hifive-browser/blob/master/lib/index.js#L175-L186)
code.

### `result :: (Result)`

Emitted as soon as we get back a result from running a `Test`.

### `success :: (Result)`

Emitted after the Report decides if the result is a success.

### `failure :: (Result)`

Emitted after the Report decides if the result is a failure.

### `ignored :: (Result)`

Emitted after the Report decides if the test case was ignored (not ran at all).

### `done :: (Report)`

Emitted after all tests have finished running.