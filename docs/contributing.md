# Contributing

Contributions are welcome, and they are greatly appreciated! Every little bit helps, and credit will always be given.

## Types of Contributions

### Report Bugs

Report bugs at <https://github.com/opengeos/anymap-ts/issues>.

If you are reporting a bug, please include:

- Your operating system name and version.
- Any details about your local setup that might be helpful in troubleshooting.
- Detailed steps to reproduce the bug.

### Fix Bugs

Look through the GitHub issues for bugs. Anything tagged with "bug" and "help wanted" is open to whoever wants to implement it.

### Implement Features

Look through the GitHub issues for features. Anything tagged with "enhancement" and "help wanted" is open to whoever wants to implement it.

### Write Documentation

anymap-ts could always use more documentation, whether as part of the official docs, in docstrings, or even on the web in blog posts, articles, and such.

### Submit Feedback

The best way to send feedback is to file an issue at <https://github.com/opengeos/anymap-ts/issues>.

If you are proposing a feature:

- Explain in detail how it would work.
- Keep the scope as narrow as possible, to make it easier to implement.
- Remember that this is a volunteer-driven project, and that contributions are welcome.

## Get Started!

Ready to contribute? Here's how to set up anymap-ts for local development.

1. Fork the anymap-ts repo on GitHub.

2. Clone your fork locally:

    ```bash
    git clone git@github.com:your_name_here/anymap-ts.git
    ```

3. Install your local copy into a virtual environment:

    ```bash
    cd anymap-ts
    pip install -e ".[dev]"
    npm install --legacy-peer-deps
    ```

4. Create a branch for local development:

    ```bash
    git checkout -b name-of-your-bugfix-or-feature
    ```

5. Make your changes locally.

6. Build the TypeScript code:

    ```bash
    npm run build:all
    ```

7. Commit your changes and push your branch to GitHub:

    ```bash
    git add .
    git commit -m "Your detailed description of your changes."
    git push origin name-of-your-bugfix-or-feature
    ```

8. Submit a pull request through the GitHub website.

## Pull Request Guidelines

Before you submit a pull request, check that it meets these guidelines:

1. The pull request should include tests if applicable.
2. If the pull request adds functionality, the docs should be updated.
3. The pull request should work for Python 3.10+.

## Project Structure

```
anymap-ts/
├── src/                    # TypeScript source
│   ├── core/               # Base classes
│   ├── maplibre/           # MapLibre implementation
│   ├── mapbox/             # Mapbox implementation
│   ├── leaflet/            # Leaflet implementation
│   ├── openlayers/         # OpenLayers implementation
│   ├── deckgl/             # DeckGL implementation
│   ├── cesium/             # Cesium implementation
│   └── types/              # Type definitions
├── anymap_ts/              # Python package
│   ├── maplibre.py         # MapLibreMap class
│   ├── mapbox.py           # MapboxMap class
│   ├── leaflet.py          # LeafletMap class
│   ├── openlayers.py       # OpenLayersMap class
│   ├── deckgl.py           # DeckGLMap class
│   ├── cesium.py           # CesiumMap class
│   ├── keplergl.py         # KeplerGLMap class
│   ├── potree.py           # PotreeViewer class
│   ├── static/             # Built JS/CSS
│   └── templates/          # HTML export templates
└── docs/                   # Documentation
    └── notebooks/          # Example notebooks
```

## Build Commands

```bash
# Build all libraries
npm run build:all

# Build specific library
npm run build:maplibre
npm run build:mapbox
npm run build:leaflet
npm run build:deckgl
npm run build:openlayers
npm run build:cesium

# Watch mode
npm run watch
```
