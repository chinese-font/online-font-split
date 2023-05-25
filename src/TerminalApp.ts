import { WebContainer, WebContainerProcess } from "@webcontainer/api";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";

export class TerminalApp {
    public instance!: WebContainer;
    public terminal!: Terminal;
    public fitAddon!: FitAddon;
    /** 初始化控制面板 */
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
        window.addEventListener("resize", () => {
            this.fitAddon.fit();
        });
    }
    outputToTerminal(instanceProcess: WebContainerProcess) {
        instanceProcess.output.pipeTo(
            new WritableStream({
                write: (data) => {
                    this.terminal.write(data);
                },
            })
        );
    }
    async run(prefix: string, command: string[], autoOutput = true) {
        const process = await this.instance.spawn(prefix, command, {
            terminal: {
                cols: this.terminal.cols,
                rows: this.terminal.rows,
            },
        });
        if (autoOutput) this.outputToTerminal(process);
        return process;
    }

    /** 启动一个 shell 并等待输入 */
    async startShell() {
        const shellProcess = await this.instance.spawn("jsh", {
            terminal: {
                cols: this.terminal.cols,
                rows: this.terminal.rows,
            },
        });

        const input = shellProcess.input.getWriter();
        this.terminal.onData((data) => {
            input.write(data);
        });

        const autoResize = () => {
            shellProcess.resize({
                cols: this.terminal.cols,
                rows: this.terminal.rows,
            });
        };
        window.addEventListener("resize", autoResize);
        shellProcess.output.pipeTo(
            new WritableStream({
                write: (data) => {
                    this.terminal.write(data);
                },
                close() {
                    window.removeEventListener("resize", autoResize);
                },
            })
        );
        return shellProcess;
    }
}
