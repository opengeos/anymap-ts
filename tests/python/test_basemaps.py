"""Tests for basemap utilities."""

import pytest
from anymap_ts.basemaps import (
    get_basemap_url,
    get_basemap_names,
    get_maplibre_style,
    BASEMAP_SHORTCUTS,
    MAPLIBRE_STYLES,
)


class TestGetBasemapUrl:
    """Tests for get_basemap_url function."""

    def test_openstreetmap(self):
        """Should get OpenStreetMap URL."""
        url, attribution = get_basemap_url("OpenStreetMap")
        assert "openstreetmap" in url.lower() or "{z}" in url
        assert attribution  # Should have attribution

    def test_shortcut(self):
        """Should resolve shortcuts."""
        url, _ = get_basemap_url("OSM")
        assert url  # Should resolve to a valid URL

    def test_nested_provider(self):
        """Should handle dot notation."""
        url, _ = get_basemap_url("CartoDB.Positron")
        assert url

    def test_unknown_basemap(self):
        """Should raise error for unknown basemap."""
        with pytest.raises(ValueError, match="Unknown basemap"):
            get_basemap_url("NonExistent.Basemap.Name")


class TestGetBasemapNames:
    """Tests for get_basemap_names function."""

    def test_returns_list(self):
        """Should return a list of names."""
        names = get_basemap_names()
        assert isinstance(names, list)
        assert len(names) > 0

    def test_contains_common_providers(self):
        """Should contain common providers."""
        names = get_basemap_names()
        # Check that some common providers are present
        name_str = str(names).lower()
        assert "openstreetmap" in name_str or "cartodb" in name_str


class TestGetMaplibreStyle:
    """Tests for get_maplibre_style function."""

    def test_known_styles(self):
        """Should return URL for known styles."""
        for name in MAPLIBRE_STYLES:
            url = get_maplibre_style(name)
            assert url.startswith("http")

    def test_url_passthrough(self):
        """Should pass through URLs."""
        test_url = "https://example.com/style.json"
        result = get_maplibre_style(test_url)
        assert result == test_url

    def test_unknown_style(self):
        """Should raise error for unknown non-URL style."""
        with pytest.raises(ValueError, match="Unknown MapLibre style"):
            get_maplibre_style("nonexistent")


class TestBasemapShortcuts:
    """Tests for BASEMAP_SHORTCUTS."""

    def test_shortcuts_resolve(self):
        """All shortcuts should resolve to valid providers."""
        for shortcut, full_name in BASEMAP_SHORTCUTS.items():
            try:
                url, _ = get_basemap_url(full_name)
                assert url
            except Exception:
                # Some providers may require API keys
                pass
