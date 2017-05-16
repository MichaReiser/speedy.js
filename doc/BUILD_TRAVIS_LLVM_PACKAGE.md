# Build Travis LLVM Package
The web assembly backend is not yet included in the prebuild llvm versions. Therefore, a custom build is needed. Building llvm from source in every build takes to much time so that travis kills the build job.

!!! Requires at least 80GB of free disk space !!!

Uses Ubuntu trusty.
 
Install Dependencies

```sh
apt-get update
apt-get install python-software-properties wget nano
apt-get source llvm-toolchain-snapshot
sudo add-apt-repository ppa:ubuntu-toolchain-r/ppa
wget -O - http://apt.llvm.org/llvm-snapshot.gpg.key | apt-key add -
echo "deb http://apt.llvm.org/trusty/ llvm-toolchain-trusty main" | tee -a /etc/apt/sources.list
echo "deb-src http://apt.llvm.org/trusty/ llvm-toolchain-trusty main" | tee -a /etc/apt/sources.list
apt-get update
apt-get install devscripts fakeroot g++ dh-make dh-ocaml checkinstall libffi-dev python-sphinx python-dev swig libjsoncpp-dev help2man subversion rsync quilt help2man chrpath lftp git ocaml -y
```

Install up to date cmake

```sh
wget https://cmake.org/files/v3.8/cmake-3.8.1.tar.gz
tar -xf cmake-3.8.1.tar.gz
cd cmake-3.8.1
./configure
make -j2
checkinstall -y 
cd ..
```

Fetch llvm-toolchain 

```sh
debcheckout svn://anonscm.debian.org/svn/pkg-llvm/llvm-toolchain/ 
cd llvm-toolchain/branches
```

Tar latest version
```
sh snapshot/debian/orig-tar.sh
sh unpack.sh
cd llvm-toolchain-snapshot...
```

Edit `debian/rules` and Search for `CMAKE_EXTRA =`. Change it to `CMAKE_EXTRA=-DLLVM_EXPERIMENTAL_TARGETS_TO_BUILD=WebAssembly`

Build Binary but disable unit tests first. `Parallel=3` indicates how many processes are used for building. The more cores you have, the better!

```sh
export DEB_BUILD_OPTIONS="nocheck parallel=3"
fakeroot debian/rules binary
```

Compress Output

```sh
cd ..
tar -cvzf tarballname.tar.gz *.deb
```


Upload

```bash
lftp 
set ftp:ssl-force true
set ssl:verify-certificate no
open famreiser.ch
login travis 
put filename
```

see: http://apt.llvm.org/building-pkgs.php


## Alternative

Build directly from source

```bash
git clone https://github.com/llvm-mirror/llvm.git
cd llvm/tools
git clone https://github.com/llvm-mirror/clang.git
cd ..
mkdir build && cd build
cmake -DLLVM_TARGETS_TO_BUILD= -DCMAKE_BUILD_TYPE=Debug -DLLVM_EXPERIMENTAL_TARGETS_TO_BUILD=WebAssembly -DLLVM_INCLUDE_EXAMPLES=OFF -DLLVM_INCLUDE_TESTS=OFF ..
make -j2
```

Delete all CMakeFiles

```sh
find . -type d -name CMakeFiles -exec rm  -rf {} \;
```
