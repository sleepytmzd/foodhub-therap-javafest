#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Batch add restaurants to: http://localhost:8000/add-point-restaurant
Fields sent per restaurant:
- name, description, location, category

Usage:
  python add_restaurants.py
  # or read from a JSON file:
  python add_restaurants.py restaurants.json
  # or read from a CSV file (headers must match the field names above):
  python add_restaurants.py restaurants.csv
"""

import sys
import time
import json
import csv
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Iterable, Optional
import requests

BASE_URL = "http://localhost:8000/add-point-restaurant"

# ---------- Data model ----------

@dataclass
class RestaurantItem:
    name: str
    description: str
    location: str
    category: str
    db_id: str

    @staticmethod
    def from_mapping(m: Dict[str, Any]) -> "RestaurantItem":
        # normalize and coerce types
        required = [
            "name", "description", "location", "category", "db_id"
        ]
        missing = [k for k in required if k not in m or m[k] in (None, "")]
        if missing:
            raise ValueError(f"Missing required fields: {missing}")

        return RestaurantItem(
            name=str(m["name"]),
            description=str(m["description"]),
            location=str(m["location"]),
            category=str(m["category"]),
            db_id=str(m["db_id"])
        )

# ---------- Sample data (edit/extend as needed) ----------

SAMPLE_RESTAURANTS: List[RestaurantItem] = [
    RestaurantItem(
        name="Sultan's Dine",
        description="Bengali. You can offers here",
        location="Dhanmondi, Dhaka",
        category="Bengali",
        db_id="188as11"
    ),
    RestaurantItem(
        name="Tandoor House",
        description="Authentic Indian Cuisine",
        location="Gulshan, Dhaka",
        category="Indian",
        db_id="asd2axsas"
    ),
    RestaurantItem(
        name="Spice Heaven",
        description="Flavors from all around the world",
        location="Banani, Dhaka",
        category="Fusion",
        db_id="asda112aa"
    ),
]

# ---------- IO helpers ----------

def load_from_json(path: str) -> List[RestaurantItem]:
    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    if isinstance(raw, dict) and "items" in raw:
        raw = raw["items"]
    if not isinstance(raw, list):
        raise ValueError("JSON must be a list of objects or an object with 'items' list.")
    return [RestaurantItem.from_mapping(x) for x in raw]

def load_from_csv(path: str) -> List[RestaurantItem]:
    with open(path, "r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    if not rows:
        return []
    return [RestaurantItem.from_mapping(r) for r in rows]

def load_items_from_arg(path: str) -> List[RestaurantItem]:
    if path.lower().endswith(".json"):
        return load_from_json(path)
    if path.lower().endswith(".csv"):
        return load_from_csv(path)
    raise ValueError("Unsupported file type. Use .json or .csv")

# ---------- HTTP sender ----------

def send_restaurant_item(item: RestaurantItem, session: Optional[requests.Session] = None, retries: int = 2, pause_s: float = 0.6) -> Dict[str, Any]:
    """
    Sends one RestaurantItem as query params to the endpoint.
    If your server expects POST form data or JSON, switch 'params=' to 'data=' or 'json=' below.
    """
    sess = session or requests.Session()

    params = asdict(item)

    last_err = None
    for attempt in range(retries + 1):
        try:
            # Using GET with query params because your example URL encodes fields in the query.
            # If the server expects POST: replace with sess.post(BASE_URL, data=params, timeout=10)
            resp = sess.post(BASE_URL, params=params, timeout=10)
            ok = 200 <= resp.status_code < 300
            return {
                "ok": ok,
                "status_code": resp.status_code,
                "url": resp.url,
                "response_text": resp.text[:5000],  # avoid dumping huge bodies
            }
        except requests.RequestException as e:
            last_err = e
            if attempt < retries:
                time.sleep(pause_s)
            else:
                return {
                    "ok": False,
                    "status_code": None,
                    "url": f"{BASE_URL}?{requests.compat.urlencode(params)}",
                    "error": str(last_err),
                }

def batch_send(items: Iterable[RestaurantItem]) -> None:
    with requests.Session() as sess:
        for idx, item in enumerate(items, start=1):
            result = send_restaurant_item(item, session=sess)
            if result.get("ok"):
                print(f"[{idx}] ✅ Sent '{item.name}' → {result['url']} (status {result['status_code']})")
            else:
                print(f"[{idx}] ❌ Failed '{item.name}' → {result.get('url')}")
                if "status_code" in result and result["status_code"] is not None:
                    print(f"    HTTP {result['status_code']}: {result.get('response_text')}")
                else:
                    print(f"    Error: {result.get('error')}")

# ---------- Main ----------

def main(argv: List[str]) -> None:
    items = SAMPLE_RESTAURANTS

    print(f"Sending {len(items)} restaurant(s) to {BASE_URL} ...")
    batch_send(items)

if __name__ == "__main__":
    main(sys.argv)
