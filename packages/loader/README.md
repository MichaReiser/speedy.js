# WebPack Loader for Speedy.js

[![npm version](https://badge.fury.io/js/speedyjs-loader.svg)](https://badge.fury.io/js/speedyjs-loader)

A WebPack loader for Speedy.js.
  
## Getting Started

Install with npm

```
npm install speedyjs-loader --save-dev
```

Also install the speedyjs compiler and the TypeScript version to use:

```
npm install --save-dev speedyjs-compiler MichaReiser/TypeScript#2.3.3-with-int
```

Add the loader to your WebPack configuration:

```js
return {
    devtool: "#source-map",
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: "speedyjs-loader",
                options: {
                    speedyJS: { // speedyjs compiler options
                        optimizationLevel: 2,
                        unsafe: false
                    }
                    // optional typescript configurations
                }
            }
        ]
    },
    node: { // do not emulate nodejs modules
        fs: "empty",
        path: "empty"
    }
}
```

Now you can start using speedy.js in your project.

For more details, go to the [main project page](https://github.com/MichaReiser/speedy.js).

## Example Project
[Speedy.js Playground](https://github.com/MichaReiser/speedy.js-playground) is a running example project.
