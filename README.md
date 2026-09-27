# Patchlab

An AI-made tool for messing around with custom rack patch panels and learning OpenSCAD along the way. A little project to experiment with parametric design, 3D printing, and making stuff fit together.

**[Try it in your browser](https://beraltan.github.io/patchlab/)**

Change the rack size, add connector holes, name the ports, and download printable STLs or an OpenSCAD file to play with. There are two-color labels, rear ribs, and printed joining keys for panels bigger than your printer bed. You can batch-edit ports too, because doing them one at a time gets old.

## Give it a go

1. Make a panel in the browser.
2. Hit **Export for printing**, then **Generate STL**.
3. Download one STL or the ZIP print kit. For two colors, import each body and its labels together as parts of one object.
4. Print something, see what fits, and adjust.

There's a [tolerance test](assets/patchlab-tolerance-test.stl) for dialing in the joining keys before printing a whole panel. This is a learning project, so check your connector dimensions and expect some trial and error. The joints haven't been physically tested yet.

Designs save in your browser. Use **Save project** if you want a file to keep or move to another computer.

## Run it locally

Run `npm start` and visit http://127.0.0.1:4173. No packages to install. You can also open `index.html` for editing, but direct STL generation needs the server or hosted site. `npm test` runs the checks.

The STL engine loads on demand and runs in your browser; nothing gets uploaded. Big panels can take a few minutes. OpenSCAD export is still there if you want to tweak the code yourself.

If you're curious about the more technical stuff, it's in the [design notes](ENGINEERING.md).
