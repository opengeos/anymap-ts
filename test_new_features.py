#!/usr/bin/env python3
"""
Test script for new STAC layer and legend control features.
"""

import sys

sys.path.insert(0, "/home/qiusheng/Documents/GitHub/anymap-ts")

from anymap_ts import MapLibreMap


def test_stac_layer():
    """Test STAC layer functionality."""
    print("Testing STAC layer...")

    # Create a map
    m = MapLibreMap(center=[-122.4, 37.8], zoom=10)

    # Test adding a STAC layer with a public example
    try:
        # Use a sample STAC item URL from Microsoft Planetary Computer
        stac_url = "https://planetarycomputer.microsoft.com/api/stac/v1/collections/landsat-c2-l2/items/LC08_L2SP_044034_20220503_02_T1"

        m.add_stac_layer(
            url=stac_url,
            assets=["red", "green", "blue"],
            rescale=[8000, 12000],
            layer_id="landsat-rgb",
            opacity=0.8,
        )
        print("✓ STAC layer added successfully")

        # Check if layer was tracked
        if "landsat-rgb" in m._layers:
            print("✓ STAC layer properly tracked")
            layer_info = m._layers["landsat-rgb"]
            if layer_info.get("stac_url") == stac_url:
                print("✓ STAC metadata stored correctly")
            else:
                print("✗ STAC metadata not stored correctly")
        else:
            print("✗ STAC layer not tracked properly")

    except Exception as e:
        print(f"✗ Error testing STAC layer: {e}")

    return m


def test_legend():
    """Test legend control functionality."""
    print("\nTesting legend control...")

    # Create a map
    m = MapLibreMap(center=[0, 0], zoom=2)

    try:
        # Test basic legend
        m.add_legend(
            title="Land Cover Types",
            labels=["Forest", "Water", "Urban", "Agriculture"],
            colors=["#228B22", "#0000FF", "#808080", "#FFD700"],
            position="top-right",
            opacity=0.9,
        )
        print("✓ Legend added successfully")

        # Check if legend was tracked
        legend_keys = [k for k in m._controls.keys() if k.startswith("legend")]
        if legend_keys:
            print("✓ Legend properly tracked")
            legend_info = m._controls[legend_keys[0]]
            if legend_info.get("type") == "legend":
                print("✓ Legend metadata stored correctly")
            else:
                print("✗ Legend metadata not stored correctly")
        else:
            print("✗ Legend not tracked properly")

        # Test legend with invalid parameters
        try:
            m.add_legend(
                title="Invalid Legend",
                labels=["A", "B"],
                colors=["#ff0000"],  # Mismatched count
            )
            print("✗ Should have caught mismatched labels/colors")
        except ValueError as e:
            print("✓ Correctly caught mismatched labels/colors error")

        # Test invalid position
        try:
            m.add_legend(
                title="Bad Position",
                labels=["A"],
                colors=["#ff0000"],
                position="invalid-position",
            )
            print("✗ Should have caught invalid position")
        except ValueError as e:
            print("✓ Correctly caught invalid position error")

    except Exception as e:
        print(f"✗ Error testing legend: {e}")

    return m


def test_integration():
    """Test both features together."""
    print("\nTesting integration...")

    try:
        # Create map with both features
        m = MapLibreMap(center=[-100, 40], zoom=4)

        # Add a STAC layer
        m.add_stac_layer(
            url="https://planetarycomputer.microsoft.com/api/stac/v1/collections/sentinel-2-l2a/items/S2A_MSIL2A_20220101T181901_N0301_R027_T10TEM_20220101T201906",
            assets=["red", "green", "blue"],
            layer_id="sentinel-rgb",
        )

        # Add a corresponding legend
        m.add_legend(
            title="Sentinel-2 RGB",
            labels=["Red Band", "Green Band", "Blue Band"],
            colors=["#FF0000", "#00FF00", "#0000FF"],
            position="bottom-left",
        )

        print("✓ Both STAC layer and legend added successfully")
        print(f"✓ Map has {len(m._layers)} layers and {len(m._controls)} controls")

    except Exception as e:
        print(f"✗ Error in integration test: {e}")


def main():
    """Run all tests."""
    print("=== Testing new anymap-ts features ===")

    # Test STAC functionality
    test_stac_layer()

    # Test legend functionality
    test_legend()

    # Test integration
    test_integration()

    print("\n=== Test completed ===")


if __name__ == "__main__":
    main()
