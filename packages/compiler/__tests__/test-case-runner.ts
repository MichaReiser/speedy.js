import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as tmp from "tmp";
import {Compiler} from "../src/compiler";
import {SpeedyJSCompilerOptions} from "../src/speedyjs-compiler-options";
import {reportDiagnostics} from "../src/util/diagnostics";

const CASE_REGEX = /\.ts$/;
const TEST_CASES_DIR = path.resolve(__dirname, "./cases");
const OUT_DIR = path.join(__dirname, "tmp");

llvm.initializeAllTargets();
llvm.initializeAllTargetInfos();
llvm.initializeAllAsmPrinters();
llvm.initializeAllTargetMCs();
llvm.initializeAllAsmParsers();

/**
 * Runs all test cases located in the ./cases/directory folder
 * @param name name of the test case
 * @param directory the ./cases relative folder that contains the test cases
 */
export function runCases(name: string, directory: string) {
    const absoluteDirectory = path.join(TEST_CASES_DIR, directory);
    const cases = fs.readdirSync(absoluteDirectory).filter(file => file.match(CASE_REGEX)).map(file => path.join(absoluteDirectory, file));

    describe(name, () => {

        let tmpDirectory: tmp.SynchrounousResult;
        let compilerOptions: SpeedyJSCompilerOptions;
        let compilerHost: ts.CompilerHost;

        beforeAll(() => {
            const tsConfigName = path.join(__dirname, "cases", "./tsconfig.json");
            const tsConfigTxt = ts.sys.readFile(tsConfigName);
            const optionsAsJson = ts.parseConfigFileTextToJson(tsConfigName, tsConfigTxt).config;

            compilerOptions = ts.parseJsonConfigFileContent(optionsAsJson, ts.sys, __dirname, ts.getDefaultCompilerOptions(), tsConfigName).options as SpeedyJSCompilerOptions;
            compilerOptions.emitLLVM = true;
            compilerOptions.rootDir = TEST_CASES_DIR;
            compilerOptions.outDir = OUT_DIR;
            compilerHost = ts.createCompilerHost(compilerOptions);
        });

        for (const testCase of cases) {
            test(path.basename(testCase).replace(".ts", ""), () => {
                const compiler = new Compiler(compilerOptions, compilerHost);

                const { diagnostics, exitStatus } = compiler.compile([testCase]);

                if (diagnostics.length > 0) {
                    const error = ts.formatDiagnostics(diagnostics, compilerHost);
                    fail(`Expected Diagnostics to be empty but are\n${error}.`);
                }
                expect(exitStatus).toBe(ts.ExitStatus.Success);

                const llFileName = path.join(OUT_DIR, directory, path.basename(testCase).replace(".ts", ".ll"));

                if (!fs.existsSync(llFileName)) {
                    throw new Error(`No .ll file has been generated. Is the function marked with "use speedyjs"?`);
                }

                const ll = fs.readFileSync(llFileName, "utf-8");

                expect(ll).toMatchSnapshot();
            });
        }

        afterAll(() => {
            const trash = fs.readdirSync(OUT_DIR).map(file => path.join(OUT_DIR, file));
            trash.forEach(file => fs.unlinkSync(file));
            tmpDirectory.removeCallback();
        });
    });
}
