import * as fs from "fs";
import * as path from "path";
import * as tmp from "tmp";

export interface TempFsObject {
    name: string;
    removeCallback(): void;
}

/**
 * Stores the result of a build and allows to delete the directory together with all created files
 */
export class BuildDirectory {
    private tempObjects: TempFsObject[] = [];
    private directoriesToClean: string[] = [];
    path: string;

    /**
     * Creates a new build directory that safes the intermediate files at the given path
     * @param directory a path or a temp object that points to a directory
     */
    constructor(directory: string | TempFsObject) {
        if (typeof(directory) === "string") {
            this.path = directory;
        } else {
            this.path = directory.name;
            this.tempObjects.push(directory);
        }
    }

    /**
     * Creates a new temporary build directory
     * @return {BuildDirectory} the build directory
     */
    static createTempBuildDirectory() {
        return new BuildDirectory(tmp.dirSync());
    }

    /**
     * Returns a new temporary file in the build directory with the given postfix.
     * The file is deleted when the file directory is removed
     * @param postfix the postfix of the file
     * @return {string} the path to the temporary file
     */
    getTempFileName(postfix?: string) {
        const file = tmp.fileSync({ dir: this.path, postfix });
        this.tempObjects.push(file);
        return file.name;
    }

    /**
     * Creates a temporary sub directory in the build directory
     * @param postfix a postfix for the name of the directory
     * @return {string} the absolute path to the sub directory
     */
    getTempSubdirectory(postfix?: string) {
        const dir = tmp.dirSync({ dir: this.path, postfix });
        this.tempObjects.push(dir);
        this.directoriesToClean.push(dir.name);
        return dir.name;
    }

    /**
     * Deletes all files and sub directories in the build directory and finally deletes the build directory itself.
     * Methods called on the build directory object will fail thereafter.
     */
    remove(): void {
        for (const dir of this.directoriesToClean) {
            this.deleteDirectory(dir);
        }

        for (let i = this.tempObjects.length - 1; i >= 0; --i) {
            this.tempObjects[i].removeCallback();
        }
    }

    private deleteDirectory(dir: string) {
        for (const file of fs.readdirSync(dir)) {
            const filePath = path.join(dir, file);

            if (fs.lstatSync(filePath).isDirectory()) {
                this.deleteDirectory(filePath);
            } else {
                fs.unlinkSync(filePath);
            }
        }
    }
}
