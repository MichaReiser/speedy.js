module.exports = function (config) {

    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: "",

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: [
            'benchmark'
        ],

        reporters: [
            'benchmark',
            'json'
        ],

        jsonReporter: {
            stdout: false,
            outputFile: 'results.json' // defaults to none
        },

        // list of files / patterns to load in the browser
        files: [
            "specs/benchmark.js"
        ],

        // list of files to exclude
        exclude: [],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            "./specs/benchmark.js": ["webpack", "sourcemap"]
        },

        captureTimeout: 60000,
        browserNoActivityTimeout: 120000,

        webpack: require("./webpack.config.js"),
        webpackMiddleware: {
            stats: {
                chunks: false
            }
        },

        client: {
            mocha: {
                // change Karma's debug.html to the mocha web reporter
                reporter: 'html'
            }
        },

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ["Firefox", "ChromeCanary"],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: 1,
    });
};

