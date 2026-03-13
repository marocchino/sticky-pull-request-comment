"use strict";
// See: https://rollupjs.org/introduction/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_commonjs_1 = __importDefault(require("@rollup/plugin-commonjs"));
const plugin_node_resolve_1 = __importDefault(require("@rollup/plugin-node-resolve"));
const plugin_typescript_1 = __importDefault(require("@rollup/plugin-typescript"));
const config = {
    input: "src/main.ts",
    output: {
        esModule: true,
        file: "dist/index.js",
        format: "es",
        sourcemap: true,
    },
    plugins: [(0, plugin_typescript_1.default)({ outDir: "dist" }), (0, plugin_node_resolve_1.default)({ preferBuiltins: true }), (0, plugin_commonjs_1.default)()],
};
exports.default = config;
