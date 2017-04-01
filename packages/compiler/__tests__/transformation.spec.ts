import * as ts from "typescript";
import {compileSourceCode} from "../src/in-memory-compiler";
import {formatDiagnostics, reportDiagnostics} from "../src/util/diagnostics";
import {UninitializedSpeedyJSCompilerOptions} from "../src/speedyjs-compiler-options";

describe("Transformation", () => {
    const fibSourceCode =`
        async function fib(value: int): Promise<int> {
            "use speedyjs";

            if (value <= 2) {
                return 1;
            }
        
            return await fib(value - 2) + await fib(value - 1);
        }`;

    it("rewrites the speedyjs function to call into the web assembly module", () => {
        expectCompiledJSOutputMatchesSnapshot(fibSourceCode, "transform/fib.ts");
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
        expectCompiledJSOutputMatchesSnapshot(fibSourceCode, "transform/fib.ts", { totalMemory: 10 * 1024 * 1024 });
    });

    it("passes the configured total stack to the module loader", () => {
        expectCompiledJSOutputMatchesSnapshot(fibSourceCode, "transform/fib.ts", { totalStack: 1 * 1024 * 1024 });
    });

    it("passes the configured global base to the module loader", () => {
        expectCompiledJSOutputMatchesSnapshot(fibSourceCode, "transform/fib.ts", { globalBase: 4000 });
    });

    it("casts the return value for boolean functions to a bool value", () => {
        expectCompiledJSOutputMatchesSnapshot(`
        async function isTruthy(value: int) {
            "use speedyjs";
            return !value;
        }
        `, "transform/istruthy.ts");
    });

    function expectCompiledJSOutputMatchesSnapshot(sourceCode: string, fileName: string, compilerOptions?: UninitializedSpeedyJSCompilerOptions) {
        compilerOptions = createCompilerOptions(compilerOptions);
        const result = compileSourceCode(sourceCode, fileName, compilerOptions);

        if (result.diagnostics.length > 0) {
            const errors = formatDiagnostics(result.diagnostics);
            fail("Compilation failed with diagnostics: " + errors);
        }

        expect(result.exitStatus).toBe(ts.ExitStatus.Success);
        expect(result.outputText).toMatchSnapshot();
    }

    function createCompilerOptions(options?: ts.CompilerOptions) {
        return Object.assign({
            target: ts.ScriptTarget.ES2015,
            types: []
        }, options);
    }
});
