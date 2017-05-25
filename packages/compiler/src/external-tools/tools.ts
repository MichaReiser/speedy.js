import * as child_process from "child_process";
import * as debug from "debug";
import * as path from "path";
import * as ts from "typescript";

const CONFIGURATION_FILE = path.normalize(path.join(__dirname, "../../tools/configuration.json"));

const log = debug("external-tools/tools");

interface ToolsConfiguration {
    LLVM: string;
    BINARYEN: string;
}

/**
 * Returns the path where the llvm executables are located
 */
export function getConfiguration(): ToolsConfiguration {
    if (!ts.sys.fileExists(CONFIGURATION_FILE)) {
        throw new Error(`The configuration file '${CONFIGURATION_FILE} for the installations does not exist. Install the package again`);
    }

    const content = ts.sys.readFile(CONFIGURATION_FILE);
    return JSON.parse(content) as ToolsConfiguration;
}

/**
 * executes a llvm tool
 * @param tool the name of the binary
 * @param args the arguments to pass
 * @param cwd optionally, the working directory where the command is to be executed
 * @return {string} the result of executing this command
 */
export function execLLVM(tool: string, args: string, cwd?: string): string {
    const toolPath = path.join(getConfiguration().LLVM, tool);

    if (!ts.sys.fileExists(toolPath)) {
        throw new Error(`LLVM executable ${toolPath} is missing`);
    }

    return execute(toolPath, args, cwd);
}

/**
 * Executes a binaryen command
 * @param tool the name of the binaryen executable
 * @param args the arguments to pass
 * @return {string} the output of the execution
 */
export function execBinaryen(tool: string, args: string): string {
    const toolPath = path.join(getConfiguration().BINARYEN, "bin", tool);

    if (!ts.sys.fileExists(toolPath)) {
        throw new Error(`BINARYEN executable ${toolPath} is missing`);
    }

    return execute(toolPath, args);
}

function execute(tool: string, args: string, cwd?: string) {
    const env = Object.create(process.env);
    const command = `${tool} ${args}`;

    log(`Execute command '${command}'`);
    const output = child_process.execSync(`${tool} ${args}`, { env, cwd });

    return outputToString(output);
}

function outputToString(output: string | Buffer): string {
    if (typeof(output) === "string") {
        return output;
    }

    return output.toString("utf-8");
}
