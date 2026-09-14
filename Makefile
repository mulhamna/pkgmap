.PHONY: test lint fmt fmt-check verify

test:      ; bun test
lint:      ; bun run lint
fmt:       ; bun run format
fmt-check: ; bun run format:check
verify:    ; bun run format:check && bun run lint && bun test
