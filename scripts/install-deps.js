import { $ } from "bun";
import { existsSync, mkdirSync } from "fs";

// Create directories for source and build assets
if (!existsSync("src")) mkdirSync("src");
if (!existsSync("build")) mkdirSync("build");

// Function to compare versions
const compareVersions = (versionA, versionB) => {
    const [a, b] = [versionA.split('.').map(Number), versionB.split('.').map(Number)];
    for (let i = 0; i < a.length; i++) {
        if (a[i] > b[i]) return 1;
        if (a[i] < b[i]) return -1;
    }
    return 0;
}

// Set environment variables for Go
process.env.GOROOT = '/usr/local/go';
process.env.GOPATH = `${process.env.HOME}/go`;
process.env.PATH = `${process.env.PATH}:${process.env.GOROOT}/bin:${process.env.GOPATH}/bin:${process.env.HOME}/.local/bin`;

// Check for Go installation
let goVersionInstalled = null;
try {
    goVersionInstalled = await $`go version`.text().then(output => output.split(' ')[2].substring(2));
} catch (error) {
    console.log("Go is not installed. Installing Go 1.22.4...");
    const goTarball = "go1.22.4.linux-amd64.tar.gz";
    if (!existsSync("build/" + goTarball)) {
        await $`wget -P build/ https://go.dev/dl/${goTarball}`;
    } else {
        console.log(`${goTarball} already exists in build/, skipping download.`);
    }
    await $`sudo rm -rf /usr/local/go`;
    await $`sudo tar -C /usr/local -xzf build/${goTarball}`;
    process.env.PATH = `${process.env.PATH}:/usr/local/go/bin`;
}

// Check for Go version
const goVersionRequired = "1.21";
if (goVersionInstalled) {
    if (compareVersions(goVersionInstalled, goVersionRequired) >= 0) {
        console.log(`Installed Go version (${goVersionInstalled}) is sufficient.`);
    } else {
        console.log(`Installed Go version (${goVersionInstalled}) is too old. Installing Go 1.22.4...`);
        await $`sudo apt remove golang -y`;
        const goTarball = "go1.22.4.linux-amd64.tar.gz";
        if (!existsSync("build/" + goTarball)) {
            await $`wget -P build/ https://go.dev/dl/${goTarball}`;
        } else {
            console.log(`${goTarball} already exists in build/, skipping download.`);
        }
        await $`sudo rm -rf /usr/local/go`;
        await $`sudo tar -C /usr/local -xzf build/${goTarball}`;
        process.env.PATH = `${process.env.PATH}:/usr/local/go/bin`;
    }
}

// Update and install necessary dependencies if not already installed
const dependencies = ["software-properties-common", "wget", "curl", "build-essential", "ffmpeg", "ccache", "cmake", "unzip"];
for (const pkg of dependencies) {
    try {
        await $`dpkg -s ${pkg}`;
        console.log(`${pkg} is already installed.`);
    } catch {
        await $`sudo apt-get update`;
        await $`sudo apt-get install -y ${pkg}`;
    }
}

// Install Intel Dependencies if not already installed
try {
    await $`dpkg -s intel-basekit`;
    console.log("intel-basekit is already installed.");
} catch {
    if (!existsSync("/usr/share/keyrings/oneapi-archive-keyring.gpg")) {
        await $`wget -O build/intel-gpg-keys.GPG-PUB-KEY-INTEL-SW-PRODUCTS.PUB https://apt.repos.intel.com/intel-gpg-keys/GPG-PUB-KEY-INTEL-SW-PRODUCTS.PUB`;
        await $`gpg --dearmor < build/intel-gpg-keys.GPG-PUB-KEY-INTEL-SW-PRODUCTS.PUB | sudo tee /usr/share/keyrings/oneapi-archive-keyring.gpg > /dev/null`;
    } else {
        console.log("Intel keyring already exists.");
    }
    await $`echo "deb [signed-by=/usr/share/keyrings/oneapi-archive-keyring.gpg] https://apt.repos.intel.com/oneapi all main" | sudo tee /etc/apt/sources.list.d/oneAPI.list`;
    await $`sudo apt update`;
    await $`sudo apt install -y intel-basekit`;
}

// Install CUDA Dependencies if not already installed
const cudaVersion = "12-3";
try {
    await $`dpkg -s cuda-nvcc-${cudaVersion}`;
    await $`dpkg -s libcublas-dev-${cudaVersion}`;
    console.log("CUDA packages are already installed.");
} catch {
    if (!existsSync("/usr/share/keyrings/cuda-keyring.gpg")) {
        const cudaKeyring = "cuda-keyring_1.1-1_all.deb";
        if (!existsSync("build/" + cudaKeyring)) {
            await $`curl -o build/${cudaKeyring} https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/${cudaKeyring}`;
        } else {
            console.log(`${cudaKeyring} already exists in build/, skipping download.`);
        }
        await $`sudo dpkg -i build/${cudaKeyring}`;
    } else {
        console.log("CUDA keyring already exists.");
    }
    await $`sudo apt-get update`;
    await $`sudo apt-get install -y cuda-nvcc-${cudaVersion} libcublas-dev-${cudaVersion}`;
}

// Check for protobuf installation and version
const protocVersionRequired = "3.12.0";
const protocZip = "protoc-25.1-linux-x86_64.zip";
const protocUrl = `https://github.com/protocolbuffers/protobuf/releases/download/v25.1/${protocZip}`;
const protocInstallDir = `${process.env.HOME}/.local`;

try {
    const protocVersionInstalled = await $`protoc --version`.text().then(output => output.split(' ')[1]);
    if (compareVersions(protocVersionInstalled, protocVersionRequired) >= 0) {
        console.log(`Installed protobuf version (${protocVersionInstalled}) is sufficient.`);
    } else {
        console.log(`Installed protobuf version (${protocVersionInstalled}) is too old. Removing and installing newer version...`);
        await $`sudo apt remove protobuf-compiler -y`;
        if (!existsSync("build/" + protocZip)) {
            await $`curl -L -o build/${protocZip} ${protocUrl}`;
        } else {
            console.log(`${protocZip} already exists in build/, skipping download.`);
        }
        await $`unzip -o build/${protocZip} -d ${protocInstallDir}`;
    }
} catch {
    console.log("Protobuf compiler is not installed. Installing...");
    if (!existsSync("build/" + protocZip)) {
        await $`curl -L -o build/${protocZip} ${protocUrl}`;
    } else {
        console.log(`${protocZip} already exists in build/, skipping download.`);
    }
    await $`unzip -o build/${protocZip} -d ${protocInstallDir}`;
}

// Update PATH to include the protoc binary
process.env.PATH = `${process.env.PATH}:${protocInstallDir}/bin`;

// Install Go dependencies
await $`go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.34.0`;
await $`go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@8ba23be9613c672d40ae261d2a1335d639bdd59b`;

// Set environment variables
process.env.PATH = `${process.env.PATH}:${process.env.GOPATH}/bin`;
process.env.PATH = `${process.env.PATH}:/usr/local/cuda/bin`;
await $`source /opt/intel/oneapi/setvars.sh`;
