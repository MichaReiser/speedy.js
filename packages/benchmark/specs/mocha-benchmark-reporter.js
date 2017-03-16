const mocha = require("mocha");

function MochaBenchmarkReporter(runner) {
    mocha.reporters.Base.call(this, runner);
    
    runner.on("test start", function () {
        console.log("start", arguments);
    });

    runner.on("pass", function (test) {
        console.log("pass", arguments);
    });

    runner.on("test end  ", function () {
        console.log("end", arguments);
    });
}

module.exports = MochaBenchmarkReporter;
