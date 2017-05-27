# Build LLVM for Travis
The web assembly backend is not yet included in the prebuilt llvm versions. Therefore, a custom build is needed. Building llvm from source in every build takes to much time so that travis kills the build job.

!!! Requires at least 80GB of free disk space !!!

Uses Ubuntu trusty.
 
Install Dependencies

```sh
apt-get update
apt-get install python-software-properties wget nano
sudo add-apt-repository ppa:ubuntu-toolchain-r/ppa
wget -O - http://apt.llvm.org/llvm-snapshot.gpg.key | apt-key add -
echo "deb http://apt.llvm.org/trusty/ llvm-toolchain-trusty main" | tee -a /etc/apt/sources.list
echo "deb-src http://apt.llvm.org/trusty/ llvm-toolchain-trusty main" | tee -a /etc/apt/sources.list
apt-get update
apt-get g++ checkinstall libffi-dev python-dev libjsoncpp-dev subversion rsync quilt help2man lftp git ocaml -y
```

See *create CMake deb package* on how to install an up to date CMake version.

Create an empty llvm directory

```bash
mkdir llvm && cd llvm
```

Clone llvm into the `src` directory
 
```bash
git clone https://github.com/llvm-mirror/llvm.git src
cd src
```

Clone clang into the tools directory

```bash
cd tools
git clone https://github.com/llvm-mirror/clang.git
```

Clone *compiler-rt* and *libcxx* into the projects directory

```bash
cd ../projects
git clone http://llvm.org/git/compiler-rt.git
git clone http://llvm.org/git/libcxx.git
git clone http://llvm.org/git/libcxxabi.git
cd ..
```

Create a build directory

```bash
cd ..
mkdir build && cd build
```

Run cmake to configure the build:

```bash
cmake -DLLVM_TARGETS_TO_BUILD=host -DCMAKE_BUILD_TYPE=MinSizeRel -DLLVM_EXPERIMENTAL_TARGETS_TO_BUILD=WebAssembly -DLLVM_INCLUDE_EXAMPLES=OFF -DLLVM_INCLUDE_TESTS=OFF -DCLANG_INCLUDE_TESTS=OFF -DCMAKE_INSTALL_PREFIX=$(pwd)/../release  ../src
```

Finally, run make

```bash
cmake --build . --target install -- -j2
```


Pack the release directory into a tar

```sh
cd ../release
tar -cvzf tarballname.tar.gz release/*
```

Upload the files to an ftp server

```bash
lftp 
set ftp:ssl-force true
set ssl:verify-certificate no
open famreiser.ch
login travis 
put filename
```


## Create CMake Deb Package

Travis, as well as the Build environment requires an up to date CMake version. Follow these commands to create a debian packages of cmake that can be installed on travis and the build machine.

```
wget https://cmake.org/files/v3.8/cmake-3.8.1.tar.gz
tar -xf cmake-3.8.1.tar.gz
cd cmake-3.8.1
./configure
make -j2
sudo checkinstall -y --install=no
```

The package can then be installed using

```bash
dpkg -i cmake_3.8.1-1_amd64.deb
```

Tar the file before uploading it (otherwise hoster reports file not found???):

```bash
tar -cvzf cmake-3.8.1.tar.gz cmake_3.8.1-1_amd64.deb
```

