#!/bin/bash

# Set environment variables for Go and ensure they are available
export GOROOT=/usr/local/go
export GOPATH=$HOME/go
export PATH=$PATH:$GOROOT/bin:$GOPATH/bin

# Clone the repository if it doesn't exist
if [[ ! -d "src/LocalAI" ]]; then
    git clone --recursive --depth 1 https://github.com/mudler/LocalAI.git src/LocalAI
else
    echo "LocalAI directory already exists in src/, skipping clone."
fi
cd src/LocalAI

# Ensure protoc is installed correctly and check its version
PROTOC_VERSION=$(protoc --version 2>/dev/null)
if [[ -z "$PROTOC_VERSION" ]]; then
    echo "protoc is not installed or not in the PATH. Please ensure it is installed."
    exit 1
fi
echo "protoc version: $PROTOC_VERSION"

# Set GO_TAGS and BUILD_TYPE
export GO_TAGS="p2p stablediffusion tts"
export BUILD_TYPE=cublas

# Build the project
make -j4 dist
