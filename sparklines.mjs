import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const sparklines = require("./sparklines.js");
export default sparklines;
export const { SparklineElement, elements } = sparklines;
