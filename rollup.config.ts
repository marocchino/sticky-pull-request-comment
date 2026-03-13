// See: https://rollupjs.org/introduction/

import commonjs from "@rollup/plugin-commonjs"
import nodeResolve from "@rollup/plugin-node-resolve"
import typescript from "@rollup/plugin-typescript"

const config = {
  input: "src/main.ts",
  output: {
    esModule: true,
    file: "dist/index.js",
    format: "es",
    sourcemap: true,
  },
  plugins: [typescript({outDir: "dist"}), nodeResolve({preferBuiltins: true}), commonjs()],
}

export default config
