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
                
                for (let i = 2; i <= (Math.sqrt(value)|0); ++i) {
                    if (value % i === 0) {
                        return false;
                    }
                }
                return true;
            }
             `, "transform/isPrime.ts");
    });

    it("passes the configured initial memory to the module loader", () => {
        expectCompiledJSOutputMatchesSnapshot(fibSourceCode, "transform/fib.ts", { initialMemory: 10 * 1024 * 1024 });
    });

    it("passes the configured total stack to the module loader", () => {
        expectCompiledJSOutputMatchesSnapshot(fibSourceCode, "transform/fib.ts", { totalStack: 1 * 1024 * 1024 });
    });

    it("passes the configured global base to the module loader", () => {
        expectCompiledJSOutputMatchesSnapshot(fibSourceCode, "transform/fib.ts", { globalBase: 4000 });
    });

    it("exposes the gc function if exposeGc is set", () => {
        expectCompiledJSOutputMatchesSnapshot(fibSourceCode, "transform/fib.ts", { exposeGc: true });
    });

    it("exports the gc function if exportGc is set", () => {
        expectCompiledJSOutputMatchesSnapshot(fibSourceCode, "transform/fib.ts", { exportGc: true });
    });

    it("casts the return value for boolean functions to a bool value", () => {
        expectCompiledJSOutputMatchesSnapshot(`
        async function isTruthy(value: int) {
            "use speedyjs";
            return !value;
        }
        `, "transform/istruthy.ts");
    });

    it("converts Array and Objects to WASM arrays and Objects", () => {
        expectCompiledJSOutputMatchesSnapshot(`
        class Test {
            updated: boolean;
            value: number;
        }
        
        async function update(instance: Test, values: number[]) {
            "use speedyjs";
            
            instance.updated = true;
            instance.value = 0.0;
            for (let i = 0; i < values.length; ++i) {
                instance.value += values[i];
            }
            
            return instance.value;
        }
        `, "transform/converts-arrays-and-object.ts");
    });

    it("converts a returned WASM array to a JS array", () => {
        expectCompiledJSOutputMatchesSnapshot(`
        async function update() {
            "use speedyjs";
            
            return [1, 2, 3, 4];
        }
        `, "transform/converts-returned-arrays.ts");
    });

    it("converts the returned WASM Object to a JS Object", () => {
        expectCompiledJSOutputMatchesSnapshot(`
        class Test {
            updated: boolean;
            value: number;
        }
        
        async function update(values: number[]) {
            "use speedyjs";
            
            const instance = new Test();
            instance.updated = true;
            instance.value = 0.0;
            for (let i = 0; i < values.length; ++i) {
                instance.value += values[i];
            }
            
            return instance.value;
        }
        `, "transform/converts-arrays-and-object.ts");
    });

    it("emits a diagnostic if a non entry speedyjs function is referenced from normal JavaScriptCode", () => {
        const compilerOptions = createCompilerOptions();
        const source = `
        function nonEntryFunction(value: number) {
            "use speedyjs";
            
            return value ** 2;
        }
        
        const sqr = nonEntryFunction(10);
        `;

        const {exitStatus, diagnostics } = compileSourceCode(source, "test.ts", compilerOptions);

        expect(exitStatus).toBe(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
        expect(formatDiagnostics(diagnostics)).toMatchSnapshot();
    });

    it("does not emit a diagnostic if a speedyjs method is referenced from normal JavaScriptCode", () => {
        const compilerOptions = createCompilerOptions();
        const source = `
        class Test {
            nonEntryFunction(value: number) {
                "use speedyjs";
            
                return value ** 2;
            }    
        }
                
        const instance = new Test();
        const sqr = instance.nonEntryFunction(10);
        `;

        const {exitStatus, diagnostics } = compileSourceCode(source, "test.ts", compilerOptions);
        expect(exitStatus).toBe(ts.ExitStatus.Success);
    });

    it("emits a diagnostic if the entry function is overloaded", () => {
        const compilerOptions = createCompilerOptions();
        const source = `
        async function overloaded(value: number): Promise<number>;
        async function overloaded(value: string): Promise<string>;
        async function overloaded(value: number | string): Promise<number | string> {
            "use speedyjs";
            
            if (typeof (value) === "string") {
                return value;
            }
            return value ** 2;
        }
        `;

        const {exitStatus, diagnostics } = compileSourceCode(source, "test.ts", compilerOptions);

        expect(exitStatus).toBe(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
        expect(formatDiagnostics(diagnostics)).toMatchSnapshot();
    });

    it("emits a diagnostic if the entry function is generic", () => {
        const compilerOptions = createCompilerOptions();
        const source = `
        async function generic<T>(value: T): Promise<T> {
            "use speedyjs";
            
            return value;
        }
        `;

        const {exitStatus, diagnostics } = compileSourceCode(source, "test.ts", compilerOptions);

        expect(exitStatus).toBe(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
        expect(formatDiagnostics(diagnostics)).toMatchSnapshot();
    });

    it("emits a diagnostic if the entry function has optional parameters", () => {
        const compilerOptions = createCompilerOptions();
        const source = `
        async function withOptional(value: number, withSuperPower?: boolean): Promise<number> {
            "use speedyjs";
            
            if (withSuperPower) {
                return value ** value;
            }
            return value;
        }
        `;

        const {exitStatus, diagnostics } = compileSourceCode(source, "test.ts", compilerOptions);

        expect(exitStatus).toBe(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
        expect(formatDiagnostics(diagnostics)).toMatchSnapshot();
    });

    it("emits a diagnostic if a speedy.js function references a regular JavaScript function", () => {
        const compilerOptions = createCompilerOptions();
        const source = `
        function regularJavaScriptFunction(value: number) {
            return value;
        }
        
        async function referenceJavaScriptFunction(value: number)  {
            "use speedyjs";
            
            if (regularJavaScriptFunction(value) !== 0) {
                return value ** value;
            }
            return value;
        }
        `;

        const {exitStatus, diagnostics } = compileSourceCode(source, "test.ts", compilerOptions);

        expect(exitStatus).toBe(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
        expect(formatDiagnostics(diagnostics)).toMatchSnapshot();
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
