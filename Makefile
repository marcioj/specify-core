bin := $(shell npm bin)

test:
	node ./test/tap

test-browser:
	hifive-browser serve test/specs/index.js

bundle:
	mkdir -p dist
	$(bin)/browserify lib/index.js --standalone hifive > dist/hifive.umd.js

api-documentation:
	$(bin)/jsdoc --configure jsdoc.conf.json	

documentation: api-documentation
	cd docs/manual && typewriter build
	cp -r docs/api docs/manual/build

clean:
	rm -rf dist

.PHONY: test
