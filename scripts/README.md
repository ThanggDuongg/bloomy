# Image generation

`npm run generate:images` builds the item artwork from
[Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT license),
using its **3D** style. For each fruit id it downloads the matching 3D PNG, fits it into
a 512x512 square with padding on a transparent background, and writes an optimized WebP
to `public/images/fruit/`.

Why Fluent 3D: a toddler learning app needs every item to be instantly recognizable and
correctly colored, with one consistent style. Free AI text-to-image could not deliver
that reliably (wrong colors, unrecognizable results). Flat emoji (OpenMoji) were clean but
read as a bit too cartoonish for the youngest kids. Fluent's 3D emoji are rendered and
dimensional — more realistic and easier to recognize — while staying clean, consistent,
correctly colored, tiny, and easy to extend.

## Usage

```bash
npm run generate:images              # regenerate all items
npm run generate:images -- apple     # regenerate a subset by id
```

To add a new item: add it to `src/data/fruit.ts`, then map its id to a Fluent asset
folder name in the `FLUENT_FOLDER` table in `generate-images.ts`, and re-run. Browse
folder names at https://github.com/microsoft/fluentui-emoji/tree/main/assets (the 3D file
is the folder name lowercased with spaces as underscores, e.g. `Red apple` →
`red_apple_3d.png`).
