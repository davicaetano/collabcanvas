"""
Backend Version Information

Version format: YYYY.MM.DD.BUILD
- YYYY: Year
- MM: Month
- DD: Day
- BUILD: Build number for the day (increment for each deployment/fix)
"""

__version__ = "2025.10.18.5"
__version_name__ = "Batch Operations - Final Template Fix"

def get_version():
    """Get the current backend version."""
    return __version__

def get_version_info():
    """Get detailed version information."""
    return {
        "version": __version__,
        "name": __version_name__
    }

