// See: https://rollupjs.org/introduction/

import commonjs from "@rollup/plugin-commonjs"
import nodeResolve from "@rollup/plugin-node-resolve"
import typescript from "@rollup/plugin-typescript"

const config = {
  context: "globalThis",
  input: "src/main.ts",
  onwarn: (warning, warn) => {
    if (warning.code === "CIRCULAR_DEPENDENCY" && warning.ids?.every(id => id.includes("/node_modules/"))) {
      return
    }
    warn(warning)
  },
  output: {
    exports: "auto",
    file: "dist/index.js",
    format: "cjs",
    sourcemap: true,
  },
  plugins: [typescript(), nodeResolve({preferBuiltins: true}), commonjs()],
}

export default config
