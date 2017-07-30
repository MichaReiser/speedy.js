import * as llvm from "llvm-node";
import * as ts from "typescript";

export enum TypePlace {
    /**
     * Inside of the function body
     */
    INLINE,

    /**
     * As a field & Property
     */
    FIELD,

    THIS,

    /**
     * As a parameter
     */
    PARAMETER,

    /**
     * As return value
     */
    RETURN_VALUE
}

export interface TypeScriptToLLVMTypeConverter {
    convert(type: ts.Type, place: TypePlace): llvm.Type;
}
