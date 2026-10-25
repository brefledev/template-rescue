# Signal Assembly

Original Unfinished Botness artwork in electric cyan, coral, white and deep navy, with Syne display typography.

## Assets

- [Animated banner](banner-animated.gif): 1600 × 600, six-second loop.
- [Static banner](banner-static.png): reduced-motion fallback.
- [Signal share image](share-01.png): 1200 × 630.
- [Assembly share image](share-02.png): 1200 × 630.
- [Close-up share image](share-03.png): 1200 × 630.

## Source and reproduction

Serve this directory over a local HTTP server and open index.html in a browser at 1× pixel density. The original program is final-program.js. MODE=0 renders the animated banner; MODE=1, 2 or 3 renders the share compositions. The matching share-01-program.js, share-02-program.js and share-03-program.js files are included. RECORD controls WebM export. PNG and WebM download links appear below the canvas. GIF encoding was performed with ffmpeg from the rendered canvas video.

The original glyph-SDF program defines the bot, separated lobes, capsule-eye interpretation, palette and choreography. No official avatar paths are copied. This is independent, unofficial artwork with no Grok or xAI affiliation.

## Third-party attribution

- Renderer: [play.core](https://github.com/ertdfgcvb/play.core), commit b2d30ac618db573c228a4fa287ddedf48e642e79. The unmodified Canvas2D runner and required core files are included, preserving their source headers and [Apache License 2.0](play-core/LICENSE). The effect is listed in [Uncommon Web](https://webdev.teknium.io/d/glyph/demos/play-core-ascii/).
- Typography: [Syne](https://github.com/google/fonts/tree/main/ofl/syne), Copyright 2017 The Syne Project Authors. The original font and a display-character subset used by the program are included under the [SIL Open Font License 1.1](fonts/OFL.txt). The embedded subset is loaded under the name UBDisplay.
- Original artwork and program: covered by the repository's [MIT license](../../LICENSE). Third-party licenses above continue to apply to their respective components.
