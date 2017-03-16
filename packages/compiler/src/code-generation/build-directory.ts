import * as fs from "fs";
import * as path from "path";
import * as tmp from "tmp";

export interface TempFsObject {
    name: string;
    removeCallback(): void;
}

export class BuildDirectory {
    private tempObjects: TempFsObject[] = [];
    private directoriesToClean: string[] = [];
    public path: string;

    constructor(path: string | TempFsObject) {
        if (typeof(path) === "string") {
            this.path = path;
        } else {
            this.path = path.name;
            this.tempObjects.push(path);
        }
    }

    static createTempBuildDirectory() {
        return new BuildDirectory(tmp.dirSync());
    }

    getTempFileName(postfix?: string) {
        const file = tmp.fileSync({ dir: this.path, postfix });
        this.tempObjects.push(file);
        return file.name;
    }

    getTempSubdirectory(postfix?: string) {
        const dir = tmp.dirSync({ dir: this.path, postfix });
        this.tempObjects.push(dir);
        this.directoriesToClean.push(dir.name);
        return dir.name;
    }

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
