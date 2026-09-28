# Bundled CAD engine

STEP export runs in a local browser worker. The application builds analytic solids with Replicad and exports them through OpenCASCADE. No design is uploaded.

## Pinned packages

- `replicad` 1.1.0, MIT: `replicad.js` bundles its ESM distribution and runtime dependencies with esbuild 0.25.12. See `REPLICAD-LICENSE.txt` and `replicad.js.LEGAL.txt`.
- `replicad-opencascadejs` 1.1.0, LGPL-2.1-only: `occt.js` is an unchanged copy of `dist/replicad_single.js`; `replicad_single.wasm` is also unchanged. See `OCCT-LICENSE.txt`.
- Runtime dependencies bundled into `replicad.js`: `opentype.js` 1.3.4 (MIT), `flatbush` 4.6.2 (ISC), `flatqueue` 3.1.0 (ISC), `tiny-inflate` 1.0.3 (MIT), and `string.prototype.codepointat` 0.2.1 (MIT). Their license texts are included alongside this notice.
- The existing `../openscad/LiberationSans-Bold.ttf` is reused. Its provenance, license and authors are in that folder.

Both Replicad packages were published from commit `e4b05f67dc4e2393a876ce8c5064a9c93db05bf1`. [Corresponding source, CAD bindings, build configuration and scripts](https://github.com/sgenoud/replicad/tree/e4b05f67dc4e2393a876ce8c5064a9c93db05bf1/packages/replicad-opencascadejs) are available upstream. The build uses the single-threaded image `ghcr.io/taucad/opencascade.js:canary-ebd263f1-single-threaded`; its [source, OpenCASCADE submodule and toolchain](https://github.com/taucad/opencascade.js/tree/ebd263f15337b440b391492af073662707e86482) are available at that pinned commit. Use the upstream `npm run build` with Docker and ytt to rebuild the bindings. The engine is loaded as a separate module and WASM file; these files can be replaced with a compatible rebuilt version.

Package downloads:

- https://registry.npmjs.org/replicad/-/replicad-1.1.0.tgz
- https://registry.npmjs.org/replicad-opencascadejs/-/replicad-opencascadejs-1.1.0.tgz

The recorded npm integrity values are:

```text
replicad: sha512-TJw32OTe6+HASPpfrLEjYUI66VvSmYC2F/za4iDFWIWo4RVYbiA62dmUbXUp8ZEqkIS//jK6TqrxnmFqX6cbkA==
replicad-opencascadejs: sha512-s0KHR5V+ivsOE4nZXfuoW70lW0/rldkb3ZDY34LpXOQRFLQN5qVydQm3BRo7boZPdFkkAZBERJ+NzB0DYxrivw==
```

## Recreate the browser bundle

In a temporary build directory, install the pinned runtime packages and esbuild:

```sh
npm install --save-exact replicad@1.1.0 replicad-opencascadejs@1.1.0 opentype.js@1.3.4 flatbush@4.6.2 flatqueue@3.1.0 tiny-inflate@1.0.3 string.prototype.codepointat@0.2.1 esbuild@0.25.12
npx esbuild node_modules/replicad/dist/replicad.js --bundle --format=esm --platform=browser --minify --legal-comments=external --outfile=replicad.js
```

Copy the resulting JS and legal-comment file here, together with the unmodified `replicad_single.js` (renamed `occt.js`) and `replicad_single.wasm` from `node_modules/replicad-opencascadejs/dist`. Preserve all license files. This build step is only for updating the vendor files; running Patchlab needs no package installation.
