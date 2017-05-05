# Speedy.js

[![Build Status](https://travis-ci.com/MichaReiser/speedy.js.svg?token=zNrpU9MqErk5Uafzosnz&branch=master)](https://travis-ci.com/MichaReiser/speedy.js)

A very experimental TypeScript to WebAssembly compiler. This is a prototype far away from being production ready.
The intend is not to cover the whole TypeScript language as such can not be implemented efficiently without runtime optimizations. And besides, the browsers JIT already do a an amazing job to run TypeScript efficient. 
Instead, a subset of TypeScript is supported that only provides the essential language features to guarantee efficient and only require
a small runtime, and therefore, smaller assemblies.
 
 
## Prerequisites 

1. A lot of disk space (+30gb)
2. A lot of ram (+8gb)
3. A lot of patience
4. An up to date C++ compiler, and other build essentials (see [llvm requirements](http://llvm.org/docs/GettingStarted.html#requirements))

These requirements will change as soon as the WebAssembly Backend for LLVM is no longer experimental and 
included in your platforms build by default.

## Getting started

Clone the git repository 

```
git clone --recursive https://github.com/MichaReiser/speedy.js.git
```

and run the `install` and `bootstrap` scripts in the just cloned directory.

```
npm install
npm run bootstrap
```

The bootstrap script is going to take a while as it clones the latest version of LLVM and clang and builds them from source. So its best if you take a nape, do you groceries...

Alternatively, llvm and clang can be [build manually](http://llvm.org/docs/CMake.html) from source including the flag `-DLLVM_EXPERIMENTAL_TARGETS_TO_BUILD=WebAssembly`. The `npm run bootstrap` script will pick up your llvm installation if the `LLVM` environment variable is set.

```
LLVM=/usr/local/bin npm run bootstrap
```

## Compile your first Script

Functions that are to be compiled by speedy js have to be marked with the `use speedyjs` directive.


fib.ts:

```typescript
export async function fib(value: int): Promise<int> {
    "use speedyjs";

    return fibSync(value);
}

function fibSync(value: int): int {
    "use speedyjs";

    if (value <= 2) {
        return 1;
    }

    return fibSync(value - 2) + fibSync(value - 1);
}

fib(1000);
```

The compiler will compile the `fib` and `fibSync` function to WebAssembly whereas the call to fib remains in pure JS. 

The script can be compiled using

```
node packages/compiler/cli.js fib.ts
```

which outputs the fib.js file. 

To compile all files in the current directory omit any file names or pass multiple file names to compile each of them.


## WebPack Loader

The package `loader` contains a webpack loader implementation. See `packages/benchmark/webpack.config.js` for more details.
