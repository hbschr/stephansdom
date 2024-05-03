.PHONY: lint
lint:
	npm run lint

.PHONY: clean
clean:
	rm -f src/*.js

.PHONY: distclean
distclean: clean
	rm -rf node_modules
