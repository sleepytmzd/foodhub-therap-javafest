#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Batch add foods to: http://localhost:8000/add-point-food
Fields sent per item:
- name, description, category, nutrition_table, price, restaurant, db_id

Usage:
  python add_foods.py
  # or read from a JSON file:
  python add_foods.py foods.json
  # or read from a CSV file (headers must match the field names above):
  python add_foods.py foods.csv
"""

import sys
import time
import json
import csv
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Iterable, Optional
import requests

BASE_URL = "http://localhost:8000/add-point-food"

# ---------- Data model ----------

@dataclass
class FoodItem:
    name: str
    description: str
    category: str
    nutrition_table: str
    price: int  # keep as int; convert if source provides string/float
    restaurant: str
    db_id: str

    @staticmethod
    def from_mapping(m: Dict[str, Any]) -> "FoodItem":
        # normalize and coerce types
        required = [
            "name", "description", "category", "nutrition_table",
            "price", "restaurant", "db_id"
        ]
        missing = [k for k in required if k not in m or m[k] in (None, "")]
        if missing:
            raise ValueError(f"Missing required fields: {missing}")

        # price -> int
        price_val = m["price"]
        if isinstance(price_val, str):
            price_val = price_val.strip().replace(",", "")
        try:
            price_int = int(float(price_val))
        except Exception as e:
            raise ValueError(f"Invalid price '{m['price']}': {e}")

        return FoodItem(
            name=str(m["name"]),
            description=str(m["description"]),
            category=str(m["category"]),
            nutrition_table=str(m["nutrition_table"]),
            price=price_int,
            restaurant=str(m["restaurant"]),
            db_id=str(m["db_id"]),
        )

# ---------- Sample data (edit/extend as needed) ----------

SAMPLE_ITEMS: List[FoodItem] = [
    FoodItem(
        name="Murgir Jhol",
        description="Spicy and Jhal Jhal",
        category="Bengali",
        nutrition_table="Protein 1000cal",
        price=700,
        restaurant="Sultans Dine",
        db_id="121231dfsf32sdf12",
    ),
    FoodItem(
        name="Kacchi Biryani",
        description="Fragrant basmati, tender mutton",
        category="Bengali",
        nutrition_table="Protein 35g; Calories 850",
        price=550,
        restaurant="Sultans Dine",
        db_id="bd-kacchi-0001",
    ),
    FoodItem(
        name="Bhuna Khichuri",
        description="Comforting, smoky, rain-day classic",
        category="Bengali",
        nutrition_table="Protein 18g; Calories 520",
        price=320,
        restaurant="Sultans Dine",
        db_id="bd-khichuri-0002",
    ),
    FoodItem(
        name="Chicken Nanban",
        description="Crispy chicken with sauce on top",
        category="Pan Asian",
        nutrition_table="Protein 300g; Calories 1800",
        price=420,
        restaurant="Yumcha",
        db_id="12hha-1212-asda",
    ),
]

# ---------- IO helpers ----------

def load_from_json(path: str) -> List[FoodItem]:
    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    if isinstance(raw, dict) and "items" in raw:
        raw = raw["items"]
    if not isinstance(raw, list):
        raise ValueError("JSON must be a list of objects or an object with 'items' list.")
    return [FoodItem.from_mapping(x) for x in raw]

def load_from_csv(path: str) -> List[FoodItem]:
    with open(path, "r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    if not rows:
        return []
    return [FoodItem.from_mapping(r) for r in rows]

def load_items_from_arg(path: str) -> List[FoodItem]:
    if path.lower().endswith(".json"):
        return load_from_json(path)
    if path.lower().endswith(".csv"):
        return load_from_csv(path)
    raise ValueError("Unsupported file type. Use .json or .csv")

# ---------- HTTP sender ----------

def send_food_item(item: FoodItem, session: Optional[requests.Session] = None, retries: int = 2, pause_s: float = 0.6) -> Dict[str, Any]:
    """
    Sends one FoodItem as query params to the endpoint.
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

def batch_send(items: Iterable[FoodItem]) -> None:
    with requests.Session() as sess:
        for idx, item in enumerate(items, start=1):
            result = send_food_item(item, session=sess)
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
    
    items = SAMPLE_ITEMS

    print(f"Sending {len(items)} item(s) to {BASE_URL} ...")
    batch_send(items)

if __name__ == "__main__":
    main(sys.argv)
