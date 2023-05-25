import { WebContainer, WebContainerProcess } from "@webcontainer/api";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
export class TerminalApp {
    public instance!: WebContainer;
    public terminal!: Terminal;
    public fitAddon!: FitAddon;
    /** 初始化控制面板 */
    initTerminal(terminalEl: HTMLDivElement) {
        const fitAddon = new FitAddon();
        this.fitAddon = fitAddon;
        this.terminal = new Terminal({
            convertEol: true,
            theme: {
                foreground: "#ebeef5",
                background: "#1d2935",
                cursor: "#e6a23c",
                black: "#000000",
                brightBlack: "#555555",
                red: "#ef4f4f",
                brightRed: "#ef4f4f",
                green: "#67c23a",
                brightGreen: "#67c23a",
                yellow: "#e6a23c",
                brightYellow: "#e6a23c",
                blue: "#409eff",
                brightBlue: "#409eff",
                magenta: "#ef4f4f",
                brightMagenta: "#ef4f4f",
                cyan: "#17c0ae",
                brightCyan: "#17c0ae",
                white: "#bbbbbb",
                brightWhite: "#ffffff",
            },
            fontFamily: "Consolas, monospace",
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

    runningShell!: WebContainerProcess;
    /** 启动一个 shell 并等待输入 */
    async startShell() {
        if (this.runningShell) this.runningShell.kill();
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
        this.runningShell = shellProcess;
        return shellProcess;
    }
}
