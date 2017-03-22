import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as assert from "assert";
import {ValueSyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {ArrayCodeGenerator} from "../util/array-code-generator";

class CallExpressionCodeGenerator implements ValueSyntaxCodeGenerator<ts.CallExpression> {
    syntaxKind = ts.SyntaxKind.CallExpression;

    generateValue(callExpression: ts.CallExpression, context: CodeGenerationContext): llvm.Value {
        const callee = callExpression.expression;

        if (callee.kind === ts.SyntaxKind.PropertyAccessExpression) {
            const object = (callee as ts.PropertyAccessExpression).expression;
            const symbol = context.typeChecker.getSymbolAtLocation(callee);
            const parent = context.typeChecker.getSymbolAtLocation(object);

            // Is it a global object
            if (object.kind === ts.SyntaxKind.Identifier && !context.scope.hasVariable(parent)) {
                if (parent.name === "Math" && symbol.name === "sqrt") {
                    return this.callSqrt(callExpression, context);
                }
            }

            if (ArrayCodeGenerator.isArrayNode(object, context)) {
                const arrayCodeGenerator = ArrayCodeGenerator.create(object, context);
                return arrayCodeGenerator.invoke(callee as ts.PropertyAccessExpression, callExpression.arguments.map(arg => context.generate(arg)));
            }
        }

        const fun = this.getDeclaredFunction(context, callExpression);
        return this.callFunction(fun, callExpression, context);
    }

    private getDeclaredFunction(context: CodeGenerationContext, callExpression: ts.CallExpression): llvm.Function {
        const expression = context.generate(callExpression.expression);
        assert(expression instanceof llvm.Function, "Callee is not a function");

        return expression as llvm.Function;
    }

    private callFunction(callee: llvm.Function, callExpression: ts.CallExpression, context: CodeGenerationContext) {
        const signature = context.typeChecker.getResolvedSignature(callExpression);
        assert(signature.parameters.length === callee.getArguments().length, "Calling functions with more or less arguments than declared parameters is not yet supported");

        const args = callExpression.arguments.map(arg => context.generate(arg));
        return context.builder.createCall(callee, args);
    }

    generate(node: ts.CallExpression, context: CodeGenerationContext): void {
        this.generateValue(node, context);
    }

    private callSqrt(callExpression: ts.CallExpression, context: CodeGenerationContext): llvm.Value {
        // FIXME Handle different cases correctly
        let args = callExpression.arguments.map(arg => context.generate(arg));
        assert(args.length === 1, "sqrt needs to be called with exactly one argument");

        const sqrt32Type = llvm.FunctionType.get(llvm.Type.getFloatTy(context.llvmContext), [llvm.Type.getFloatTy(context.llvmContext)], false);
        const sqrt64Type = llvm.FunctionType.get(llvm.Type.getDoubleTy(context.llvmContext), [llvm.Type.getDoubleTy(context.llvmContext)], false);
        const sqrt32 = llvm.Function.create(sqrt32Type, llvm.LinkageTypes.ExternalLinkage, "llvm.sqrt.f32", context.module); // FIXME cache function
        const sqrt64 = llvm.Function.create(sqrt64Type, llvm.LinkageTypes.ExternalLinkage, "llvm.sqrt.f64", context.module); // FIXME cache function

        const isInt = context.typeChecker.getTypeAtLocation(callExpression.arguments[0]).flags & ts.TypeFlags.IntLike;
        if (isInt) {
            args = args.map(arg => context.builder.createSIToFP(arg, llvm.Type.getFloatTy(context.llvmContext)));
            const resultAsFloat = context.builder.createCall(sqrt32, args);
            return context.builder.createFPToSI(resultAsFloat, llvm.Type.getInt32Ty(context.llvmContext));
        } else {
            return context.builder.createCall(sqrt64, args);
        }
    }
}

export default CallExpressionCodeGenerator;
