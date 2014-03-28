# Integrating: Travis CI

Travis CI has
[native support for Node.js](http://about.travis-ci.org/docs/user/languages/javascript-with-nodejs/),
so running your Hi-Five tests on Travis is no biggie:

## 1) Get a `.travis.yml` file on yer repository

Travis uses this file to define how to build your project. The default Node
stuff is all you'll need for Hi-Five.

    language: node_js
    node_js:
      - "0.11"
      - "0.10"
      - "0.8"
      - "0.6"

## 2) Define your test command in your `package.json`

```js
"scripts": {
  "test": "node test/runner.js"
}
```

## 3) ???

If you haven't gotten a Travis CI account yet,
[you should do it now](http://about.travis-ci.org/docs/user/getting-started/). Don't
worry, it's easy, it'll use your Github account for added awesomeness.

## 4) PROFIT!!1

Once you got your project configured for using Travis, just push to Github and
watch as little nano robots build your application and check if all your tests
pass (they also provide you with a badge that tells if your builds passed)
