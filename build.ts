import bunPluginTailwind from "bun-plugin-tailwind";

const res = await Bun.build({
  entrypoints: ["src/server.ts"],
  target: "bun",
  minify: true,
  outdir: "dist",
  compile: { outfile: "app" },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  plugins: [bunPluginTailwind],
});

console.log(res.outputs);
