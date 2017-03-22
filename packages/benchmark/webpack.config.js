const path = require("path");

module.exports = {
    devtool: "#source-map",
    entry: "./benchmarks-frontend.js",

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
                include: path.resolve("./cases")
            }
        ],
        noParse: [
            /benchmark\/benchmark\.js/
        ]
    },
    devServer: {
        compress: true
    }
};
