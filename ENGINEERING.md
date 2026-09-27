# Joint and reinforcement design notes

## What changed

- The mounting face remains 3 mm by default. Rear edge ribs add section depth rather than forcing connector flanges to mount through a thicker plate.
- Ribs default to 8 mm depth and 3 mm width. Their clearance from cutouts defaults to 4 mm and is adjustable. The actual rear connector envelope must be checked against its drawing.
- Each seam has two complete female dovetail channels, one in each panel section. One printed key has two matching rails joined by a backing strip. These rails restrain separation and out-of-plane movement; an integral flexible tongue retains the key along its sliding direction. The tongue is not the primary structural connection.
- The key is printed flat on its backing, with its flexible tongue supported on the bed. The rail slopes grow gradually. Sections export face-down so the panel face supports the rear ribs.
- Channels stop 3 mm short of the top edge. Their entry is at the lower edge. A relief opening lets the user press the tongue out of its catch and withdraw the key.
- Default clearance is 0.15 mm per mating surface, adjustable from 0.05 to 0.60 mm. This is a tight starting value, not a printer-independent guaranteed fit.

## Why this approach

A friction-only key can loosen as the fit changes, while a small snap hook alone would concentrate joint loads in its flexible root. The paired sliding dovetails provide broad bearing faces and a replaceable key; the integral snap tongue provides retention without separate hardware. This is our design judgment, not a tested load rating.

Ribs provide additional section depth without increasing the connector mounting thickness. The general principle is supported by [Protolabs' rib and gusset guidance](https://www.protolabs.com/resources/design-tips/design-stronger-molded-parts/). That source addresses injection molding: its process-specific rib ratios and sink-mark rules are not directly adopted as FDM printing requirements.

[Formlabs' snap-fit guide](https://formlabs.com/blog/designing-3d-printed-snap-fit-enclosures/) describes how a cantilever latch deflects during assembly and relaxes into a retaining cavity. Its SLA/SLS examples inform the mechanism, not a guarantee of FDM material performance.

[Prusa's modeling guidance](https://help.prusa3d.com/article/modeling-with-3d-printing-in-mind_164135) explains why mating printed parts need clearance and why the result depends on printing and material behavior. This is why a physical calibration coupon is part of the workflow.

## Connector specifications

[Neutrik's D-series XLR family page](https://www.neutrik.com/en/neutrik/products/xlr-connectors/xlr-chassis-connectors/d-series) specifies a 1-3 mm panel range. The [NE8FDY-C6 datasheet](https://www.neutrik.com/en/product/ne8fdy-c6.pdf) independently specifies a maximum 3 mm panel thickness. These are examples, not a claim that every D-sized connector supports the same panel.

The generic D-series template starts with an editable 3 mm mounting limit. Round and rectangular templates have no assumed limit (0). Check the exact connector drawing, flange, screws, and rear shell dimensions. The limit warns and blocks panel export when the entire face exceeds the entered value; the tool does not automatically recess connector mounting regions. Printed joining keys replace panel-joint hardware, not the connector's own required fasteners.

## Calibrate the joint

1. Download the STL tolerance kit from the app. It is 156 x 90 mm, with ten female halves and five keys. The sample faces are 3 mm thick.
2. Keep the supplied orientation, and use the final filament and slicer settings. Each key's clearance is engraved on its flat back: 0.10, 0.15, 0.20, 0.25, or 0.30 mm.
3. Pair two female halves and slide a key in from the channel entry. Check full travel, latching, and release. Choose the tightest fit that does not need forcing or damage the tongue.
4. Enter that number in Fit clearance / surface. For a longer panel, first test the full-length key and one joint before printing all sections. A short coupon cannot establish full-length friction, warping, or long-term strength.

## Verification and limits

Automated checks cover split bed bounds, protected cutout regions, migration of old projects, fit input validation, connector-thickness warnings and export modes. OpenSCAD 2021.01 renders were checked for simple geometry. A representative panel section and key each render as one solid. A seated key has no volumetric interference with the panel. The tolerance kit contains 15 separate components; the five rail heights were measured from its STL to confirm that their clearances differ.

No physical print, bending test, creep test, latch cycle test, or structural simulation has been performed. Geometry checks do not establish that a long printed panel is sufficiently stiff for every cable load. Material, orientation, wall count, temperature, load and print quality all affect performance. Confirm fit and stiffness on your printer before putting the design into service. Rib clearances are based on cutout bounding boxes and the entered margin, not detailed rear hardware models.

## Direct browser STL export

The website bundles the pinned @lofcz/openscad-wasm 0.0.2 build with the Manifold backend, including Liberation Sans Bold, and invokes it in an isolated worker for each part. The worker uses the same generated geometry as the OpenSCAD download and exports binary STL. Cancellation terminates the worker. The application never sends a design to an external render service.

A print kit is a standard ZIP containing paired body/label STLs for each section, a reusable joining-key STL when needed, project settings, and printing instructions. Empty label sets are omitted. Individual parts can also be rendered and downloaded. The initial engine download is about 12 MB; rendering detailed panels can take several minutes, particularly on slower devices.

Engine and font provenance and licenses are included under `vendor/openscad`. Tests cover part selection, section numbering, empty labels, invalid layouts, ZIP checksums and directory offsets.

A complete seven-STL browser print kit was generated and downloaded during verification. Its ZIP was extracted with the system archive reader. All seven binary STL lengths matched their triangle counts, coordinates were finite, section bodies fit their planned bounds, and label parts occupied Z=0 through the configured 0.6 mm inlay depth. Cancellation was also checked in the browser.

## Solid rack mounting ears

When rear ribs or split joints are present, each rack ear has continuous full-height backing, including around the rack screw hole. Backing depth matches the deeper of the ribs and the 8.5 mm joining key; both ears have the same thickness. Ear width is the rack-hole inset plus its radius plus 4 mm. Rack holes continue through the backing. Connector cutouts overlapping an ear block panel export; nearby hardware clearance is flagged for inspection. Connector face thickness elsewhere is unchanged.

Use solid infill in the mounting ears and screws long enough for their increased thickness. The added backing removes the unsupported gap behind the screw clamping area; resistance to crushing and creep still depends on the material and print settings and has not been physically tested.

A rendered unsplit sample was checked by vertical mesh intersections: both 11 mm ears have continuous backing, both rack screw holes remain open, and the central connector face remains 3 mm thick.

## Single-file 3MF

The default export packages the rendered binary STL meshes in a standard [3MF Core](https://github.com/3MFConsortium/spec_core/blob/master/3MF%20Core%20Specification.md) model with millimeter units, base materials, and component assemblies. Each section contains its body and optional labels without independent recentering or transforms. Build items position complete sections apart; the joining-key mesh is instantiated once per seam. Arrange the objects across printer plates as needed. No printer profile, AMS mapping, or proprietary slicer settings are embedded. Slicers may rename parts or ignore display colors; assign physical filaments per part.

A browser-generated 3MF was imported and re-exported through Bambu Studio 02.07.01.62. The result retained one panel object with two volumes. Their bounds after component transforms matched the input within 0.00002 mm. Bambu renamed the parts panel and panel_2; the first is the body, the second is the labels. Automated tests also cover vertex sharing, invalid meshes, blank labels, grouped sections, all joining-key copies, and XML escaping. This validates the tested import path, not every printer or slicer.

## Layout and slicer import update

Horizontal tools operate on selected ports (all ports if none are selected), independently for each row. Gaps include the rotated cutout and screw-hole bounding boxes; they are not connector flange clearances. Editing an individual gap translates its right-hand port and following ports in that row. Row stacking repeats one row at 44.45 mm pitch and sets one continuous panel height to N * 44.45 - 0.8 mm; the existing width split planner does not split panel height. The UI limits this to 11U and 100 ports.

The standard 3MF components are retained, with optional Metadata/model_settings.config for Bambu/Orca part names and filament indices. No printer profile or machine settings are added. A new Bambu Studio import/re-export verified all three sample sections retained Panel body on filament 1 and Port labels on filament 2. Add two project filaments and use the Objects list to select each part. Import behavior was checked against the [official Bambu importer](https://github.com/bambulab/BambuStudio/blob/master/src/libslic3r/Format/bbs_3mf.cpp).
