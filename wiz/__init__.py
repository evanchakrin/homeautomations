"""Wiz smart light control package."""

from .discover import discover, print_devices
from .control import (
    set_scene,
    set_brightness,
    set_color,
    set_temp,
    turn_on,
    turn_off,
    get_pilot,
    SCENES,
)

__all__ = [
    "discover",
    "print_devices",
    "set_scene",
    "set_brightness",
    "set_color",
    "set_temp",
    "turn_on",
    "turn_off",
    "get_pilot",
    "SCENES",
]
