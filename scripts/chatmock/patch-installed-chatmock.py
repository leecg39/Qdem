#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path
import sys


UPSTREAM_IMPORT = "from .upstream import normalize_model_name, start_upstream_request\n"
UPSTREAM_IMPORT_PATCH = (
    "from .upstream import normalize_model_name, start_upstream_request\n"
    "from .upstream import start_upstream_responses_passthrough\n"
)

UPSTREAM_APPEND_MARKER = "    return upstream, None\n"
UPSTREAM_APPEND_PATCH = """    return upstream, None\n\n\ndef start_upstream_responses_passthrough(payload: Dict[str, Any]):\n    access_token, account_id = get_effective_chatgpt_auth()\n    if not access_token or not account_id:\n        resp = make_response(\n            jsonify(\n                {\n                    "error": {\n                        "message": "Missing ChatGPT credentials. Run \'python3 chatmock.py login\' first.",\n                    }\n                }\n            ),\n            401,\n        )\n        for k, v in build_cors_headers().items():\n            resp.headers.setdefault(k, v)\n        return None, resp\n\n    verbose = False\n    try:\n        verbose = bool(current_app.config.get("VERBOSE"))\n    except Exception:\n        verbose = False\n    if verbose:\n        _log_json("OUTBOUND >> ChatGPT Responses passthrough payload", payload)\n\n    headers = {\n        "Authorization": f"Bearer {access_token}",\n        "Content-Type": "application/json",\n        "Accept": "text/event-stream",\n        "chatgpt-account-id": account_id,\n        "OpenAI-Beta": "responses=experimental",\n    }\n\n    session_id = payload.get("prompt_cache_key") or payload.get("session_id")\n    if isinstance(session_id, str) and session_id.strip():\n        headers["session_id"] = session_id.strip()\n\n    try:\n        upstream = requests.post(\n            CHATGPT_RESPONSES_URL,\n            headers=headers,\n            json=payload,\n            stream=True,\n            timeout=600,\n        )\n    except requests.RequestException as e:\n        resp = make_response(jsonify({"error": {"message": f"Upstream ChatGPT request failed: {e}"}}), 502)\n        for k, v in build_cors_headers().items():\n            resp.headers.setdefault(k, v)\n        return None, resp\n    return upstream, None\n"""

MODELS_BLOCK_OLD = '    models = {"object": "list", "data": data}\n'
MODELS_BLOCK_NEW = '    models = {"object": "list", "data": data, "models": data}\n'

RESPONSES_ROUTE = """\n\n@openai_bp.route("/v1/responses", methods=["POST"])\ndef responses() -> Response:\n    verbose = bool(current_app.config.get("VERBOSE"))\n    debug_model = current_app.config.get("DEBUG_MODEL")\n\n    raw = request.get_data(cache=True, as_text=True) or ""\n    if verbose:\n        try:\n            print("IN POST /v1/responses\\n" + raw)\n        except Exception:\n            pass\n\n    try:\n        payload = json.loads(raw) if raw else {}\n    except Exception:\n        err = {"error": {"message": "Invalid JSON body"}}\n        if verbose:\n            _log_json("OUT POST /v1/responses", err)\n        return jsonify(err), 400\n\n    if not isinstance(payload, dict):\n        err = {"error": {"message": "Request body must be a JSON object"}}\n        if verbose:\n            _log_json("OUT POST /v1/responses", err)\n        return jsonify(err), 400\n\n    requested_model = payload.get("model")\n    payload["model"] = normalize_model_name(requested_model, debug_model)\n\n    upstream, error_resp = start_upstream_responses_passthrough(payload)\n    if error_resp is not None:\n        if verbose:\n            try:\n                body = error_resp.get_data(as_text=True)\n                if body:\n                    try:\n                        parsed = json.loads(body)\n                    except Exception:\n                        parsed = body\n                    _log_json("OUT POST /v1/responses", parsed)\n            except Exception:\n                pass\n        return error_resp\n\n    record_rate_limits_from_response(upstream)\n\n    is_stream = bool(payload.get("stream", False))\n    if is_stream:\n        def _gen():\n            try:\n                for chunk in upstream.iter_content(chunk_size=None):\n                    if chunk:\n                        yield chunk\n            finally:\n                upstream.close()\n\n        resp = Response(\n            _gen(),\n            status=upstream.status_code,\n            mimetype="text/event-stream",\n            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},\n        )\n        for k, v in build_cors_headers().items():\n            resp.headers.setdefault(k, v)\n        return resp\n\n    try:\n        body = upstream.content\n        resp = Response(body, status=upstream.status_code, mimetype="application/json")\n    finally:\n        upstream.close()\n    for k, v in build_cors_headers().items():\n        resp.headers.setdefault(k, v)\n    return resp\n"""


def detect_chatmock_package() -> Path:
    override = Path.home() / ".local/share/uv/tools/chatmock/lib"
    candidates = sorted(override.glob("python*/site-packages/chatmock"))
    if not candidates:
        raise FileNotFoundError(
            "Could not find ChatMock under ~/.local/share/uv/tools/chatmock/lib/python*/site-packages/chatmock"
        )
    return candidates[-1]


def patch_upstream(py_path: Path) -> bool:
    text = py_path.read_text(encoding="utf-8")
    changed = False
    if "start_upstream_responses_passthrough" not in text:
        if UPSTREAM_IMPORT not in text:
            raise RuntimeError(f"Expected import anchor not found in {py_path}")
        text = text.replace(UPSTREAM_IMPORT, UPSTREAM_IMPORT_PATCH, 1)
        if UPSTREAM_APPEND_MARKER not in text:
            raise RuntimeError(f"Expected append anchor not found in {py_path}")
        text = text.replace(UPSTREAM_APPEND_MARKER, UPSTREAM_APPEND_PATCH, 1)
        changed = True
    if changed:
        _ = py_path.write_text(text, encoding="utf-8")
    return changed


def patch_routes(py_path: Path) -> bool:
    text = py_path.read_text(encoding="utf-8")
    changed = False
    if "start_upstream_responses_passthrough" not in text:
        if UPSTREAM_IMPORT not in text:
            raise RuntimeError(f"Expected import anchor not found in {py_path}")
        text = text.replace(UPSTREAM_IMPORT, UPSTREAM_IMPORT_PATCH, 1)
        changed = True
    if MODELS_BLOCK_OLD in text:
        text = text.replace(MODELS_BLOCK_OLD, MODELS_BLOCK_NEW, 1)
        changed = True
    if '@openai_bp.route("/v1/responses", methods=["POST"])' not in text:
        marker = '@openai_bp.route("/v1/models", methods=["GET"])\ndef list_models() -> Response:\n'
        if marker not in text:
            raise RuntimeError(f"Expected models route anchor not found in {py_path}")
        text = text.replace(marker, RESPONSES_ROUTE + "\n\n" + marker, 1)
        changed = True
    if changed:
        _ = py_path.write_text(text, encoding="utf-8")
    return changed


class Args(argparse.Namespace):
    chatmock_dir: str | None = None


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Patch an installed ChatMock for Codex /v1/responses compatibility"
    )
    _ = parser.add_argument(
        "--chatmock-dir", help="Path to installed chatmock package directory"
    )
    args = parser.parse_args(namespace=Args())

    package_dir = (
        Path(args.chatmock_dir).expanduser().resolve()
        if args.chatmock_dir
        else detect_chatmock_package()
    )
    upstream_py = package_dir / "upstream.py"
    routes_py = package_dir / "routes_openai.py"
    if not upstream_py.exists() or not routes_py.exists():
        raise FileNotFoundError(f"ChatMock files not found under {package_dir}")

    upstream_changed = patch_upstream(upstream_py)
    routes_changed = patch_routes(routes_py)
    if upstream_changed or routes_changed:
        print(f"Patched ChatMock at {package_dir}")
    else:
        print(f"ChatMock already patched at {package_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
