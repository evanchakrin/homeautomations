"""Control Wiz smart lights — set scene, dimming, color, on/off."""

import socket
import json
import time
from typing import Optional

BROADCAST_PORT = 38899

# Wiz scene IDs
SCENES = {
    "cozy": 6,
    "warm_white": 12,
    "focus": 14,
    "bedtime": 18,
    "daylight": 11,
    "cool_white": 13,
    "night_light": 29,
    "candlelight": 30,
    "golden_white": 31,
    "pulse": 32,
    "steampunk": 33,
}


def send_command(ip: str, method: str, params: dict, timeout: float = 1.5) -> dict | None:
    """Send a single UDP command to a Wiz light and return the response."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(timeout)
    try:
        msg = json.dumps({"method": method, "params": params})
        sock.sendto(msg.encode(), (ip, BROADCAST_PORT))
        data, _ = sock.recvfrom(1024)
        return json.loads(data.decode())
    except Exception as e:
        return {"error": str(e)}
    finally:
        sock.close()


def set_pilot(ip: str, **params) -> bool:
    """Set pilot parameters on a single light. Returns True on success."""
    resp = send_command(ip, "setPilot", params)
    if resp and resp.get("result", {}).get("success"):
        return True
    return False


def get_pilot(ip: str) -> dict | None:
    """Get current state of a single light."""
    resp = send_command(ip, "getPilot", {})
    return resp.get("result") if resp and "result" in resp else None


def set_scene(ips: list[str], scene: str | int, dimming: Optional[int] = None) -> tuple[int, int]:
    """Set scene on multiple lights. Returns (success_count, fail_count)."""
    scene_id = SCENES.get(scene, scene) if isinstance(scene, str) else scene
    params: dict = {"sceneId": scene_id}
    if dimming is not None:
        params["dimming"] = max(10, min(100, dimming))

    ok, fail = 0, 0
    for ip in ips:
        if set_pilot(ip, **params):
            ok += 1
        else:
            fail += 1
        time.sleep(0.05)
    return ok, fail


def set_brightness(ips: list[str], dimming: int) -> tuple[int, int]:
    """Set brightness (10-100) on multiple lights."""
    dimming = max(10, min(100, dimming))
    ok, fail = 0, 0
    for ip in ips:
        if set_pilot(ip, dimming=dimming):
            ok += 1
        else:
            fail += 1
        time.sleep(0.05)
    return ok, fail


def set_color(ips: list[str], r: int, g: int, b: int, dimming: int = 100) -> tuple[int, int]:
    """Set RGB color on multiple lights."""
    ok, fail = 0, 0
    for ip in ips:
        if set_pilot(ip, r=r, g=g, b=b, dimming=max(10, min(100, dimming))):
            ok += 1
        else:
            fail += 1
        time.sleep(0.05)
    return ok, fail


def set_temp(ips: list[str], temp: int, dimming: Optional[int] = None) -> tuple[int, int]:
    """Set color temperature (2200-6500K) on multiple lights."""
    params: dict = {"temp": max(2200, min(6500, temp))}
    if dimming is not None:
        params["dimming"] = max(10, min(100, dimming))
    ok, fail = 0, 0
    for ip in ips:
        if set_pilot(ip, **params):
            ok += 1
        else:
            fail += 1
        time.sleep(0.05)
    return ok, fail


def turn_on(ips: list[str]) -> tuple[int, int]:
    """Turn on multiple lights."""
    ok, fail = 0, 0
    for ip in ips:
        if set_pilot(ip, state=True):
            ok += 1
        else:
            fail += 1
        time.sleep(0.05)
    return ok, fail


def turn_off(ips: list[str]) -> tuple[int, int]:
    """Turn off multiple lights."""
    ok, fail = 0, 0
    for ip in ips:
        if set_pilot(ip, state=False):
            ok += 1
        else:
            fail += 1
        time.sleep(0.05)
    return ok, fail


if __name__ == "__main__":
    import sys
    from discover import discover

    devices = discover()
    ips = [d["ip"] for d in devices]
    print(f"Found {len(ips)} lights")

    if len(sys.argv) < 2:
        print("Usage: python control.py <command> [args]")
        print("Commands: on, off, scene <name>, dim <0-100>, color <r> <g> <b>, temp <2200-6500>")
        print(f"Scenes: {', '.join(SCENES.keys())}")
        sys.exit(1)

    cmd = sys.argv[1].lower()

    if cmd == "on":
        ok, fail = turn_on(ips)
    elif cmd == "off":
        ok, fail = turn_off(ips)
    elif cmd == "scene" and len(sys.argv) >= 3:
        scene = sys.argv[2].lower()
        dim = int(sys.argv[3]) if len(sys.argv) >= 4 else None
        ok, fail = set_scene(ips, scene, dim)
    elif cmd == "dim" and len(sys.argv) >= 3:
        ok, fail = set_brightness(ips, int(sys.argv[2]))
    elif cmd == "color" and len(sys.argv) >= 5:
        ok, fail = set_color(ips, int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]))
    elif cmd == "temp" and len(sys.argv) >= 3:
        dim = int(sys.argv[3]) if len(sys.argv) >= 4 else None
        ok, fail = set_temp(ips, int(sys.argv[2]), dim)
    else:
        print(f"Unknown command: {cmd}")
        sys.exit(1)

    print(f"Done: {ok}/{ok + fail} succeeded")
