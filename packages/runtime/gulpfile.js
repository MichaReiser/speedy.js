const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const gulp = require("gulp");
const del = require("del");
const tmp = require("tmp");
const util = require("util");
const merge = require("merge-stream");

const runSequence = require("run-sequence");

const EMSCRIPTEN_CACHE_DIR = path.resolve(".emscripten_cache");

gulp.task("default", ["build"]);

gulp.task("build", function (cb) {
    runSequence(
        "build:clean",
        "build:libs",
        "build:runtime",
        ["copy:release", "copy:libs"],
        cb
    );
});

gulp.task("test", function (cb) {
     runSequence(
         "test:clean",
         "test:build",
         "test:run",
         cb
     );
});

gulp.task("build:clean", function () {
     return del([
         "./cmake-build-release",
         EMSCRIPTEN_CACHE_DIR,
         "./bin"
     ]);
});

gulp.task("build:runtime", function () {
    fs.mkdirSync("cmake-build-release");

    const emscriptenCMake = path.resolve("./tools/emscripten/cmake/Modules/Platform/Emscripten.cmake");
    const command = util.format('cmake -E chdir cmake-build-release cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_TOOLCHAIN_FILE="%s" .. && cmake --build cmake-build-release --target speedyjs-runtime', emscriptenCMake);

    const env = Object.create(process.env);
    env.EM_CONFIG = path.resolve("./.emscripten");

    child_process.execSync(command, { env: env, stdio: "inherit" });
});

/**
 * Generating libcxx.a with embuilder fails for the given source code.
 * Therefore, just use another c++ source to generate the libcxx.a archive and
 * perform the same operation as embuilder would (overall, just translate and link any c++ file) to generate the needed libraries.
 * The output is generated in ./.emscripten_cache/wasm
 */
gulp.task("build:libs", function() {
    if (fs.existsSync(EMSCRIPTEN_CACHE_DIR)) {
        fs.mkdirSync(EMSCRIPTEN_CACHE_DIR);
    }

    const env = Object.create(process.env);
    env.EM_CONFIG = path.resolve("./.emscripten");

    const em = path.resolve("./tools/emscripten/em++");
    const sourceTmpFile = tmp.fileSync({ postfix: ".cc" });
    fs.writeFileSync(sourceTmpFile.name,
        "#include <vector>\n" +
        "int main() {\n" +
        "    std::vector<int> name {};" +
        "    return 0;\n" +
        "}"
    );

    const outputTmpFile = tmp.fileSync({ postfix: ".js" });

    child_process.execSync(util.format("%s %s -std=c++11 -o %s --cache %s", em, sourceTmpFile.name, outputTmpFile.name, EMSCRIPTEN_CACHE_DIR), { env: env, stdio: "inherit" });
    sourceTmpFile.removeCallback();
    outputTmpFile.removeCallback();
});

gulp.task("copy:libs", function () {
    return gulp.src([
        path.join(EMSCRIPTEN_CACHE_DIR, "wasm", "dlmalloc.bc"),
        path.join(EMSCRIPTEN_CACHE_DIR, "wasm", "libc.bc"),
        path.join(EMSCRIPTEN_CACHE_DIR, "wasm", "libcxx.a"),
        path.join(EMSCRIPTEN_CACHE_DIR, "wasm", "libcxxabi.bc"),
        path.join(EMSCRIPTEN_CACHE_DIR, "wasm", "wasm-libc.bc"),
        path.join(EMSCRIPTEN_CACHE_DIR, "wasm", "wasm_compiler_rt.a")
    ]).pipe(gulp.dest("./bin"));
});

gulp.task("copy:release", function () {
    return gulp.src("./cmake-build-release/CMakeFiles/speedyjs-runtime.dir/lib/*.o")
        .pipe(gulp.dest("./bin"));
});

gulp.task("test:clean", function () {
    return del([
        "./cmake-build-debug"
    ]);
});

gulp.task("test:build", function () {
    fs.mkdirSync("cmake-build-debug");

    const command = "cmake -E chdir cmake-build-debug cmake -DCMAKE_BUILD_TYPE=Debug .. && cmake --build cmake-build-debug --target runUnitTests";
    child_process.execSync(command, { stdio: "inherit" });
});

gulp.task("test:run", function () {
    child_process.execSync("./cmake-build-debug/test/runUnitTests", { stdio: "inherit" });
});
