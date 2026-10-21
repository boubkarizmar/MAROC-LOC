#!/usr/bin/env python3
import json, urllib.request

BASE = "http://localhost:8081/api"

def call(method, path, data=None):
    req = urllib.request.Request(f"{BASE}{path}", data=json.dumps(data).encode() if data else None, headers={"Content-Type": "application/json"}, method=method)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())

login = call("POST", "/v1/auth/login", {"email": "admin@gmail.com", "password": "Admin@123"})
print("login ok, access expires in", login.get("expiresIn"))
refresh = call("POST", "/v1/auth/refresh", {"refreshToken": login["refreshToken"]})
print("refresh ok, new access expires in", refresh.get("expiresIn"))
print("tokens rotated:", refresh.get("refreshToken") != login.get("refreshToken"))
