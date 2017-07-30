import * as llvm from "llvm-node";
import * as ts from "typescript";
import {ArrayClassReference} from "../value/array-class-reference";
import {ClassReference} from "../value/class-reference";
import {MathClassReference} from "../value/math-class-reference";

import {DefaultTypeConverter} from "./default-type-converter";
import {TypePlace} from "./typescript-to-llvm-type-converter";

export class RuntimeSystemTypeConverter extends DefaultTypeConverter {

    protected getObjectType(objectType: ts.ObjectType, classReference: ClassReference, place: TypePlace): llvm.Type {
        if ((place & TypePlace.RETURN_VALUE || place & TypePlace.THIS) && this.isBuiltIn(classReference)) {
            return super.getObjectType(objectType, classReference, place);
        }

        return llvm.Type.getInt8PtrTy(this.llvmContext);
    }

    private isBuiltIn(classReference: ClassReference) {
        return classReference instanceof ArrayClassReference || classReference instanceof MathClassReference;
    }
}
