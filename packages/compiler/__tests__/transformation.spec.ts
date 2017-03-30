import * as ts from "typescript";
import {compileSourceCode} from "../src/in-memory-compiler";
import {formatDiagnostics, reportDiagnostics} from "../src/util/diagnostics";
import {UninitializedSpeedyJSCompilerOptions} from "../src/speedyjs-compiler-options";

describe("Transformation", () => {
    const defaultCompilerOptions = { target: ts.ScriptTarget.ES2015 };

    const speedyPrimeSourceCode =`
        async function isPrime(value: int) {
            "use speedyjs";
            if (value <= 2) {
                return false;
            }
    
            for (let i = 2; i < (Math.sqrt(value)|0); ++i) {
                if (value % i === 0) {
                    return false;
                }
            }
            return true;
        }`;

    it("rewrites the speedyjs function to call into the web assembly module", () => {
        expectCompiledJSOutputMatchesSnapshot(speedyPrimeSourceCode, "transform/isPrime.ts");
    });

    it("does not rewrite source files without any speedyjs functions", function () {
         expectCompiledJSOutputMatchesSnapshot(
             `
             function isPrime(value: int) {
                if (value <= 2) {
                    return false;
                }
                
                for (let i = 2; i < (Math.sqrt(value)|0); ++i) {
                    if (value % i === 0) {
                        return false;
                    }
                }
                return true;
            }
             `, "transform/isPrime.ts");
    });

    it("passes the configured total memory to the module loader", () => {
        expectCompiledJSOutputMatchesSnapshot(speedyPrimeSourceCode, "transform/isPrime.ts", { totalMemory: 10 * 1024 * 1024, target: ts.ScriptTarget.ES2015 });
    });

    it("passes the configured total stack to the module loader", () => {
        expectCompiledJSOutputMatchesSnapshot(speedyPrimeSourceCode, "transform/isPrime.ts", { totalStack: 1 * 1024 * 1024, target: ts.ScriptTarget.ES2015 });
    });

    it("passes the configured global base to the module loader", () => {
        expectCompiledJSOutputMatchesSnapshot(speedyPrimeSourceCode, "transform/isPrime.ts", { globalBase: 4000, target: ts.ScriptTarget.ES2015 });
    });

    function expectCompiledJSOutputMatchesSnapshot(sourceCode: string, fileName: string, compilerOptions?: UninitializedSpeedyJSCompilerOptions) {
        const result = compileSourceCode(sourceCode, fileName, compilerOptions || defaultCompilerOptions);

        if (result.diagnostics.length > 0) {
            const errors = formatDiagnostics(result.diagnostics);
            fail("Compilation failed with diagnostics: " + errors);
        }

        expect(result.exitStatus).toBe(ts.ExitStatus.Success);
        expect(result.outputText).toMatchSnapshot();
    }
});
