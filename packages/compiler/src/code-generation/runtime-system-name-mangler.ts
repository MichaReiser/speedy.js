import * as ts from "typescript";
import {CompilationContext} from "../compilation-context";
import {BaseNameMangler} from "./base-name-mangler";

/**
 * Name mangler for functions implemented in the Runtime
 *
 * Functions of the runtime systems have no prefix. It is left to the runtime implementor to guarantee that there are
 * no conflicting names between the runtime and the llvm intrinsics.
 *
 * The name of a function is the declared name of the function including the encoded argument types. The following encoding is used for arguments
 * boolean:     b
 * int:         i
 * number:      d
 * Object:      Pv
 * Array:       Pti where t is the encoded element type
 *
 * Functions accepting varargs or an array parameter need to have two arguments in the runtime implementation. The first
 * is a pointer to an array of the elements. The second is an int that defines the number of elements in the array.
 *
 * Functions belonging to a class are prefixed with the class name. The class and function name is separated by an underscore. If
 * the class itself is generic (e.g. Array), than the generic arguments are appended to the class name.
 *
 * Examples:
 * isNaN(number): isNaNd
 * isNaN(int): isNaNi
 *
 * Array<int>.push(): ArrayIi_pushPii
 * Array<int>.push(3): ArrayIb_pushPii
 *
 * Array<int>.fill(3): ArrayIi_filli
 * Array<int>.fill(3, 2): ArrayIi_fillii
 */
export class RuntimeSystemNameMangler extends BaseNameMangler {

    private arraySymbol: ts.Symbol | undefined;

    constructor(compilationContext: CompilationContext) {
        super(compilationContext);
        this.arraySymbol = compilationContext.builtIns.get("Array");
    }

    get separator() {
        return "_";
    }

    getModulePrefix() {
        return "";
    }

    protected getParameterTypeCode(parameter: ts.Type) {
        if (parameter.getSymbol() === this.arraySymbol) {
            const elementType = (parameter as ts.GenericType).typeArguments[0];
            return `P${this.typeToCode(elementType)}i`;
        }

        return super.getParameterTypeCode(parameter);
    }

    protected typeToCode(type: ts.Type) {
        if (type.flags & ts.TypeFlags.Object) {
            return "Pv";
        }

        return super.typeToCode(type);
    }

    protected encodeName(name: string): string {
        return name;
    }
}

