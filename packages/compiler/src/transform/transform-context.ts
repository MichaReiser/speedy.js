import * as ts from "typescript";
import {CodeGenerator} from "../code-generation/code-generator";

export interface TransformContext {
    getEmitter(node: ts.Node): CodeGenerator;

    complete(): void;
}
