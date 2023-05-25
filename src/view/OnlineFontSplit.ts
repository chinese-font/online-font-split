import "./styles/index.css";
import { LitElement, html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { SystemApp } from "../model/SystemApp";
import { DirEnt } from "@webcontainer/api";
import { fileOpen, fileSave, supported } from "browser-fs-access";
import { asyncLock } from "../utils/asyncLock";
import { sleep } from "../utils/sleep";
if (supported) {
    console.log("Using the File System Access API.");
} else {
    console.log("Using the fallback implementation.");
}
declare global {
    interface HTMLElementTagNameMap {
        "cn-font-split": OnlineFontSplit;
    }
}
@customElement("cn-font-split")
export class OnlineFontSplit extends LitElement {
    @query(".terminal") terminalEl!: HTMLDivElement;
    @property() sys = new SystemApp();
    @state() inputFile: DirEnt<string>[] = [];
    @state() outputFile: DirEnt<string>[] = [];

    /** 第一次渲染时进行程序注入 */
    firstUpdated() {
        const terminalEl = this.terminalEl;
        this.sys.init(terminalEl).then(() => this.refresh());
    }

    /** 立即同步文件系统 */
    @property()
    async refresh(delay = 0) {
        if (delay > 0) await sleep(delay);
        this.inputFile = await this.sys.getInputFiles();
        this.outputFile = await this.sys.getOutputFolder();
    }

    /** 打包一个文件 */
    @asyncLock(function (this: OnlineFontSplit) {
        console.log("正在努力分包中，请稍等");
    })
    async bundle(path: string) {
        this.refresh();
        await this.sys.SplitFont(path);
        this.refresh();
    }
    renderInput() {
        return this.inputFile.map((i) => {
            const bundle = () => this.bundle(i.name);
            const deleteFile = async () => {
                await this.sys.instance.fs.rm("/font/" + i.name);

                return this.refresh();
            };
            return html`<li>
                <span>${i.name}</span>

                <span class="btn" @click=${bundle}>📦分包</span>
                <span class="btn" @click=${deleteFile}>❌删除</span>
            </li>`;
        });
    }
    renderOutput() {
        return this.outputFile.map((i) => {
            const download = () => this.bundle(i.name);
            const deleteFolder = async () => {
                await this.sys.instance.fs.rm("/build/" + i.name, {
                    force: true,
                    recursive: true,
                });
                return this.refresh();
            };
            return html`<li>
                <span>${i.name}</span>
                <span class="btn" @click=${download}>⬇️下载</span>
                <span class="btn" @click=${deleteFolder}>❌删除</span>
            </li>`;
        });
    }
    async addFile() {
        const blobs = await fileOpen({
            mimeTypes: ["font/*"],
            multiple: true,
        });
        for (const iterator of blobs) {
            const buffer = await iterator.arrayBuffer();
            this.sys.instance.fs.writeFile(
                "/font/" + iterator.name,
                new Uint8Array(buffer)
            );
        }
        this.refresh();
    }
    render() {
        return html`
            <section class="online-font-split">
                <nav class="terminal"></nav>
                <ul>
                    <h1>需要打包的文件</h1>
                    ${this.renderInput()}
                    <button @click="${this.addFile}">添加文件</button>
                </ul>
                <ul>
                    <h1>打包完成文件</h1>
                    ${this.renderOutput()}
                </ul>
            </section>
        `;
    }
}
