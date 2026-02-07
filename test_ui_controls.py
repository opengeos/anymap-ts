#!/usr/bin/env python3
"""Test script for UI controls."""

import sys

sys.path.insert(0, ".")

from anymap_ts import MapLibreMap


def main():
    """Run UI controls tests."""
    print("Testing UI Controls...")

    # Test 1: PMTiles Control
    print("\n1. Testing PMTiles Control...")
    m = MapLibreMap(center=[11.25, 43.77], zoom=12)
    m.add_pmtiles_control(
        position="top-right",
        collapsed=False,
        default_url="https://pmtiles.io/protomaps(vector)ODbL_firenze.pmtiles",
    )
    print("   ✓ PMTiles control added successfully")

    # Test 2: COG Control
    print("\n2. Testing COG Control...")
    m2 = MapLibreMap(center=[-120, 37], zoom=6)
    m2.add_cog_control(position="top-right", collapsed=False, default_colormap="viridis")
    print("   ✓ COG control added successfully")

    # Test 3: Zarr Control
    print("\n3. Testing Zarr Control...")
    m3 = MapLibreMap(center=[0, 20], zoom=2)
    m3.add_zarr_control(position="top-right", collapsed=False)
    print("   ✓ Zarr control added successfully")

    # Test 4: Vector Control
    print("\n4. Testing Vector Control...")
    m4 = MapLibreMap(center=[0, 20], zoom=2)
    m4.add_vector_control(
        position="top-right",
        collapsed=False,
        default_url="https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson",
    )
    print("   ✓ Vector control added successfully")

    # Test 5: All controls together
    print("\n5. Testing all controls together...")
    m5 = MapLibreMap(center=[0, 20], zoom=2)
    m5.add_pmtiles_control(position="top-right", collapsed=True)
    m5.add_cog_control(position="top-right", collapsed=True)
    m5.add_zarr_control(position="top-right", collapsed=True)
    m5.add_vector_control(position="top-right", collapsed=True)
    print("   ✓ All controls added successfully")

    print("\n✅ All tests passed!")
    print("\nTo test in Jupyter notebook, run:")
    print("  jupyter lab examples/ui_controls.ipynb")


if __name__ == "__main__":
    main()
