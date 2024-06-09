.PHONY: build clean

export GOROOT=/usr/local/go
export GOPATH=$(HOME)/go
export PATH := $(GOROOT)/bin:$(GOPATH)/bin:$(PATH)

build:
	bash scripts/install-deps.sh
	bash scripts/build.sh

clean:
	if [ -d "src/LocalAI" ]; then \
		cd src/LocalAI && $(MAKE) clean; \
	else \
		echo "src/LocalAI directory does not exist. Nothing to clean."; \
	fi
	rm -rf build
