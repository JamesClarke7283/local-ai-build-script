#!/bin/bash

# Create directories for source and build assets
mkdir -p src build

# Function to compare Go versions
compare_versions() {
    local version_a=$1
    local version_b=$2

    if [[ "$(printf '%s\n' "$version_a" "$version_b" | sort -V | head -n 1)" == "$version_a" ]]; then
        return 1
    else
        return 0
    fi
}

# Set environment variables for Go
export GOROOT=/usr/local/go
export GOPATH=$HOME/go
export PATH=$PATH:$GOROOT/bin:$GOPATH/bin

# Check for Go installation
if ! which go &> /dev/null; then
    echo "Go is not installed. Installing Go $GO_VERSION_REQUIRED..."
    GO_TARBALL="go1.22.4.linux-amd64.tar.gz"
    if [[ ! -f "build/$GO_TARBALL" ]]; then
        wget -P build/ https://go.dev/dl/$GO_TARBALL
    else
        echo "$GO_TARBALL already exists in build/, skipping download."
    fi
    sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf build/$GO_TARBALL
    export PATH=$PATH:/usr/local/go/bin
else
    # Check for Go version
    GO_VERSION_REQUIRED="1.21"
    GO_VERSION_INSTALLED=$(go version 2>/dev/null | awk '{print $3}' | cut -d 'o' -f 2)

    if [[ -z "$GO_VERSION_INSTALLED" ]]; then
        echo "Failed to determine the installed Go version. Please ensure Go is correctly installed."
        exit 1
    elif compare_versions "$GO_VERSION_INSTALLED" "$GO_VERSION_REQUIRED"; then
        echo "Installed Go version ($GO_VERSION_INSTALLED) is sufficient."
    else
        echo "Installed Go version ($GO_VERSION_INSTALLED) is too old. Installing Go $GO_VERSION_REQUIRED..."
        sudo apt remove golang -y
        GO_TARBALL="go1.22.4.linux-amd64.tar.gz"
        if [[ ! -f "build/$GO_TARBALL" ]]; then
            wget -P build/ https://go.dev/dl/$GO_TARBALL
        else
            echo "$GO_TARBALL already exists in build/, skipping download."
        fi
        sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf build/$GO_TARBALL
        export PATH=$PATH:/usr/local/go/bin
    fi
fi


# Export the Go path again to ensure it's correct after installation
export PATH=$PATH:/usr/local/go/bin

# Update and install necessary dependencies if not already installed
DEPENDENCIES=(software-properties-common wget curl build-essential ffmpeg protobuf-compiler ccache cmake)
for package in "${DEPENDENCIES[@]}"; do
    if ! dpkg -s $package &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y $package
    else
        echo "$package is already installed."
    fi
done

# Install Intel Dependencies if not already installed
if ! dpkg -s intel-basekit &> /dev/null; then
    if [[ ! -f /usr/share/keyrings/oneapi-archive-keyring.gpg ]]; then
        wget -O build/intel-gpg-keys.GPG-PUB-KEY-INTEL-SW-PRODUCTS.PUB https://apt.repos.intel.com/intel-gpg-keys/GPG-PUB-KEY-INTEL-SW-PRODUCTS.PUB
        gpg --dearmor < build/intel-gpg-keys.GPG-PUB-KEY-INTEL-SW-PRODUCTS.PUB | sudo tee /usr/share/keyrings/oneapi-archive-keyring.gpg > /dev/null
    else
        echo "Intel keyring already exists."
    fi
    echo "deb [signed-by=/usr/share/keyrings/oneapi-archive-keyring.gpg] https://apt.repos.intel.com/oneapi all main" | sudo tee /etc/apt/sources.list.d/oneAPI.list
    sudo apt update
    sudo apt install -y intel-basekit
else
    echo "intel-basekit is already installed."
fi

# Install CUDA Dependencies if not already installed
CUDA_VERSION=12-3
if ! dpkg -s cuda-nvcc-${CUDA_VERSION} libcublas-dev-${CUDA_VERSION} &> /dev/null; then
    if [[ ! -f /usr/share/keyrings/cuda-keyring.gpg ]]; then
        CUDA_KEYRING="cuda-keyring_1.1-1_all.deb"
        if [[ ! -f "build/$CUDA_KEYRING" ]]; then
            curl -o build/$CUDA_KEYRING https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/$CUDA_KEYRING
        else
            echo "$CUDA_KEYRING already exists in build/, skipping download."
        fi
        sudo dpkg -i build/$CUDA_KEYRING
    else
        echo "CUDA keyring already exists."
    fi
    sudo apt-get update
    sudo apt-get install -y cuda-nvcc-${CUDA_VERSION} libcublas-dev-${CUDA_VERSION}
else
    echo "CUDA packages are already installed."
fi

# Install Go dependencies
go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.34.0
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@8ba23be9613c672d40ae261d2a1335d639bdd59b

# Set environment variables
export PATH=$PATH:$GOPATH/bin
export PATH=/usr/local/cuda/bin:$PATH
source /opt/intel/oneapi/setvars.sh
