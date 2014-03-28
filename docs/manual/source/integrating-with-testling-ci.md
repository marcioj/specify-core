# Integrating: Testling CI

[Testling CI](https://ci.testling.com/) will awesomely run your tests on all
the browsers you want, automagically. And it's reeeeally easy to get your
Hi-Five tests up and running there!

## 1) Tell Testling which browsers you support

In your `package.json`, just add a `testling` field with the browsers you want
to support, and give it the location of your test runner using the `TAP`
reporter:

```js
  "testling": {
    "files": "test/runner.js",
    "browsers": [
      "ie/6..latest",
      "chrome/20..latest",
      "firefox/15..latest",
      "safari/latest",
      "opera/11.0..latest",
      "iphone/6",
      "ipad/6"
    ]
  }
```

```js
var hifive = require('hifive')

hifive.run(yourSpecList, require('hifive-tap')())
```

## 2) Enable Testling for your project

Go to your Project's settings, under the `hooks` tab, and add the following URL
to the `WebHooks`:

    http://git.testling.com

## 3) ???

Cross your fingers.

## 4) PROFIT!!!1

Once you push to Github, Testling will take care of running all your stuff in
all the browsers you told it to. In the meantime, you might want to proudly
display a badge showing all the browsers you're supporting in your `README.md`:

    [![browser support](https://ci.testling.com/USER/PROJECT.png)](https://ci.testling.com/USER/PROJECT)
