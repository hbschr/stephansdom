.PHONY: install
install:
	bun install

.PHONY: check
check:
	reset
	bun run lint
	bun run test

.PHONY: dev
dev:
	bun run dev

.PHONY: clean
clean:
	rm -f src/*.js

.PHONY: distclean
distclean: clean
	rm -rf node_modules
