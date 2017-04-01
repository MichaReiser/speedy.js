const path = require("path");
const ts = require("typescript");
const loaderUtils = require("loader-utils");
const speedyjs = require("speedyjs-compiler");

function parseConfigFile(configFileName) {
    const configurationFileText = ts.sys.readFile(configFileName);
    const jsonConfig = ts.parseConfigFileTextToJson(configFileName, configurationFileText);
    if (jsonConfig.error) {
        return { errors: [jsonConfig.error] };
    }

    const parsedConfiguration = ts.parseJsonConfigFileContent(jsonConfig.config, ts.sys, path.dirname(configFileName), undefined, configFileName);
    if (parsedConfiguration.errors.length > 0) {
        return { errors: parsedConfiguration.errors };
    }

    return { configuration: parsedConfiguration.options };
}

function speedyJSLoader(source) {
    const loader = this;

    function getCompilerOptions(configFileName) {
        const configFile = ts.findConfigFile(path.dirname(loader.resourcePath), ts.sys.fileExists);
        let compilerOptions;
        if (configFile) {
            console.log(`speedyjs-loader uses ${configFile}`);
            const parseResult = parseConfigFile(configFile);

            if (parseResult.errors) {
                return { errors: parseResult.errors };
            }
            compilerOptions = parseResult.configuration;
        } else {
            compilerOptions = ts.getDefaultCompilerOptions();
        }

        return { compilerOptions: compilerOptions };
    }

    this.cacheable && this.cacheable();

    const options = loaderUtils.getOptions(this) || {};
    const compilerOptionsResult = getCompilerOptions(options.tsconfig);
    let errors = compilerOptionsResult.errors;
    let result;

    if (!errors) {
        result = speedyjs.compileSourceCode(source, this.resourcePath, compilerOptionsResult.compilerOptions);
        errors = result.diagnostics;
    }

    if (errors && errors.length !== 0) {
        const message = speedyjs.formatDiagnostics(errors);
        const error = {
            rawMessage: message,
            message: message,
            loaderSource: "speedyjs-loader"
        };
        this.callback(error);
    } else {
        const output = makeSourceMap(result.sourceMapText, result.outputText, this.resourcePath + ".ts", source, this);

        this.callback(null, output.source, output.sourceMap);
    }

}

function makeSourceMap(sourceMapText, outputText, filePath, contents, loader) {
    if (!sourceMapText) {
        return { source: outputText, sourceMap: undefined };
    }

    return {
        source: outputText.replace(/^\/\/# sourceMappingURL=[^\r\n]*/gm, ''),
        sourceMap: Object.assign(JSON.parse(sourceMapText), {
            sources: [loaderUtils.getRemainingRequest(loader)],
            file: filePath,
            sourcesContent: [contents]
        })
    };
}

module.exports = speedyJSLoader;
