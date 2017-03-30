const path = require("path");

module.exports = {
    devtool: "#source-map",
    entry: "./benchmarks-frontend.js",

    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "bundle.js"
    },

    module: {
        noParse: [
            /benchmark\/benchmark\.js/
        ]
    },
    devServer: {
        compress: true
    }
};
