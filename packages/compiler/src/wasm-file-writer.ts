import {CodeGenerationContext} from "./code-generation/code-generation-context";

/**
 * Writes the WASM file output and generates the URL used to fetch the WASM file
 *
 * E.g. when no bundler is used, then the url to load the wasm file is just the relative path of the
 * wasm file to the js file. However, if webpack, or another bundler, is used then the URL needs to be relative to the output
 * bundle and not to the javascript file.
 */
export interface WasmFileWriter {

    /**
     * Writes the wasm file and returns a url that can be used to load the file
     * @param fileName the name of the wasm file
     * @param content the Wasm Module content
     * @param codeGenerationContext the code generation context
     * @returns the url to the file
     */
    writeWasmFile(fileName: string, content: Buffer, codeGenerationContext: CodeGenerationContext): string;
}
