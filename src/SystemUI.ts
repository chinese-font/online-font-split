import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { SystemApp } from "./SystemApp";
import { DirEnt } from "@webcontainer/api";
import {
    fileOpen,
    directoryOpen,
    fileSave,
    supported,
} from "browser-fs-access";
if (supported) {
    console.log("Using the File System Access API.");
} else {
    console.log("Using the fallback implementation.");
}
declare global {
    interface HTMLElementTagNameMap {
        "cn-font-split": SystemUI;
    }
}

@customElement("cn-font-split")
export class SystemUI extends LitElement {
    static styles = css``;

    @property() sys = new SystemApp();
    firstUpdated() {
        this.sys.init().then(() => {
            this.refresh();
        });
    }
    @state() inputFile: DirEnt<string>[] = [];
    @state() outputFile: DirEnt<string>[] = [];
    @property() async refresh() {
        this.inputFile = await this.sys.getInputFiles();
        this.outputFile = await this.sys.getOutputFolder();
    }
    bundle() {}
    renderInput() {
        return this.inputFile.map((i) => {
            return html`<li>
                <span>${i.name}</span>

                <span class="btn" @click=${this.bundle}>📦</span>
            </li>`;
        });
    }
    renderOutput() {
        return this.outputFile.map((i) => {
            return html`<li>${i.name}</li>`;
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
            <section>
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
