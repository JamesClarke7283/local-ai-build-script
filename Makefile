.PHONY: build clean

export GOROOT=/usr/local/go
export GOPATH=$(HOME)/go
export PATH := $(GOROOT)/bin:$(GOPATH)/bin:$(PATH)

build:
	bun run scripts/install-deps.js
	bun run scripts/build.js

clean:
	if [ -d "src/LocalAI" ]; then \
		cd src/LocalAI && $(MAKE) clean; \
	else \
		echo "src/LocalAI directory does not exist. Nothing to clean."; \
	fi
	rm -rf build
