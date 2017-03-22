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
        "build:runtime:configure",
        ["build:runtime:safe", "build:runtime:unsafe"],
        ["copy:release:safe", "copy:release:unsafe", "copy:libs"],
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

gulp.task("build:runtime:configure", function () {
    fs.mkdirSync("cmake-build-release");

    const emscriptenCMake = path.resolve("./tools/emscripten/cmake/Modules/Platform/Emscripten.cmake");
    const command = util.format('cmake -E chdir cmake-build-release cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_TOOLCHAIN_FILE="%s" ..', emscriptenCMake);

    child_process.execSync(command, { env: process.env, stdio: "inherit" });
});

gulp.task("build:runtime:safe", function () {
    const command = "cmake --build cmake-build-release --target speedyjs-runtime";
    child_process.execSync(command, { env: process.env, stdio: "inherit" });
});

gulp.task("build:runtime:unsafe", function () {
    const command = "cmake --build cmake-build-release --target speedyjs-runtime-unsafe";
    child_process.execSync(command, { env: process.env, stdio: "inherit" });
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
    const libs = ["dlmalloc.bc", "libc.bc", "libcxx.a", "libcxxabi.bc", "wasm-libc.bc", "wasm_compiler_rt.a"];
    const src = gulp.src(libs.map(lib => path.join(EMSCRIPTEN_CACHE_DIR, "wasm", lib)));

    return src.pipe(gulp.dest("./bin/shared"));
});

gulp.task("copy:release:safe", function () {
    return gulp.src("./cmake-build-release/CMakeFiles/speedyjs-runtime.dir/lib/*.o")
        .pipe(gulp.dest("./bin/safe"));
});

gulp.task("copy:release:unsafe", function () {
    return gulp.src("./cmake-build-release/CMakeFiles/speedyjs-runtime-unsafe.dir/lib/*.o")
        .pipe(gulp.dest("./bin/unsafe"));
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
