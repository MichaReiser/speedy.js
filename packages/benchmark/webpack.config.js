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
