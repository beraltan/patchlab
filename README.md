# Patchlab

An AI-made tool for messing around with custom rack patch panels and learning OpenSCAD along the way. A little project to experiment with parametric design, 3D printing, and making stuff fit together.

**[Try it in your browser](https://beraltan.github.io/patchlab/)**

Change the rack size, add connector holes, name the ports, and download a single 3MF, separate STLs, or an OpenSCAD file to play with. There are two-color labels, rear ribs, and printed joining keys for panels bigger than your printer bed. You can batch-edit ports too, because doing them one at a time gets old.

Under **Horizontal spacing and stacked rows**, set edge gaps or center spacing and align rows left, center, or right. Individual gaps are editable too. Select a port, choose a rack-unit count, and repeat its row into one continuous panel. Undo layout puts it back. Up to 11U / 100 ports; the panel still has to fit your bed height.

## Give it a go

1. Make a panel in the browser.
2. Hit **Export for printing**, choose **All parts (single 3MF file)**, then **Download 3MF**. The file is generated and downloaded automatically.
3. Open the 3MF in your slicer. Body and labels are already grouped and aligned; assign a filament to each part. Split panels and keys can be arranged across plates. STL and ZIP exports are still available.
4. Print something, see what fits, and adjust.

The 3MF is a standard model file, without printer settings. In Bambu Studio, import the geometry if prompted, expand the panel in the Objects list, and assign your two filaments. The export includes named Panel body and Port labels parts, assigned to filaments 1 and 2 in Bambu/Orca. Add two project filaments, switch to Objects, and expand the panel to change them. Other slicers can use the standard 3MF components. Keep them grouped when moving or arranging.

There's a [tolerance test](assets/patchlab-tolerance-test.stl) for dialing in the joining keys before printing a whole panel. This is a learning project, so check your connector dimensions and expect some trial and error. The joints haven't been physically tested yet.

Designs save in your browser. Use **Save project** if you want a file to keep or move to another computer.

## Run it locally

Run `npm start` and visit http://127.0.0.1:4173. No packages to install. You can also open `index.html` for editing, but direct STL generation needs the server or hosted site. `npm test` runs the checks.

The STL engine loads on demand and runs in your browser; nothing gets uploaded. Big panels can take a few minutes. OpenSCAD export is still there if you want to tweak the code yourself.

If you're curious about the more technical stuff, it's in the [design notes](ENGINEERING.md).
