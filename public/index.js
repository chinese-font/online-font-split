import { fontSplit } from "@konghayao/cn-font-split";
import fs from "fs";
import { Command } from "commander";

import path from "path";

const bundler = async (filePath) => {
    const destFold = "/build/" + path.basename(filePath);
    console.log(destFold);
    try {
        await fs.promises.rmdir(destFold, { recursive: true, force: true });
    } catch (e) {}
    await fontSplit({
        FontPath: filePath,
        destFold,
        targetType: "woff2",
        chunkSize: 70 * 1024,
        testHTML: true,
        // 在浏览器中无法获取字体截图
        // previewImage: {},
    });
    return destFold;
};
const program = new Command();

program
    .name("cn-font-split")
    .description("A Nodejs Tool to Split Font File to smaller chunks")
    .version("3.4.1");

program
    .command("split")
    .description("Split a font")
    .argument("<string>", "origin Font File path ")
    .action((str) => {
        return bundler(str);
    });

program.parse();
