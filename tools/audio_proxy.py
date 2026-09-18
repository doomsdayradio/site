#!/usr/bin/env python3
"""Serve the site and proxy the live audio stream same-origin for local FFT tests."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.request import Request, urlopen


STREAM_URL = "https://stream.doomsday.radio/live"
SITE_ROOT = Path(__file__).resolve().parents[1]


class SiteHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE_ROOT), **kwargs)

    def do_GET(self):
        if self.path.split("?", 1)[0] == "/live":
            self.proxy_stream()
            return
        super().do_GET()

    def proxy_stream(self):
        request = Request(
            STREAM_URL,
            headers={
                "User-Agent": "DoomsdayRadioLocalProxy/1.0",
            },
        )
        try:
            upstream = urlopen(request, timeout=15)
        except Exception as error:
            self.send_error(502, f"Upstream stream unavailable: {error}")
            return

        self.send_response(upstream.status)
        content_type = upstream.headers.get("Content-Type", "audio/mpeg")
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

        try:
            while True:
                chunk = upstream.read(16 * 1024)
                if not chunk:
                    break
                self.wfile.write(chunk)
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass
        finally:
            upstream.close()


def main():
    server = ThreadingHTTPServer(("127.0.0.1", 8765), SiteHandler)
    print(f"Serving {SITE_ROOT} and proxying /live from {STREAM_URL} on http://localhost:8765")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()