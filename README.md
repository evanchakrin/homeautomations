# Home Automations

A small collection of home automation projects.

- [`wiz/`](wiz/) — Local-network discovery and control for Wiz smart LED lights.
- [`calendar/`](calendar/) — Family calendar web app (Next.js + Supabase, deploys to Vercel). A Skylight Calendar Plus-style replacement.

## Wiz Smart Lights

Discover and control Wiz lights on your local network via UDP (port 38899). No cloud dependency — all commands are local.

### Quick Start

```bash
# Discover all lights on the network
python -m wiz.discover

# Control all lights
python wiz/control.py scene cozy        # Set scene (cozy, warm_white, focus, bedtime, etc.)
python wiz/control.py dim 25            # Set brightness (10-100)
python wiz/control.py scene cozy 50     # Scene + brightness
python wiz/control.py color 255 100 0   # RGB color
python wiz/control.py temp 3000         # Color temperature (2200-6500K)
python wiz/control.py on                # Turn on
python wiz/control.py off               # Turn off
```

### As a Library

```python
from wiz import discover, set_scene, set_brightness, turn_off

devices = discover()
ips = [d["ip"] for d in devices]

set_scene(ips, "cozy", dimming=25)
set_brightness(ips, 50)
turn_off(ips)
```

### Available Scenes

| Name | ID | Description |
|------|----|-------------|
| cozy | 6 | Warm, relaxed |
| warm_white | 12 | 4200K warm |
| focus | 14 | Cool daylight |
| bedtime | 18 | Very dim, warm |
| daylight | 11 | Bright daylight |
| cool_white | 13 | Neutral white |
| night_light | 29 | Ultra dim |
| candlelight | 30 | Flickering warm |
| golden_white | 31 | Rich warm |

### Network Config

Default subnet: `192.168.39.0/24`. Edit `discover.py` to change `local_ip` and `subnet_broadcast` for your network.

## Requirements

Python 3.10+ (stdlib only — no pip dependencies)
