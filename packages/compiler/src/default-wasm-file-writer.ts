import * as path from "path";
import {WasmFileWriter} from "./wasm-file-writer";
import {CodeGenerationContext} from "./code-generation/code-generation-context";

export class DefaultWasmFileWriter implements WasmFileWriter {
    writeWasmFile(fileName: string, content: Buffer, codeGenerationContext: CodeGenerationContext): string {
        // Parameter can also be a buffer. If string is used, then it gets mixed up with the encoding.
        codeGenerationContext.compilationContext.compilerHost.writeFile(fileName, content as any, false);

        return `./${path.basename(fileName)}`;
    }
}
