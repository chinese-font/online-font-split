import { WebContainer } from "@webcontainer/api";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import { FitAddon } from "xterm-addon-fit";
window.addEventListener("load", () => {
    new System().init();
});

class System {
    public instance!: WebContainer;
    public terminal!: Terminal;
    public fitAddon!: FitAddon;
    initTerminal() {
        const terminalEl: HTMLDivElement = document.querySelector("#terminal")!;
        const fitAddon = new FitAddon();
        this.fitAddon = fitAddon;
        this.terminal = new Terminal({
            convertEol: true,
        });
        this.terminal.loadAddon(fitAddon);

        this.terminal.open(terminalEl);
        fitAddon.fit();
        // xterm.4.x 输入
    }
    async init() {
        this.initTerminal();
        this.instance = await WebContainer.boot({});

        await Promise.all(
            ["/package.json", "/index.js", "/白无常可可体-Light.ttf"].map(
                (i) => {
                    return this.syncFileWithRemote(i);
                }
            )
        );

        const exitCode = await this.installDependencies();
        if (exitCode !== 0) {
            throw new Error("Installation failed");
        }
        const shellProcess = await this.startShell();
        window.addEventListener("resize", () => {
            this.fitAddon.fit();
            shellProcess.resize({
                cols: this.terminal.cols,
                rows: this.terminal.rows,
            });
        });
    }
    async installDependencies() {
        // Install dependencies

        const installProcess = await this.instance.spawn("npm", ["install"]);
        installProcess.output.pipeTo(
            new WritableStream({
                write: (data) => {
                    this.terminal.write(data);
                },
            })
        );
        // Wait for install command to exit
        return installProcess.exit;
    }
    async syncFileWithRemote(path: string, innerPath = path) {
        const res = await fetch(path);
        const code = await res.blob();
        await this.syncFileByBlob(innerPath, code);
    }
    async syncFileByBlob(path: string, blob: Blob) {
        const data = new Uint8Array(await blob.arrayBuffer());
        this.instance.fs.writeFile(path, data);
    }

    async startShell() {
        const shellProcess = await this.instance.spawn("jsh", {
            terminal: {
                cols: this.terminal.cols,
                rows: this.terminal.rows,
            },
        });
        shellProcess.output.pipeTo(
            new WritableStream({
                write: (data) => {
                    this.terminal.write(data);
                },
            })
        );
        const input = shellProcess.input.getWriter();
        this.terminal.onData((data) => {
            input.write(data);
        });
        return shellProcess;
    }
}
