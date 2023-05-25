import { WebContainer, WebContainerProcess } from "@webcontainer/api";
import { TerminalApp } from "./TerminalApp";
import path from "path-browserify";
export class SystemApp extends TerminalApp {
    async init() {
        this.initTerminal();
        this.instance = await WebContainer.boot({});
        await this.instance.fs.mkdir("/build");
        await Promise.all(
            ["/package.json", "/index.js", "/font/白无常可可体-Light.ttf"].map(
                (i) => {
                    return this.syncFileWithRemote(i);
                }
            )
        );

        const exitCode = await this.installDependencies();
        if (exitCode !== 0) {
            throw new Error("Installation failed");
        }
        this.startShell();
    }

    /** 安装依赖 */
    async installDependencies() {
        const installProcess = await this.run("npm", ["install"]);
        return installProcess.exit;
    }
    /** 输入本地文件到内部 */
    private async syncFileWithRemote(localPath: string, innerPath = localPath) {
        await this.instance.fs.mkdir(path.dirname(innerPath), {
            recursive: true,
        });
        const res = await fetch(localPath);
        const code = await res.blob();
        await this.syncFileByBlob(innerPath, code);
    }
    /** 输入Blob到内部 */
    async syncFileByBlob(path: string, blob: Blob) {
        const data = new Uint8Array(await blob.arrayBuffer());
        this.instance.fs.writeFile(path, data);
    }

    async getInputFiles() {
        const items = await this.instance.fs.readdir("/font/", {
            withFileTypes: true,
        });
        return items.filter((i) => i.isFile());
    }
    async getOutputFolder() {
        const items = await this.instance.fs.readdir("/build/", {
            withFileTypes: true,
        });
        return items.filter((i) => i.isDirectory());
    }
    async SplitFont(fontName: string) {
        const process = await this.run("node", [
            "index.js",
            "split",
            "./font/" + fontName,
        ]);
    }
}
