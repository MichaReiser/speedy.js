const path = require("path");

module.exports = {
    devtool: "#source-map",
    entry: "./specs/benchmark.js",

    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "bundle.js"
    },

    module: {
        rules: [
            {
                test: /\.wasm$/,
                loader: require.resolve("./binary-loader")
            },
            {
                test: /\.ts$/,
                loader: "ts-loader",
                exclude: path.resolve("./cases")
            }
        ],
        noParse: [
            /benchmark\/benchmark\.js/
        ]
    },
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        compress: true
    }
};
