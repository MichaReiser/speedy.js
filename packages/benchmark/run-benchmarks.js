"use strict";

const benchmarkImport = require("benchmark");
const _ = require("lodash");
const platform = require("platform");
const deepEqual = require("deep-equal");

const Benchmark = window.Benchmark = benchmarkImport.runInContext( { _: _, platform: platform });

const TEST_CASES = {
    "monteCarlo": {
        args: [
            {
                investmentAmount: 620000,
                numRuns: 10000,
                numYears: 15,
                performance: 0.0340000,
                projects: [
                    {
                        startYear: 0,
                        totalAmount: 10000
                    }, {
                        startYear: 1,
                        totalAmount: 10000
                    }, {
                        startYear: 2,
                        totalAmount: 10000
                    }, {
                        startYear: 5,
                        totalAmount: 50000
                    }, {
                        startYear: 15,
                        totalAmount: 800000
                    }
                ],
                seed: 10,
                volatility: 0.0896000
            }
        ],
        result: [{
            "buckets": [{
                "max": 620000,
                "min": 620000,
                "subBuckets": {
                    "green": {"group": "green", "max": 620000, "min": 620000, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 620000,
                "min": 620000,
                "subBuckets": {
                    "green": {"group": "green", "max": 620000, "min": 620000, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 620000,
                "min": 620000,
                "subBuckets": {
                    "green": {"group": "green", "max": 620000, "min": 620000, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 620000,
                "min": 620000,
                "subBuckets": {
                    "green": {"group": "green", "max": 620000, "min": 620000, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 620000,
                "min": 620000,
                "subBuckets": {
                    "green": {"group": "green", "max": 620000, "min": 620000, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 620000,
                "min": 620000,
                "subBuckets": {
                    "green": {"group": "green", "max": 620000, "min": 620000, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 620000,
                "min": 620000,
                "subBuckets": {
                    "green": {"group": "green", "max": 620000, "min": 620000, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 620000,
                "min": 620000,
                "subBuckets": {
                    "green": {"group": "green", "max": 620000, "min": 620000, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 620000,
                "min": 620000,
                "subBuckets": {
                    "green": {"group": "green", "max": 620000, "min": 620000, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 620000,
                "min": 620000,
                "subBuckets": {
                    "green": {"group": "green", "max": 620000, "min": 620000, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }],
            "groups": [{
                "description": "Ziel erreichbar",
                "from": 10000,
                "name": "green",
                "percentage": 1,
                "separator": true
            }],
            "max": 620000,
            "median": 620000,
            "min": 620000,
            "project": {"startYear": 0, "totalAmount": 10000},
            "twoThird": {"max": 620000, "min": 620000}
        }, {
            "buckets": [{
                "max": 559364,
                "min": 419363,
                "subBuckets": {
                    "green": {"group": "green", "max": 559364, "min": 419363, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 583415,
                "min": 559388,
                "subBuckets": {
                    "green": {"group": "green", "max": 583415, "min": 559388, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 601148,
                "min": 583435,
                "subBuckets": {
                    "green": {"group": "green", "max": 601148, "min": 583435, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 616518,
                "min": 601164,
                "subBuckets": {
                    "green": {"group": "green", "max": 616518, "min": 601164, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 629998,
                "min": 616538,
                "subBuckets": {
                    "green": {"group": "green", "max": 629998, "min": 616538, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 643077,
                "min": 630038,
                "subBuckets": {
                    "green": {"group": "green", "max": 643077, "min": 630038, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 659013,
                "min": 643083,
                "subBuckets": {
                    "green": {"group": "green", "max": 659013, "min": 643083, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 676411,
                "min": 659025,
                "subBuckets": {
                    "green": {"group": "green", "max": 676411, "min": 659025, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 701358,
                "min": 676414,
                "subBuckets": {
                    "green": {"group": "green", "max": 701358, "min": 676414, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 829886,
                "min": 701363,
                "subBuckets": {
                    "green": {"group": "green", "max": 829886, "min": 701363, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }],
            "groups": [{
                "description": "Ziel erreichbar",
                "from": 10000,
                "name": "green",
                "percentage": 1,
                "separator": true
            }],
            "max": 829886,
            "median": 630018,
            "min": 419363,
            "project": {"startYear": 1, "totalAmount": 10000},
            "twoThird": {"max": 683846, "min": 576659}
        }, {
            "buckets": [{
                "max": 542219,
                "min": 394201,
                "subBuckets": {
                    "green": {"group": "green", "max": 542219, "min": 394201, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 574737,
                "min": 542262,
                "subBuckets": {
                    "green": {"group": "green", "max": 574737, "min": 542262, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 597657,
                "min": 574760,
                "subBuckets": {
                    "green": {"group": "green", "max": 597657, "min": 574760, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 618702,
                "min": 597702,
                "subBuckets": {
                    "green": {"group": "green", "max": 618702, "min": 597702, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 638832,
                "min": 618742,
                "subBuckets": {
                    "green": {"group": "green", "max": 638832, "min": 618742, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 658841,
                "min": 638837,
                "subBuckets": {
                    "green": {"group": "green", "max": 658841, "min": 638837, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 680412,
                "min": 658848,
                "subBuckets": {
                    "green": {"group": "green", "max": 680412, "min": 658848, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 707276,
                "min": 680483,
                "subBuckets": {
                    "green": {"group": "green", "max": 707276, "min": 680483, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 744870,
                "min": 707297,
                "subBuckets": {
                    "green": {"group": "green", "max": 744870, "min": 707297, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 945557,
                "min": 744914,
                "subBuckets": {
                    "green": {"group": "green", "max": 945557, "min": 744914, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }],
            "groups": [{
                "description": "Ziel erreichbar",
                "from": 10000,
                "name": "green",
                "percentage": 1,
                "separator": true
            }],
            "max": 945557,
            "median": 638834.5,
            "min": 394201,
            "project": {"startYear": 2, "totalAmount": 10000},
            "twoThird": {"max": 718694, "min": 565420}
        }, {
            "buckets": [{
                "max": 530943,
                "min": 337421,
                "subBuckets": {
                    "green": {"group": "green", "max": 530943, "min": 337421, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 581438,
                "min": 531063,
                "subBuckets": {
                    "green": {"group": "green", "max": 581438, "min": 531063, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 620384,
                "min": 581441,
                "subBuckets": {
                    "green": {"group": "green", "max": 620384, "min": 581441, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 655363,
                "min": 620403,
                "subBuckets": {
                    "green": {"group": "green", "max": 655363, "min": 620403, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 689173,
                "min": 655394,
                "subBuckets": {
                    "green": {"group": "green", "max": 689173, "min": 655394, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 724326,
                "min": 689181,
                "subBuckets": {
                    "green": {"group": "green", "max": 724326, "min": 689181, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 762652,
                "min": 724341,
                "subBuckets": {
                    "green": {"group": "green", "max": 762652, "min": 724341, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 812291,
                "min": 762653,
                "subBuckets": {
                    "green": {"group": "green", "max": 812291, "min": 762653, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 882989,
                "min": 812360,
                "subBuckets": {
                    "green": {"group": "green", "max": 882989, "min": 812360, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 1363824,
                "min": 883237,
                "subBuckets": {
                    "green": {"group": "green", "max": 1363824, "min": 883237, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }],
            "groups": [{
                "description": "Ziel erreichbar",
                "from": 50000,
                "name": "green",
                "percentage": 1,
                "separator": true
            }],
            "max": 1363824,
            "median": 689177,
            "min": 337421,
            "project": {"startYear": 5, "totalAmount": 50000},
            "twoThird": {"max": 832898, "min": 567566}
        }, {
            "buckets": [{
                "max": 546979,
                "min": 207622,
                "subBuckets": {
                    "green": {
                        "group": "green",
                        "max": -9007199254740991,
                        "min": 9007199254740991,
                        "empty": true
                    },
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": 546979, "min": 207622, "empty": false},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 641120,
                "min": 547155,
                "subBuckets": {
                    "green": {
                        "group": "green",
                        "max": -9007199254740991,
                        "min": 9007199254740991,
                        "empty": true
                    },
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": 641120, "min": 547155, "empty": false},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 716557,
                "min": 641144,
                "subBuckets": {
                    "green": {
                        "group": "green",
                        "max": -9007199254740991,
                        "min": 9007199254740991,
                        "empty": true
                    },
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": 716557, "min": 641144, "empty": false},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 789165,
                "min": 716562,
                "subBuckets": {
                    "green": {
                        "group": "green",
                        "max": -9007199254740991,
                        "min": 9007199254740991,
                        "empty": true
                    },
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": 789165, "min": 716562, "empty": false},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 859271,
                "min": 789180,
                "subBuckets": {
                    "green": {"group": "green", "max": 859271, "min": 800022, "empty": false},
                    "yellow": {"group": "yellow", "max": 799824, "min": 790006, "empty": false},
                    "gray": {"group": "gray", "max": 789894, "min": 789180, "empty": false},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 936752,
                "min": 859312,
                "subBuckets": {
                    "green": {"group": "green", "max": 936752, "min": 859312, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 1032315,
                "min": 936988,
                "subBuckets": {
                    "green": {"group": "green", "max": 1032315, "min": 936988, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 1151953,
                "min": 1032388,
                "subBuckets": {
                    "green": {"group": "green", "max": 1151953, "min": 1032388, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 1335225,
                "min": 1151990,
                "subBuckets": {
                    "green": {"group": "green", "max": 1335225, "min": 1151990, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }, {
                "max": 3087402,
                "min": 1335487,
                "subBuckets": {
                    "green": {"group": "green", "max": 3087402, "min": 1335487, "empty": false},
                    "yellow": {"group": "yellow", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "gray": {"group": "gray", "max": -9007199254740991, "min": 9007199254740991, "empty": true},
                    "red": {"group": "red", "max": -9007199254740991, "min": 9007199254740991, "empty": true}
                }
            }],
            "groups": [{
                "description": "Ziel erreichbar",
                "from": 800000,
                "name": "green",
                "percentage": 0.5848,
                "separator": true
            }, {
                "description": "mit Zusatzliquidität erreichbar",
                "from": 790000,
                "name": "yellow",
                "percentage": 0.014,
                "separator": true,
                "to": 800000
            }, {
                "description": "nicht erreichbar",
                "name": "gray",
                "percentage": 0.4012,
                "separator": false,
                "to": 790000
            }],
            "max": 3087402,
            "median": 859291.5,
            "min": 207622,
            "project": {"startYear": 15, "totalAmount": 800000},
            "twoThird": {"max": 1203055, "min": 612657}
        }]
    },
    "nbody": {
        args: [10000000],
        result: -0.16907784165413997
    },
    "factorize": {
        args: [183626381],
        result: 183626381
    },
    "tspInt": {
        args: [],
        result: 500074.11491760757
    },
    "simjs": {
        args: [10, 1000],
        result: 969.1866817441974
    },
    "tspArrayInt": {
        args: [],
        result: 500074.11491760757
    },
    "tspArrayDouble": {
        args: [],
        result: 500016.6164722443
    },
    "tspDouble": {
        args: [],
        result: 500016.6164722443
    },
    "mergeSort": {
        args: [],
        result: 1659.0906736166776
    },
    "mergeSortInt": {
        args: [],
        result: 7.643593152571829e+21
    },
    "fib": {
        fnName: "fib",
        args: [40],
        result: 102334155
    },
    "isPrime": {
        args: [2147483647],
        result: true
    },
    "nsieve": {
        args: [40000],
        result: 4203
    },
    // "createPoints": {
    //     args: [10],
    //     result: 114038
    // },
    "doubleAdd": {
        args: [],
        result: 1.0000099999980838
    },
    "doubleCompare": {
        args: [],
        result: 4999951.000000405
    },
    "intCompare": {
        args: [2548965],
        result: 2548965
    },
    "arrayReverse": {
        args: [],
        result: 1248.9035770674525
    }
};

const jsModules = require.context("./cases", false, /.*^(?:(?!-spdy\.ts$).)*\.ts$/);

function getJsFunctionForTestCase(caseName) {
    const testCase = TEST_CASES[caseName];
    const fnName = TEST_CASES[caseName].fnName || caseName;
    const fn = jsModules("./" + caseName + ".ts")[fnName];

    function jsFunctionWrapper() {
        return Promise.resolve(fn.apply(undefined, testCase.args));
    }

    return jsFunctionWrapper;
}

const wasmModules = require.context("!speedyjs-loader?{speedyJS:{unsafe: true, exportGc: true, disableHeapNukeOnExit: true, optimizationLevel: 3, binaryenOpt: true}}!./cases", false, /.*-spdy\.ts/);
function getWasmFunctionForTestCase(caseName) {
    const testCase = TEST_CASES[caseName];
    const fnName = testCase.fnName || caseName;

    const wasmModule = wasmModules("./" + caseName + "-spdy.ts");
    const fn = wasmModule[fnName];
    const gc = wasmModule["speedyJsGc"];

    function wasmFunctionWrapper() {
        return fn.apply(undefined, testCase.args);
    }

    return { fn: wasmFunctionWrapper, gc: gc };
}

const emccModules = require.context("exports-loader?Module!./cases", false, /.*-emcc\.js$/);
async function getEmccFunctionForTestCase(caseName) {
    const testCase = TEST_CASES[caseName];
    const fnName = testCase.fnName || caseName;

    const emccModule = emccModules("./" + caseName + "-emcc.js");
    await emccModule.initialized;

    const fn = emccModule["_" + fnName];

    function emccFunctionWrapper() {
        let result = fn.apply(undefined, testCase.args);
        if (typeof(testCase.result) === "boolean") {
            result = result !== 0;
        }

        return Promise.resolve(result);
    }

    return emccFunctionWrapper;
}

async function addBenchmark(suite, testCase, run) {
    const caseName = suite.name;

    const jsFn = getJsFunctionForTestCase(caseName);
    const { fn: wasmFn, gc: speedyJsGc } = getWasmFunctionForTestCase(caseName);
    const emccFn = await getEmccFunctionForTestCase(caseName);

    // call each function once to not profile loading time
    jsFn();
    await wasmFn();
    speedyJsGc();

    await emccFn();

    suite.add(run ? `js-${run}` : "js", function (deferred) {
        jsFn().then(function (result) {
            if (!deepEqual(result, testCase.result)) {
                throw new Error(`JS Result for Test Case ${caseName} returned incorrect result`, result, testCase.result);
            }

            deferred.resolve();
        });
    }, {
        defer: true
    });

    suite.add(run ? `emcc-${run}` : "emcc", function (deferred) {
        emccFn().then(function (result) {
            if (result !== testCase.result) {
                throw new Error(`EMCC Result for Test Case ${caseName} returned ${result} instead of ${testCase.result}`);
            }

            deferred.resolve();
        });
    }, {
        defer: true
    });

    suite.add(run ? `wasm-${run}` : "wasm", function (deferred) {
            wasmFn().then(function (result) {
                if (result !== testCase.result) {
                    throw new Error(`WASM Result for Test Case ${caseName} returned ${result} instead of ${testCase.result}`);
                }

                deferred.resolve();
            });
        },
        {
            defer: true,
            onCycle: function () { // Is not called after each loop, but after some execution, so might need a little bit more memory
                speedyJsGc();
            }
        }
    );

    return suite;
}

async function createSuite(caseName, numRuns = 1) {
    const suite = new Benchmark.Suite(caseName, { async: true });
    if (numRuns === 1) {
        await addBenchmark(suite, TEST_CASES[caseName]);
    } else {
        for (let i = 0; i < numRuns; ++i) {
            await addBenchmark(suite, TEST_CASES[caseName], i);
        }
    }

    return suite;
}

function runSuites(numRuns = 1, beforeRun, progress) {
    const pendingNames = Object.keys(TEST_CASES).reverse();
    const totalCases = pendingNames.length;

    function processNext() {
        if (pendingNames.length === 0) {
            return;
        }

        progress(totalCases - pendingNames.length, totalCases);

        const next = pendingNames.pop();
        return createSuite(next, numRuns)
            .then(suite => {
                return new Promise((resolve, reject) => {
                    beforeRun(suite);

                    suite.on("complete", resolve);
                    suite.on("error", reject);

                    suite.run({ async: true });
                });
            })
            .then(processNext);
    }

    return Promise.resolve(1).then(processNext);
}

module.exports = runSuites;


