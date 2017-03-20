/**
 * Webpack Loader for binary files.
 * Returns an Uint8Array with the binary content
 */
module.exports = function (content) {
    this.cacheable && this.cacheable();
    this.value = content;

    var array = new Uint16Array(content.length);
    for (let i = 0; i < content.length; ++i) {
        array[i] = content[i];
    }

    return "module.exports= new Uint8Array(" + JSON.stringify(Array.from(array)) + ");";
};

module.exports.raw = true;
