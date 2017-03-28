import * as ts from "typescript";
import {BaseNameMangler} from "./base-name-mangler";

/**
 * C++ inspired name mangler.
 *
 * Functions are postfixed with the encoded types of their arguments. The type codes are
 * boolean:     b
 * int:         i
 * number:      d
 * Object:      Pv (Pointer void)
 *
 * Function and type names are prefixed with their length to avoid conflicts.
 */
export class DefaultNameMangler extends BaseNameMangler {
    get separator() {
        return "$";
    }

    protected encodeName(name: string): string {
        return `${name.length}${name}`;
    }

    protected getModulePrefix(sourceFile?: ts.SourceFile): string {
        return (sourceFile ? sourceFile.fileName.replace("$", "$$") : "");
    }
}
