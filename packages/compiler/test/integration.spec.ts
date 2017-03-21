import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as tmp from "tmp";
import {Compiler} from "../src/compiler";

const CASE_REGEX = /\.case\.ts$/;
const TMP_FILE_REGEX = /\.case\.(js|ll)$/;
const TEST_CASES_DIR = path.resolve(__dirname, "./cases");

describe("Compiler Integration", () => {

    let tmpDirectory: tmp.SynchrounousResult;

    beforeAll(() => {
        llvm.initializeAllTargets();
        llvm.initializeAllTargetInfos();
        llvm.initializeAllAsmPrinters();
        llvm.initializeAllTargetMCs();
        llvm.initializeAllAsmParsers();
    });

    const cases = fs.readdirSync(TEST_CASES_DIR).filter(file => file.match(CASE_REGEX)).map(file => path.join(TEST_CASES_DIR, file));

    for (const testCase of cases) {
        test(path.basename(testCase).replace("case.ts", ""), () => {
            const options = { };
            const compilerHost = ts.createCompilerHost(options);
            const compiler = new Compiler(options, compilerHost);

            const { diagnostics, exitStatus } = compiler.compile([testCase]);

            expect(diagnostics).toEqual([]);
            expect(exitStatus).toBe(ts.ExitStatus.Success);

            const llFileName = testCase.replace(".ts", ".ll");

            if (!fs.existsSync(llFileName)) {
                throw new Error(`No .ll file has been generated. Is the function marked with "use speedyjs"?`);
            }

            const ll = fs.readFileSync(llFileName, "utf-8");

            expect(ll).toMatchSnapshot();
        });
    }

    afterAll(() => {
        const trash = fs.readdirSync(TEST_CASES_DIR).filter(file => file.match(TMP_FILE_REGEX)).map(file => path.join(TEST_CASES_DIR, file));
        trash.forEach(file => fs.unlinkSync(file));
        tmpDirectory.removeCallback();
    });
});
