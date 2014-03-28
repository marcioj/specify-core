bin := $(shell npm bin)

test:
	node ./test/tap

test-browser:
	hifive-browser serve test/specs/index.js

bundle:
	mkdir -p dist
	$(bin)/browserify lib/index.js --standalone hifive > dist/hifive.umd.js

documentation:
	cd docs/manual && typewriter build
	$(bin)/jsdoc --configure jsdoc.conf.json

clean:
	rm -rf dist

.PHONY: test
