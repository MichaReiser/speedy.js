import * as assert from "assert";
import * as debug from "debug";
import * as fs from "fs";
import * as path from "path";
import {COMPILER_RT_FILE, LIBC_RT_FILE, SAFE_RUNTIME, SHARED_LIBRARIES_DIRECTORY, UNSAFE_RUNTIME} from "speedyjs-runtime";
import * as ts from "typescript";
import {BuildDirectory} from "../code-generation/build-directory";
import {LLVMByteCodeSymbolsResolver} from "./llvm-nm";
import {execLLVM} from "./tools";

const EXECUTABLE_NAME = "llvm-link";
const LOG = debug("external-tools/llvm-link");

/**
 * Linker to link multiple llvm files into a single output file.
 * The implementation determines automatically which files are to be included by the
 * yet unresolved symbols
 */
export class LLVMLink {

    private byteCodeFiles: string[] = [];
    private byteCodeSymbolResolver = new LLVMByteCodeSymbolsResolver();

    /**
     * @param buildDirectory the build directory
     */
    constructor(private buildDirectory: BuildDirectory) {

    }

    /**
     * Adds a file that is to be linked
     * @param file the file to be linked
     */
    addByteCodeFile(file: string) {
        assert(file && ts.sys.fileExists(file), `The file ${file} to link does not exist.`);

        this.byteCodeFiles.push(file);
    }

    /**
     * Adds the files needed by the runtime
     * @param unsafe should the unsafe runtime (without safe memory guarantees) be used
     */
    addRuntime(unsafe = false): void {
        if (unsafe) {
            this.addByteCodeFile(UNSAFE_RUNTIME);
        } else {
            this.addByteCodeFile(SAFE_RUNTIME);
        }
    }

    /**
     * Adds the shared libs (e.g. c(++) std lib) to the linkage
     */
    addSharedLibs(): void {
        this.addObjectFilesFromDirectory(SHARED_LIBRARIES_DIRECTORY);
    }

    private addObjectFilesFromDirectory(directory: string): void {
        for (const file of fs.readdirSync(directory)) {
            const fullPath = path.join(directory, file);

            if (fullPath === COMPILER_RT_FILE || fullPath === LIBC_RT_FILE) {
                continue;
            }

            if (file.endsWith(".a")) {
                this.byteCodeFiles.push(...this.extractArchive(fullPath));
            } else if (file.endsWith(".bc") || file.endsWith(".o")) {
                this.byteCodeFiles.push(fullPath);
            }
        }
    }

    /**
     * Links the files together
     * @param target the path to the file where the linked output should be written to
     * @param entrySymbols the name of the external visible entry symbols
     */
    link(target: string, entrySymbols: string[]): string {
        const linkingFiles = Array.from(this.getObjectFilesToLink(this.byteCodeFiles, entrySymbols));
        LOG(execLLVM(EXECUTABLE_NAME, linkingFiles.concat(["-o", target])));
        return target;
    }

    private extractArchive(archiveFilePath: string): string[] {
        const directory  = this.buildDirectory.getTempSubdirectory(path.basename(archiveFilePath));
        LOG(`Extract archive ${archiveFilePath} to ${directory}`);

        execLLVM("llvm-ar", ["x", archiveFilePath], directory);

        return fs.readdirSync(directory).map(file => path.join(directory, file));
    }

    private getObjectFilesToLink(objectFiles: string[], entrySymbols: string[]) {
        let loopAgain = true;
        const includedObjectFiles = new Set<string>();
        const unresolvedSymbols = new Set<string>(entrySymbols);

        while (loopAgain) {
            loopAgain = false;

            for (const objectFile of objectFiles) {
                if (includedObjectFiles.has(objectFile)) {
                    continue;
                }

                if (this.considerObjectFile(objectFile, unresolvedSymbols)) {
                    includedObjectFiles.add(objectFile);
                    loopAgain = true;
                }
            }
        }

        return includedObjectFiles.values();
    }

    private considerObjectFile(objectFile: string, unresolvedSymbols: Set<string>) {
        const symbols = this.byteCodeSymbolResolver.getSymbols(objectFile);

        LOG(`Consider object file ${objectFile} for linkage`);
        if (intersects(unresolvedSymbols, symbols.defined)) {
            LOG(`Add object file ${objectFile} to linkage`);
            symbols.defined.forEach(symbol => unresolvedSymbols.delete(symbol));
            symbols.undefined.forEach(symbol => unresolvedSymbols.add(symbol));

            return true;
        }

        return false;
    }
}

/**
 * Helper function that tests if the two sets intersect (there is no such function in the API!!!!)
 * Is O(n) :/
 */
function  intersects<T>(setA: Set<T>, setB: Set<T>): boolean {
    const smaller = setA.size < setB.size ? setA : setB;
    const larger = setA === smaller ? setB : setA;

    for (const symbol of Array.from(smaller)) {
        if (larger.has(symbol)) {
            return true;
        }
    }

    return false;
}
