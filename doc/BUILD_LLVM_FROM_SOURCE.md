# Build LLVM From Source

The WebAssembly backend is still experimental. Therefore, it is needed to build LLVM from source. Follow these instructions to build your own LLVM installation.
 
First, clone LLVM into a new directory:
 
```bash
git clone https://github.com/llvm-mirror/llvm.git
cd llvm
```

The next step is optional for end users (but needed if you want to develop on Speedy.js):

```bash
cd tools
git clone https://github.com/llvm-mirror/clang.git
cd ..
```

From here, all steps are mandatory for all users.
Create a directory for the build and make it the current working directory

```bash
mkdir build && cd build
```

Run cmake to configure the build:

```bash
cmake -DLLVM_TARGETS_TO_BUILD=host -DCMAKE_BUILD_TYPE=MinSizeRel -DLLVM_EXPERIMENTAL_TARGETS_TO_BUILD=WebAssembly -DLLVM_INCLUDE_EXAMPLES=OFF -DLLVM_INCLUDE_TESTS=OFF -DCLANG_INCLUDE_TESTS=OFF ..
```

It is strongly advised to change the installation directory by setting `-DCMAKE_INSTALL_PREFIX=path`. Otherwise LLVM is installed in the systems default location and might override your default Clang installation. 

Finally, run make

```bash
cmake --build . --target install -- -j3
```

The `-j3` defines how many processes are used to build LLVM. A good choice is to use the number of cores + 1.

LLVM is than either installed in the systems default path or the path you have specified. To check if the installation was successful run `llvm-config`

```bash
/path/to/installation/directory/llvm-config --version
```

e.g. 

```bash
~/git/llvm/bin/llvm-config --version
5.0.0svn
```

## Remarks

* For further details consolidate the [Building LLVM with CMAKE](http://llvm.org/docs/CMake.html) documentation.
* It might be needed to periodically updated the LLVM installation with newer Speedy.js releases. To do so, run git pull in the LLVM (and Clang) directory and then run make (configuration should not be needed).