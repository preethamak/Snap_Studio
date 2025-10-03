#!/usr/bin/env python3
"""
Debug script to check lifestyle shots API response
"""

import requests
import json

base_url = "https://pixelflow-6.preview.emergentagent.com/api"

test_data = {
    "prompt": "modern minimalist living room with natural lighting",
    "productImageUrl": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500",
    "numResults": 1,
    "sync": True,
    "userId": "debug_user"
}

try:
    response = requests.post(f"{base_url}/bria/lifestyle-text", json=test_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")