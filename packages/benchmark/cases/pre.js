var resolve;

var Module = {
    ENVIRONMENT: "WEB",
    initialized: new Promise(function (res) {
        resolve = res;
    }),

    locateFile: function (fileName) {
        if (fileName.indexOf(".wasm") === -1) {
            return fileName;
        }

        // simple trick to tell webpack only to include wasm files and not all files in the cases directory
        fileName = fileName.replace(".wasm", "");
        return require("file-loader!./" + fileName + ".wasm");
    },

    onRuntimeInitialized: function () {
        resolve();
    }
};
