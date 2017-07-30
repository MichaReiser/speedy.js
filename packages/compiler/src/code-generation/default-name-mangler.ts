import * as path from "path";
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
        if (sourceFile) {
            const relativePath = path.relative(this.compilationContext.rootDir, sourceFile.fileName);
            const normalized = path.normalize(relativePath);
            return normalized
                .replace(/\$/g, "$$")
                .replace(/_/g, "__")
                .replace(/-/g, "_");
        }
        return "";
    }
}
