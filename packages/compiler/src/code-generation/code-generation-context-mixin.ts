import * as assert from "assert";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "./code-generation-context";
import {AddressLValue} from "./value/address-lvalue";
import {ClassReference} from "./value/class-reference";
import {Primitive} from "./value/primitive";
import {ResolvedFunctionReference} from "./value/resolved-function-reference";
import {SpeedyJSClassReference} from "./value/speedy-js-class-reference";

import {Value} from "./value/value";
import {isMaybeObjectType} from "./util/types";

/**
 * Defines the extension methods / default implementations that do not depend on a particular code generation context implementation
 */
export class CodeGenerationContextMixin {

    generateValue(this: CodeGenerationContext, node: ts.Node): Value {
        const result = this.generate(node);

        assert(result, `Generator for node of kind ${ts.SyntaxKind[node.kind]} returned no value but caller expected value`);
        return result!;
    }

    generateChildren(this: CodeGenerationContext, node: ts.Node): void {
        ts.forEachChild(node, child => {
            this.generate(child)
        });
    }

    assignValue(this: CodeGenerationContext, target: Value, value: Value) {
        if (target.isAssignable()) {
            target.generateAssignmentIR(value, this);
        } else {
            throw new Error(`Assignment to readonly value ${target}`);
        }
    }

    value(this: CodeGenerationContext, value: llvm.Value, type: ts.Type): Value {
        const symbol = type.getSymbol();

        if (type.flags & (ts.TypeFlags.BooleanLike | ts.TypeFlags.NumberLike | ts.TypeFlags.IntLike)) {
            return new Primitive(value, type);
        }

        if (symbol) {
            if (symbol.flags & ts.SymbolFlags.Function) {
                const signatures = this.typeChecker.getSignaturesOfType(type, ts.SignatureKind.Call);
                assert(signatures.length === 1, "No function type found or function is overloaded und should therefore not be dereferenced");

                return ResolvedFunctionReference.createForSignature(value as llvm.Function, signatures[0], this);
            }

            if (symbol.flags & ts.SymbolFlags.Method) {
                // TODO Objekt erstellen und dann methode
                // Requires special return object that contains the method function pointer and as
                // well the object reference ptr
                throw new Error("Returning methods is not yet supported");
            }
        }

        if (isMaybeObjectType(type)) {
            type = type.getNonNullableType();
        }

        if (type.flags & ts.TypeFlags.Object) {
            const classReference = this.resolveClass(type as ts.ObjectType);
            if (classReference) {
                return classReference.objectFor(new AddressLValue(value, type), type as ts.ObjectType, this);
            }
        }

        throw Error(`Unable to convert llvm value of type ${this.typeChecker.typeToString(type)} to Value object.`);
    }

    resolveClass(this: CodeGenerationContext, type: ts.ObjectType, symbol = type.getSymbol()): ClassReference | undefined {
        if (this.scope.hasClass(symbol)) {
            return this.scope.getClass(symbol);
        }

        if (symbol.flags & ts.SymbolFlags.Class && isClassDefined(type)) {
            const reference = SpeedyJSClassReference.create(type as ts.ObjectType, this);
            this.scope.addClass(symbol, reference);
            return reference;
        }

        return undefined;
    }
}

function isClassDefined(type: ts.ObjectType) {
    return type.getProperties().every(property => {
        if (property.flags & ts.SymbolFlags.Property) {
            // simple property / field
            return true;
        }

        const declarations = property.getDeclarations() || [];
        if (declarations.length === 0) {
            return false;
        }

        const declaration = declarations[0];
        return declaration.kind === ts.SyntaxKind.MethodDeclaration || (declaration.kind === ts.SyntaxKind.Constructor && !!(declaration as ts.ConstructorDeclaration).body);
    });
}

export interface CodeGenerationContextConstructor {
    new (...args: any[]): CodeGenerationContext;
}

/**
 * Applies the {@link CodeGenerationContextMixin} to the given type
 * @param derivedCtor the type for which the
 */
export function applyCodeGenerationContextMixin(derivedCtor: CodeGenerationContextConstructor) {
    Object.getOwnPropertyNames(CodeGenerationContextMixin.prototype).forEach(name => {
        derivedCtor.prototype[name] = (CodeGenerationContextMixin as any).prototype[name];
    });
}
