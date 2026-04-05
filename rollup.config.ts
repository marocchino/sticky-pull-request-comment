// See: https://rollupjs.org/introduction/

import commonjs from "@rollup/plugin-commonjs"
import nodeResolve from "@rollup/plugin-node-resolve"
import typescript from "@rollup/plugin-typescript"

const config = {
  context: "globalThis",
  input: "src/main.ts",
  output: {
    exports: "auto",
    file: "dist/index.js",
    format: "cjs",
    sourcemap: true,
  },
  plugins: [typescript(), nodeResolve({preferBuiltins: true}), commonjs()],
}

export default config
