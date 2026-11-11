"""Firestore REST for the aibytes database. A token and a transport are passed
in, so tests never call gcloud or the network."""

import json
import shutil
import subprocess
import urllib.error
import urllib.parse
import urllib.request
from datetime import timezone

PROJECT = "ai-bytes-b42d2"
DATABASE = "aibytes"
AUTH_FIX = "Run gcloud auth login. The project is %s and the database is %s." % (PROJECT, DATABASE)
ROOT = "https://firestore.googleapis.com/v1/projects/%s/databases/%s/documents" % (PROJECT, DATABASE)


class AuthError(Exception):
    """The token was missing or Firestore refused it."""


def gcloud_token(run=subprocess.run, which=shutil.which):
    """The publisher's own access token. Nothing is stored."""
    if which("gcloud") is None:
        raise AuthError("gcloud is missing. " + AUTH_FIX)
    try:
        proc = run(["gcloud", "auth", "print-access-token"], capture_output=True, text=True, check=False)
    except FileNotFoundError:
        raise AuthError("gcloud is missing. " + AUTH_FIX)
    if proc.returncode != 0 or not proc.stdout.strip():
        raise AuthError("gcloud did not return a token. " + AUTH_FIX)
    return proc.stdout.strip()


def urlopen_transport(method, url, body=None, headers=None):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as err:
        raw = err.read()
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {}
        return err.code, payload


def _value(field):
    if not field:
        return None
    if "stringValue" in field:
        return field["stringValue"]
    if "timestampValue" in field:
        return field["timestampValue"]
    return None


def decode(document):
    fields = document.get("fields") or {}
    return {
        "name": document.get("name"),
        "email": _value(fields.get("email")),
        "created_at": _value(fields.get("created_at")),
        "imported_at": _value(fields.get("imported_at")),
        "imported_until": _value(fields.get("imported_until")),
    }


class Firestore:
    def __init__(self, token, transport=urlopen_transport):
        self._headers = {"Authorization": "Bearer " + token, "Content-Type": "application/json"}
        self._transport = transport

    def _call(self, method, url, body=None):
        status, payload = self._transport(method, url, body, self._headers)
        if status in (401, 403):
            raise AuthError("Firestore refused the token. " + AUTH_FIX)
        if status >= 400:
            raise RuntimeError("Firestore returned %s" % status)
        return payload

    def subscribers(self):
        """Every subscriber document. Pages are followed."""
        docs = []
        token = None
        while True:
            query = {"pageSize": "300"}
            if token:
                query["pageToken"] = token
            url = ROOT + "/subscribers?" + urllib.parse.urlencode(query)
            payload = self._call("GET", url)
            docs.extend(decode(doc) for doc in payload.get("documents") or [])
            token = payload.get("nextPageToken")
            if not token:
                return docs

    def mark(self, doc, until, now):
        """Set imported_at and imported_until. Other fields stay as they are."""
        stamp = now.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        body = {"fields": {
            "imported_at": {"timestampValue": stamp},
            "imported_until": {"stringValue": until},
        }}
        query = urllib.parse.urlencode([
            ("currentDocument.exists", "true"),
            ("updateMask.fieldPaths", "imported_at"),
            ("updateMask.fieldPaths", "imported_until"),
        ])
        self._call("PATCH", "https://firestore.googleapis.com/v1/" + doc["name"] + "?" + query, body)
