# Thin convenience wrapper over moon/pnpm. `make help` to list targets.
.DEFAULT_GOAL := help

.PHONY: help setup build test lint check format clean submodules

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

setup: ## Install toolchains, deps, and sync the moon graph
	pnpm run setup

build: ## Build all projects
	moon run :build

test: ## Test all projects
	moon run :test

lint: ## Lint all projects
	moon run :lint

check: ## Run full per-project quality gates
	moon check --all

format: ## Format the repo with Prettier
	pnpm run format

submodules: ## Init/update all submodules to pinned SHAs
	git submodule update --init --recursive

clean: ## Remove build output and caches
	moon clean && rm -rf node_modules **/node_modules **/dist
