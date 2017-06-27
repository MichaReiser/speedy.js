const path = require("path");

module.exports = {
    devtool: "#source-map",
    entry: {
        "benchmark": "./benchmarks-frontend.js",
        "results": "./results.js"
    },

    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js"
    },

    resolve: {
        extensions: [ '.ts', '.js', '.jsx' ]
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: "ts-loader",
                exclude: /-spdy\.ts$/
            }
        ],
        noParse: [
            /benchmark\/benchmark\.js/
        ]
    },
    node: {
        fs: "empty",
        path: "empty",
        Buffer: false
    },
    devServer: {
        compress: true
    }
};
