import { fontSplit } from "@konghayao/cn-font-split";

await fontSplit({
    FontPath: "./白无常可可体-Light.ttf",
    destFold: "/tmp/",
    targetType: "woff2",
    chunkSize: 70 * 1024,
    testHTML: true,
    // previewImage: {},
});
