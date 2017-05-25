import * as path from "path";
import * as ts from "typescript";

export const MODULE_LOADER_FACTORY_NAME = "__moduleLoader";

/**
 * Emit helper for the __moduleLoader function
 */
export class PerFileWasmLoaderEmitHelper implements ts.EmitHelper {
    name = "speedyjs:per-file-wasm-module-loader";
    scoped = false;
    get text() {
        return ts.sys.readFile(path.join(__dirname, "./get-wasm-module-function.js"), "utf-8");
    }
    priority: 1000;
}
