# Patchlab

An AI-made tool for messing around with custom rack patch panels and learning OpenSCAD along the way. A little project to experiment with parametric design, 3D printing, and making stuff fit together.

**[Try it in your browser](https://beraltan.github.io/patchlab/)**

Change the rack size, add connector holes, name the ports, and export an OpenSCAD file to play with. There are two-color labels, rear ribs, and printed joining keys for panels bigger than your printer bed. You can batch-edit ports too, because doing them one at a time gets old.

## Give it a go

1. Make a panel in the browser.
2. Download the OpenSCAD file and open it in OpenSCAD.
3. Tweak things, render, and export your STLs. The app walks you through the separate parts.
4. Print something, see what fits, and adjust.

There's a [tolerance test](assets/patchlab-tolerance-test.stl) for dialing in the joining keys before printing a whole panel. This is a learning project, so check your connector dimensions and expect some trial and error. The joints haven't been physically tested yet.

Designs save in your browser. Use **Save project** if you want a file to keep or move to another computer.

## Run it locally

Open `index.html`, or run `npm start` and visit http://127.0.0.1:4173. No packages to install. `npm test` runs the checks.

If you're curious about the more technical stuff, it's in the [design notes](ENGINEERING.md).
