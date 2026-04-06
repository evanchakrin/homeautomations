"""Discover all Wiz smart lights on the local network via UDP broadcast."""

import socket
import json
import time

BROADCAST_PORT = 38899
LISTEN_TIMEOUT = 5
BROADCAST_RETRIES = 3


def discover(local_ip: str = "192.168.39.134", subnet_broadcast: str = "192.168.39.255") -> list[dict]:
    """Send registration broadcast and collect responding Wiz devices.

    Returns a list of dicts: {ip, mac, state, dimming, temp, sceneId}
    """
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    sock.settimeout(LISTEN_TIMEOUT)

    msg = json.dumps({
        "method": "registration",
        "params": {
            "phoneMac": "AAAAAAAAAAAA",
            "register": False,
            "phoneIp": local_ip,
            "id": "1",
        },
    })

    # Broadcast multiple times to catch sleepy devices
    for _ in range(BROADCAST_RETRIES):
        sock.sendto(msg.encode(), (subnet_broadcast, BROADCAST_PORT))
        time.sleep(0.3)

    found: dict[str, str] = {}
    start = time.time()
    while time.time() - start < LISTEN_TIMEOUT:
        try:
            data, addr = sock.recvfrom(1024)
            ip = addr[0]
            if ip not in found:
                resp = json.loads(data.decode())
                mac = resp.get("result", {}).get("mac", "?")
                found[ip] = mac
        except socket.timeout:
            break
    sock.close()

    # Query each device for current state
    devices = []
    sock2 = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock2.settimeout(2)

    for ip in sorted(found, key=lambda x: int(x.split(".")[-1])):
        try:
            sock2.sendto(json.dumps({"method": "getPilot", "params": {}}).encode(), (ip, BROADCAST_PORT))
            data, _ = sock2.recvfrom(1024)
            r = json.loads(data.decode()).get("result", {})
            devices.append({
                "ip": ip,
                "mac": r.get("mac", found[ip]),
                "state": r.get("state", False),
                "dimming": r.get("dimming"),
                "temp": r.get("temp"),
                "sceneId": r.get("sceneId"),
            })
        except Exception:
            devices.append({"ip": ip, "mac": found[ip], "state": None, "dimming": None, "temp": None, "sceneId": None})

    sock2.close()
    return devices


def print_devices(devices: list[dict]) -> None:
    """Pretty-print discovered devices."""
    print(f"\n{'IP':<20} {'MAC':<18} {'State':<5} {'Dim':>4}  {'Temp':>6}  {'Scene':>5}")
    print("-" * 70)
    for d in devices:
        state = "ON" if d["state"] else "OFF" if d["state"] is not None else "?"
        dim = f"{d['dimming']}%" if d["dimming"] is not None else "-"
        temp = f"{d['temp']}K" if d["temp"] else "-"
        scene = str(d["sceneId"]) if d["sceneId"] else "-"
        print(f"{d['ip']:<20} {d['mac']:<18} {state:<5} {dim:>4}  {temp:>6}  {scene:>5}")
    print(f"\nTotal: {len(devices)} devices")


if __name__ == "__main__":
    devices = discover()
    print_devices(devices)
