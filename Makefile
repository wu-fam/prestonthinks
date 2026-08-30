.PHONY: setup serve clean

setup: ## Install dependencies
	eval "$$(rbenv init - bash)" && bundle install

serve: ## Run the site locally at http://localhost:4000
	eval "$$(rbenv init - bash)" && bundle exec jekyll serve --livereload

clean: ## Remove generated site files
	eval "$$(rbenv init - bash)" && bundle exec jekyll clean

help: ## Show this help
	@grep -E '^[a-z]+:.*## ' Makefile | awk -F ':.*## ' '{printf "  make %-10s %s\n", $$1, $$2}'
