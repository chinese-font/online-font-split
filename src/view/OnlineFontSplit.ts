import { LitElement, html, unsafeCSS } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { SystemApp } from "../model/SystemApp";
import type { DirEnt } from "@webcontainer/api";
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
import style from "xterm/css/xterm.css?inline";
import s from "../styles/index.css?inline";
@customElement("cn-font-split")
export class OnlineFontSplit extends LitElement {
  static styles = [unsafeCSS(style), unsafeCSS(s)];
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
      const download = () => this.DownloadFolder(i.name);
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
  @asyncLock(function () {
    console.log("正在下载中，请稍等");
  })
  async DownloadFolder(name: string) {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    const folder = zip.folder(name)!;
    await this.sys.mapOutputFilesIn(name, (filename, file) => {
      folder.file(filename, file);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    return fileSave(blob);
  }
  render() {
    return html`
      <section class="online-font-split">
        <h3 style="text-align:center">
          <a
            href="https://github.com/chinese-font/online-font-split"
            target="_blank"
          >
            🎉中文网字计划——✨在线字体分包器
          </a>
        </h3>
        <main class="font-file-lists">
          <ul>
            <h4>
              <span> 需要打包的文件 </span>
              <span class="btn add-file" @click="${this.addFile}"
                >➕添加字体</span
              >
            </h4>
            ${this.renderInput()}
          </ul>
          <ul>
            <h4>打包完成文件</h4>
            ${this.renderOutput()}
          </ul>
        </main>
        <h4 style="text-align:center">命令行</h4>
        <nav class="terminal"></nav>
        <aside>
          <a
            target="_blank"
            href="https://github.com/chinese-font/online-font-split"
            >Github</a
          >
          <a target="_blank" href="https://chinese-font.netlify.app"
            >中文网字计划</a
          >
        </aside>
      </section>
    `;
  }
}
