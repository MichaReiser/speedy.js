const path = require("path");
const travis = process.env.TRAVIS;

module.exports = function (config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: "",

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],

        reporters: [
            "dots",
            "kjhtml"
        ],

        // list of files / patterns to load in the browser
        files: [
            "__integrationtests__/index.js"
        ],

        // list of files to exclude
        exclude: [],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            "__integrationtests__/index.js": ["webpack", "sourcemap"]
        },

        captureTimeout: 120000,
        browserNoActivityTimeout: 120000,

        webpack: {
            devtool: "#source-map",
            module: {
                rules: [
                    {
                        test: /\.ts$/,
                        loader: "speedyjs-loader",
                        options: {
                            tsconfig: path.resolve(__dirname, "__integrationtests__/tsconfig.json"),
                            speedyJS: {
                                optimizationLevel: 2,
                                unsafe: false
                            }
                        }
                    }
                ]
            },
            node: {
                fs: "empty",
                path: "empty",
                Buffer: false
            },
        },
        webpackMiddleware: {
            stats: {
                chunks: false
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
        autoWatch: true,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ["Firefox", "ChromeCanary"],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false
    });

    if (travis) {
        const customLaunchers = {
            sl_chrome: {
                base: 'SauceLabs',
                browserName: 'chrome',
                platform: 'Windows 8.1',
                version: '57'
            },
            sl_firefox: {
                base: 'SauceLabs',
                browserName: 'firefox',
                version: "52"
            }
        };

        config.set({
            sauceLabs: {
                testName: 'speedyjs',
                recordScreenshots: false,
                tunnelIdentifier: process.env["TRAVIS_JOB_NUMBER"],
                startConnect: false
            },
            customLaunchers: customLaunchers,
            browsers: Object.keys(customLaunchers),
            reporters: ['dots', 'saucelabs'],
            singleRun: true
        });
    }
};

