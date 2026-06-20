.PHONY: test lint fmt fmt-check verify

test:      ; npm test
lint:      ; npm run lint
fmt:       ; npm run format
fmt-check: ; npm run format:check
verify:    ; npm run format:check && npm run lint && npm test
