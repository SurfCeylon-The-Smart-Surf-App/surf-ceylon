import requests
import json
from datetime import datetime, timedelta, timezone
import time
import sys
import os

# =======================================================================
# --- 100-KEY MULTI-LOCATION CONFIGURATION ---
# =======================================================================

# 8 Surf Spots (covering South and East coasts of Sri Lanka)
SPOT_CONFIGS = [
    {"name": "Weligama", "lat": 5.972, "lng": 80.426},
    {"name": "Arugam Bay", "lat": 6.843, "lng": 81.829},
    {"name": "Hikkaduwa", "lat": 6.1373, "lng": 80.1023},
    {"name": "Midigama", "lat": 5.9695, "lng": 80.3661},
    {"name": "Hiriketiya", "lat": 5.9591, "lng": 80.4035},
    {"name": "Pottuvil Point", "lat": 6.8758, "lng": 81.8344},
    {"name": "Ahangama", "lat": 5.975, "lng": 80.365},
    {"name": "Okanda", "lat": 6.7303, "lng": 81.7955},
]

# Smart Key Allocation: 100 keys distributed by spot importance
# Each key = 10 requests/day, so allocation determines years of data collected
KEY_ALLOCATION = {
    "Weligama": 15,        # 150 requests = 1,500 days = 4.1 years
    "Arugam Bay": 15,      # 150 requests = 1,500 days = 4.1 years
    "Hikkaduwa": 13,       # 130 requests = 1,300 days = 3.6 years
    "Pottuvil Point": 13,  # 130 requests = 1,300 days = 3.6 years
    "Midigama": 11,        # 110 requests = 1,100 days = 3.0 years
    "Hiriketiya": 11,      # 110 requests = 1,100 days = 3.0 years
    "Ahangama": 11,        # 110 requests = 1,100 days = 3.0 years
    "Okanda": 11,          # 110 requests = 1,100 days = 3.0 years
}
# TOTAL: 100 keys perfectly allocated

# Collection control: Set to False to skip a spot
COLLECTION_MODE = {
    "Weligama": True,
    "Arugam Bay": True,
    "Hikkaduwa": True,
    "Midigama": True,
    "Hiriketiya": True,
    "Pottuvil Point": True,
    "Ahangama": True,
    "Okanda": True,
}

# Resume configuration (for interrupted collections)
# Example: "Weligama": {"start_request": 50, "resume_date": "2024-06-15"}
RESUME_CONFIG = {}

# =======================================================================
# --- 100 API KEYS ---
# =======================================================================

API_KEYS = [
    # Keys 1-10
    "878ef1f2-00d0-11f1-9bf2-0242ac120004-878ef256-00d0-11f1-9bf2-0242ac120004",
    "d52e43c0-00dc-11f1-81fb-0242ac120004-d52e4424-00dc-11f1-81fb-0242ac120004",
    "0678dc88-00dd-11f1-b1d9-0242ac120004-0678dcec-00dd-11f1-b1d9-0242ac120004",
    "1caf1c06-00dd-11f1-bbc1-0242ac120004-1caf1cb0-00dd-11f1-bbc1-0242ac120004",
    "4b59c38a-00dd-11f1-b1d9-0242ac120004-4b59c42a-00dd-11f1-b1d9-0242ac120004",
    "67e327b2-00dd-11f1-b1d9-0242ac120004-67e32820-00dd-11f1-b1d9-0242ac120004",
    "b45f102e-00dd-11f1-9bf2-0242ac120004-b45f10ba-00dd-11f1-9bf2-0242ac120004",
    "d9e1e1a0-00dd-11f1-aaab-0242ac120004-d9e1e1fa-00dd-11f1-aaab-0242ac120004",
    "046680d4-00de-11f1-81fb-0242ac120004-0466814c-00de-11f1-81fb-0242ac120004",
    "29fc6f84-00de-11f1-9bf2-0242ac120004-29fc7006-00de-11f1-9bf2-0242ac120004",
    # Keys 11-20
    "66c503ae-00de-11f1-aaab-0242ac120004-66c50426-00de-11f1-aaab-0242ac120004",
    "7e42458c-00de-11f1-9789-0242ac120004-7e424654-00de-11f1-9789-0242ac120004",
    "92a63ab0-00de-11f1-9789-0242ac120004-92a63b78-00de-11f1-9789-0242ac120004",
    "a6bf6756-00de-11f1-b1d9-0242ac120004-a6bf67ba-00de-11f1-b1d9-0242ac120004",
    "f58cfc68-00de-11f1-b1d9-0242ac120004-f58cfcea-00de-11f1-b1d9-0242ac120004",
    "0f2c9f02-00df-11f1-9789-0242ac120004-0f2c9fc0-00df-11f1-9789-0242ac120004",
    "282c836e-00df-11f1-bbc1-0242ac120004-282c83e6-00df-11f1-bbc1-0242ac120004",
    "4f4f7bf4-00df-11f1-b1d9-0242ac120004-4f4f7c94-00df-11f1-b1d9-0242ac120004",
    "6a870108-00df-11f1-aaab-0242ac120004-6a870176-00df-11f1-aaab-0242ac120004",
    "8a9fa378-00df-11f1-81fb-0242ac120004-8a9fa440-00df-11f1-81fb-0242ac120004",
    # Keys 21-30
    "b17d3b68-00df-11f1-b1d9-0242ac120004-b17d3bcc-00df-11f1-b1d9-0242ac120004",
    "c79bebec-00df-11f1-aaab-0242ac120004-c79bec50-00df-11f1-aaab-0242ac120004",
    "df1df292-00df-11f1-81fb-0242ac120004-df1df2ec-00df-11f1-81fb-0242ac120004",
    "f550b752-00df-11f1-b1d9-0242ac120004-f550b7ac-00df-11f1-b1d9-0242ac120004",
    "0b6e2664-00e0-11f1-bbc1-0242ac120004-0b6e26be-00e0-11f1-bbc1-0242ac120004",
    "4043f184-00e0-11f1-9bf2-0242ac120004-4043f21a-00e0-11f1-9bf2-0242ac120004",
    "5e4e0174-00e0-11f1-b1d9-0242ac120004-5e4e01e2-00e0-11f1-b1d9-0242ac120004",
    "74f4b40e-00e0-11f1-aaab-0242ac120004-74f4b486-00e0-11f1-aaab-0242ac120004",
    "905fe31c-00e0-11f1-aaab-0242ac120004-905fe3f8-00e0-11f1-aaab-0242ac120004",
    "a557d89c-00e0-11f1-bbc1-0242ac120004-a557d946-00e0-11f1-bbc1-0242ac120004",
    # Keys 31-40
    "9bafc70e-00e1-11f1-9bf2-0242ac120004-9bafc7c2-00e1-11f1-9bf2-0242ac120004",
    "c2978316-00e1-11f1-bbc1-0242ac120004-c2978370-00e1-11f1-bbc1-0242ac120004",
    "da87a528-00e1-11f1-9bf2-0242ac120004-da87a5e6-00e1-11f1-9bf2-0242ac120004",
    "06b96c94-00e2-11f1-9bf2-0242ac120004-06b96cf8-00e2-11f1-9bf2-0242ac120004",
    "23c925c2-00e2-11f1-b1d9-0242ac120004-23c92662-00e2-11f1-b1d9-0242ac120004",
    "4135769c-00e2-11f1-9bf2-0242ac120004-41357700-00e2-11f1-9bf2-0242ac120004",
    "5af90314-00e2-11f1-81fb-0242ac120004-5af903d2-00e2-11f1-81fb-0242ac120004",
    "814a9dac-00e2-11f1-81fb-0242ac120004-814a9e10-00e2-11f1-81fb-0242ac120004",
    "96db3a3c-00e2-11f1-b1d9-0242ac120004-96db3aa0-00e2-11f1-b1d9-0242ac120004",
    "c632c5a2-00e2-11f1-9bf2-0242ac120004-c632c606-00e2-11f1-9bf2-0242ac120004",
    # Keys 41-50
    "efc1f910-00e2-11f1-aaab-0242ac120004-efc1f9a6-00e2-11f1-aaab-0242ac120004",
    "02201bb4-00e3-11f1-b1d9-0242ac120004-02201c18-00e3-11f1-b1d9-0242ac120004",
    "ec9304e0-00e3-11f1-81fb-0242ac120004-ec930544-00e3-11f1-81fb-0242ac120004",
    "0c391424-00e4-11f1-9bf2-0242ac120004-0c3914d8-00e4-11f1-9bf2-0242ac120004",
    "24205b74-00e4-11f1-aaab-0242ac120004-24205be2-00e4-11f1-aaab-0242ac120004",
    "3b7b5fee-00e4-11f1-81fb-0242ac120004-3b7b6052-00e4-11f1-81fb-0242ac120004",
    "506ec2a6-00e4-11f1-aaab-0242ac120004-506ec314-00e4-11f1-aaab-0242ac120004",
    "6f126dd4-00e4-11f1-bbc1-0242ac120004-6f126e42-00e4-11f1-bbc1-0242ac120004",
    "8aebc6c2-00e4-11f1-81fb-0242ac120004-8aebc76c-00e4-11f1-81fb-0242ac120004",
    "a2f97958-00e4-11f1-aaab-0242ac120004-a2f979b2-00e4-11f1-aaab-0242ac120004",
    # Keys 51-60
    "8207646e-00e7-11f1-bbc1-0242ac120004-820764e6-00e7-11f1-bbc1-0242ac120004",
    "af251c7a-00e7-11f1-b1d9-0242ac120004-af251d2e-00e7-11f1-b1d9-0242ac120004",
    "c7fd14aa-00e7-11f1-b1d9-0242ac120004-c7fd150e-00e7-11f1-b1d9-0242ac120004",
    "dd5d7132-00e7-11f1-b1d9-0242ac120004-dd5d7218-00e7-11f1-b1d9-0242ac120004",
    "f3839d2e-00e7-11f1-bbc1-0242ac120004-f3839e28-00e7-11f1-bbc1-0242ac120004",
    "091d23c6-00e8-11f1-b1d9-0242ac120004-091d247a-00e8-11f1-b1d9-0242ac120004",
    "1f0b7246-00e8-11f1-bbc1-0242ac120004-1f0b72dc-00e8-11f1-bbc1-0242ac120004",
    "37fe90da-00e8-11f1-81fb-0242ac120004-37fe913e-00e8-11f1-81fb-0242ac120004",
    "50fd4cb6-00e8-11f1-9bf2-0242ac120004-50fd4d38-00e8-11f1-9bf2-0242ac120004",
    "64a15c44-00e8-11f1-b1d9-0242ac120004-64a15cbc-00e8-11f1-b1d9-0242ac120004",
    # Keys 61-70
    "0a160072-00ed-11f1-8129-0242ac120004-0a1600e0-00ed-11f1-8129-0242ac120004",
    "25b65aa2-00ed-11f1-8865-0242ac120004-25b65b06-00ed-11f1-8865-0242ac120004",
    "4f945b4e-00ed-11f1-8129-0242ac120004-4f945bbc-00ed-11f1-8129-0242ac120004",
    "653d79c6-00ed-11f1-b866-0242ac120004-653d7a34-00ed-11f1-b866-0242ac120004",
    "76226292-00ed-11f1-8129-0242ac120004-76226300-00ed-11f1-8129-0242ac120004",
    "8d5b7476-00ed-11f1-ac42-0242ac120004-8d5b74ee-00ed-11f1-ac42-0242ac120004",
    "a0ac6e5e-00ed-11f1-ac42-0242ac120004-a0ac6f1c-00ed-11f1-ac42-0242ac120004",
    "b7933378-00ed-11f1-8865-0242ac120004-b793342c-00ed-11f1-8865-0242ac120004",
    "cf80185c-00ed-11f1-ae7c-0242ac120004-cf801906-00ed-11f1-ae7c-0242ac120004",
    "e5d9aa64-00ed-11f1-8865-0242ac120004-e5d9aac8-00ed-11f1-8865-0242ac120004",
    # Keys 71-80
    "0c7e17fe-00ee-11f1-ae7c-0242ac120004-0c7e186c-00ee-11f1-ae7c-0242ac120004",
    "2d558a7a-00ee-11f1-b866-0242ac120004-2d558b10-00ee-11f1-b866-0242ac120004",
    "443fa892-00ee-11f1-8129-0242ac120004-443fa946-00ee-11f1-8129-0242ac120004",
    "5c921394-00ee-11f1-b82f-0242ac120004-5c921402-00ee-11f1-b82f-0242ac120004",
    "6e831dfa-00ee-11f1-b866-0242ac120004-6e831e5e-00ee-11f1-b866-0242ac120004",
    "845a5b70-00ee-11f1-b82f-0242ac120004-845a5c1a-00ee-11f1-b82f-0242ac120004",
    "a017c122-00ee-11f1-ae7c-0242ac120004-a017c190-00ee-11f1-ae7c-0242ac120004",
    "b123008a-00ee-11f1-ac42-0242ac120004-b12300f8-00ee-11f1-ac42-0242ac120004",
    "c77cc9ce-00ee-11f1-8865-0242ac120004-c77cca50-00ee-11f1-8865-0242ac120004",
    "ddaf502c-00ee-11f1-b866-0242ac120004-ddaf5090-00ee-11f1-b866-0242ac120004",
    # Keys 81-90
    "fb6a0288-00ee-11f1-8129-0242ac120004-fb6a02ec-00ee-11f1-8129-0242ac120004",
    "24c61764-c5cd-11f0-a8f4-0242ac130003-24c617f0-c5cd-11f0-a8f4-0242ac130003",
    "5c476b8e-c5cd-11f0-b5c3-0242ac130003-5c476c1a-c5cd-11f0-b5c3-0242ac130003",
    "7d79cf90-c5cd-11f0-b5c3-0242ac130003-7d79d328-c5cd-11f0-b5c3-0242ac130003",
    "9dc164de-c5cd-11f0-b5c3-0242ac130003-9dc16542-c5cd-11f0-b5c3-0242ac130003",
    "ee8d38a2-c5cd-11f0-a0d3-0242ac130003-ee8d391a-c5cd-11f0-a0d3-0242ac130003",
    "20a872ca-c5ce-11f0-a8f4-0242ac130003-20a87356-c5ce-11f0-a8f4-0242ac130003",
    "57df12bc-c5ce-11f0-b4de-0242ac130003-57df1334-c5ce-11f0-b4de-0242ac130003",
    "7b33f174-c5ce-11f0-a0d3-0242ac130003-7b33f200-c5ce-11f0-a0d3-0242ac130003",
    "964936d6-c5ce-11f0-a148-0242ac130003-9649376c-c5ce-11f0-a148-0242ac130003",
    # Keys 91-100
    "2b9c359a-a5a8-11f0-8208-0242ac130006-2b9c3630-a5a8-11f0-8208-0242ac130006",
    "af1036a4-a5be-11f0-8208-0242ac130006-af10371c-a5be-11f0-8208-0242ac130006",
    "a3cc1756-a5c1-11f0-b808-0242ac130006-a3cc17ba-a5c1-11f0-b808-0242ac130006",
    "2c822782-a5c4-11f0-9727-0242ac130006-2c8227e6-a5c4-11f0-9727-0242ac130006",
    "68a5ab3a-a66e-11f0-a2a5-0242ac130006-68a5ac02-a66e-11f0-a2a5-0242ac130006",
    "943fd418-a679-11f0-a2a5-0242ac130006-943fd490-a679-11f0-a2a5-0242ac130006",
    "bb8f7ae8-c5cb-11f0-a8f4-0242ac130003-bb8f7b42-c5cb-11f0-a8f4-0242ac130003",
    "204f4594-c5cc-11f0-b4de-0242ac130003-204f463e-c5cc-11f0-b4de-0242ac130003",
    "3fd3b6ca-c5cc-11f0-b4de-0242ac130003-3fd3b72e-c5cc-11f0-b4de-0242ac130003",
    "fe940b6e-c5cc-11f0-bd1c-0242ac130003-fe940bfa-c5cc-11f0-bd1c-0242ac130003"
]

print(f"✅ Loaded {len(API_KEYS)} API keys")
if len(API_KEYS) != 100:
    print(f"⚠️  WARNING: Expected 100 keys, found {len(API_KEYS)}")
    sys.exit(1)

# FINAL DEFINITIVE PARAMETER LIST (Copied from the API's successful list)
ALL_PARAMETERS = [
    # Core Atmospheric/Temperature
    "airTemperature", "cloudCover", "dewPointTemperature", "humidity",
    "pressure", "visibility",

    # Specialized Atmospheric Levels
    "airTemperature1000hpa", "airTemperature100m", "airTemperature200hpa",
    "airTemperature500hpa", "airTemperature800hpa", "airTemperature80m",

    # Core Wind/Gust
    "gust", "windSpeed", "windDirection",

    # Specialized Wind Levels
    "windDirection1000hpa", "windDirection100m", "windDirection200hpa", "windDirection20m",
    "windDirection30m", "windDirection40m", "windDirection500hpa", "windDirection50m",
    "windDirection800hpa", "windDirection80m",
    "windSpeed1000hpa", "windSpeed100m", "windSpeed200hpa", "windSpeed20m",
    "windSpeed30m", "windSpeed40m", "windSpeed500hpa", "windSpeed50m",
    "windSpeed800hpa", "windSpeed80m",

    # Marine/Wave/Swell
    "currentDirection", "currentSpeed",
    "seaLevel", "waterTemperature",
    "waveDirection", "waveHeight", "wavePeriod",
    "swellDirection", "swellHeight", "swellPeriod",
    "secondarySwellDirection", "secondarySwellHeight", "secondarySwellPeriod",
    "windWaveDirection", "windWaveHeight", "windWavePeriod",

    # Other Phenomena
    "graupel", "precipitation", "rain", "snow",
    "snowAlbedo", "snowDepth", "iceCover", "seaIceThickness"
]


# --- Helper Function to Fetch Data for a Single Spot ---

def fetch_data_for_spot(spot_name, lat, lng, api_keys_subset, start_request_num=1, resume_end_date_str=None):
    """Fetches historical data for a single spot using allocated API keys."""

    # Skip if disabled in COLLECTION_MODE
    if not COLLECTION_MODE.get(spot_name, True):
        print(f"\n⏭️  SKIPPING: {spot_name} (disabled in COLLECTION_MODE)")
        return {"spot_name": spot_name, "hours": [], "requests_used": 0, "total_hours": 0, "lat": lat, "lng": lng}

    base_url = 'https://api.stormglass.io/v2/weather/point'

    # Determine the starting date
    if resume_end_date_str:
        end_date = datetime.strptime(
            resume_end_date_str, '%Y-%m-%d').replace(tzinfo=timezone.utc)
        print(f"  📍 Resuming from: {end_date.date()}")
    else:
        end_date = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0)

    spot_hours_data = []
    spot_requests_made = 0
    max_requests_for_spot = len(api_keys_subset) * 10

    print(f"\n{'='*70}")
    print(f"🌊 COLLECTING: {spot_name}")
    print(f"{'='*70}")
    print(f"  Keys allocated: {len(api_keys_subset)}")
    print(
        f"  Max requests: {max_requests_for_spot} (= {max_requests_for_spot * 10} days = {max_requests_for_spot * 10 / 365:.1f} years)")
    print(f"  Starting from: {end_date.date()}")

    for request_index in range(start_request_num - 1, max_requests_for_spot):

        key_index_in_subset = request_index // 10

        if key_index_in_subset >= len(api_keys_subset):
            print(
                f"  ✅ COMPLETED: Used all {len(api_keys_subset)} allocated keys")
            break

        current_key = api_keys_subset[key_index_in_subset]

        # Calculate 10-day window backwards
        start_date = end_date - timedelta(days=10)
        start_ts = int(start_date.timestamp())
        end_ts = int(end_date.timestamp())

        params = {
            'lat': lat,
            'lng': lng,
            'params': ",".join(ALL_PARAMETERS),
            'start': start_ts,
            'end': end_ts,
            'source': 'noaa,sg,meteo'
        }

        headers = {'Authorization': current_key}

        # Progress indicator
        progress = (request_index + 1) / max_requests_for_spot * 100
        print(f"  [{progress:5.1f}%] Request {request_index + 1}/{max_requests_for_spot} | Key {key_index_in_subset + 1}/{len(api_keys_subset)} | {start_date.date()} → {end_date.date()}", end="")

        # --- API Request with Exponential Backoff ---
        retries = 0
        max_retries = 3
        success = False
        response = None

        while retries < max_retries:
            try:
                response = requests.get(
                    base_url, params=params, headers=headers, timeout=15)

                if response.status_code == 429:
                    print(" ⏭️  Rate limit (moving to next key)")
                    break

                response.raise_for_status()
                data = response.json()

                if 'hours' in data and data['hours']:
                    # Prepend (oldest first)
                    spot_hours_data = data['hours'] + spot_hours_data
                    spot_requests_made += 1
                    end_date = start_date

                    print(
                        f" ✅ {len(data['hours'])} hours (total: {len(spot_hours_data):,})")
                    success = True
                    break
                else:
                    print(" ⚠️  No data returned")
                    break

            except requests.exceptions.HTTPError as e:
                if response and response.status_code == 422:
                    error_details = response.json().get('errors', 'No details')
                    print(
                        f"\n  ❌ CRITICAL ERROR (422): Parameters rejected. {error_details}")
                    sys.exit(1)
                elif response and response.status_code == 429:
                    break
                else:
                    retries += 1
                    wait_time = 2 ** retries
                    print(
                        f" ⏰ Error {e} (retry {retries}/{max_retries} in {wait_time}s)")
                    time.sleep(wait_time)

            except requests.exceptions.Timeout:
                retries += 1
                wait_time = 2 ** retries
                print(
                    f" ⏰ Timeout (retry {retries}/{max_retries} in {wait_time}s)")
                time.sleep(wait_time)

            except requests.exceptions.RequestException as e:
                retries += 1
                wait_time = 2 ** retries
                print(
                    f" ❌ Connection error: {e} (retry {retries}/{max_retries})")
                time.sleep(wait_time)

        if not success and retries >= max_retries:
            print(
                f"\n  ❌ Failed after {max_retries} retries. Stopping {spot_name} collection.")
            break

        # Small delay to be nice to API
        time.sleep(0.5)

    print(f"\n  📊 {spot_name} Summary:")
    print(f"     Requests used: {spot_requests_made}/{max_requests_for_spot}")
    print(f"     Hours collected: {len(spot_hours_data):,}")
    print(f"     Days collected: {len(spot_hours_data) / 24:.1f}")
    print(f"     Years collected: {len(spot_hours_data) / 24 / 365:.2f}")

    # Return the collected data up to the point of failure
    return {
        "spot_name": spot_name,
        "hours": spot_hours_data,
        "requests_used": spot_requests_made,
        "total_hours": len(spot_hours_data),
        "lat": lat,
        "lng": lng,
    }


# --- Main Execution Logic ---

def collect_historical_data():
    """Main collection orchestrator for all 8 surf spots."""

    print("\n" + "="*70)
    print("🌊 SURF CEYLON - MULTI-LOCATION DATA COLLECTION")
    print("="*70)
    print(f"Total API keys: {len(API_KEYS)}")
    print(f"Total spots configured: {len(SPOT_CONFIGS)}")
    print(
        f"Estimated data per run: ~{sum(KEY_ALLOCATION.values()) * 10 / 365:.1f} years total")
    print("="*70)

    # Verify key allocation
    total_allocated = sum(KEY_ALLOCATION.values())
    if total_allocated != len(API_KEYS):
        print(
            f"⚠️  WARNING: KEY_ALLOCATION totals {total_allocated}, but have {len(API_KEYS)} keys")
        print(f"   Adjusting allocation...")

    # Distribute keys to spots
    key_start_index = 0
    all_results = []

    for spot_config in SPOT_CONFIGS:
        spot_name = spot_config['name']
        num_keys = KEY_ALLOCATION.get(spot_name, 10)

        # Slice keys for this spot
        spot_keys = API_KEYS[key_start_index:key_start_index + num_keys]
        key_start_index += num_keys

        if len(spot_keys) < num_keys:
            print(f"\n⚠️  WARNING: Not enough keys for {spot_name}")
            print(f"   Requested {num_keys}, only {len(spot_keys)} available")

        # Check for resume configuration
        resume_config = RESUME_CONFIG.get(spot_name, {})
        start_request = resume_config.get('start_request', 1)
        resume_date = resume_config.get('resume_date', None)

        # Fetch data for this spot
        result = fetch_data_for_spot(
            spot_name=spot_name,
            lat=spot_config['lat'],
            lng=spot_config['lng'],
            api_keys_subset=spot_keys,
            start_request_num=start_request,
            resume_end_date_str=resume_date
        )

        all_results.append(result)

    # --- Save all results ---
    print(f"\n{'='*70}")
    print("💾 SAVING DATA FILES")
    print('='*70)

    # Ensure data directory exists
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(data_dir, exist_ok=True)

    for result in all_results:
        output_filename = os.path.join(
            data_dir, f"{result['spot_name'].lower().replace(' ', '_')}_historical_data_fixed.json")

        # Load existing data if current collection was skipped
        if not result['hours']:
            try:
                with open(output_filename, 'r') as f:
                    existing_data = json.load(f)
                    result['hours'] = existing_data.get('hours', [])
                    result['total_hours'] = len(result['hours'])
                print(
                    f"  📂 {result['spot_name']:20s}: Preserved existing data ({result['total_hours']:,} hours)")
                continue
            except FileNotFoundError:
                print(
                    f"  ⚠️  {result['spot_name']:20s}: No data collected and no existing file")
                continue
            except json.JSONDecodeError:
                print(
                    f"  ⚠️  {result['spot_name']:20s}: Could not decode existing file")
                continue

        # Sort by timestamp and get date range
        if result['hours']:
            result['hours'].sort(key=lambda x: x['time'])
            earliest = result['hours'][0]['time']
            latest = result['hours'][-1]['time']
        else:
            earliest = None
            latest = None

        # Create output JSON with metadata
        output_json = {
            "metadata": {
                "spot": result['spot_name'],
                "latitude": result['lat'],
                "longitude": result['lng'],
                "requests_used": result['requests_used'],
                "total_hours": result['total_hours'],
                "total_days": result['total_hours'] / 24 if result['total_hours'] else 0,
                "total_years": result['total_hours'] / 24 / 365 if result['total_hours'] else 0,
                "date_collected": datetime.now(timezone.utc).isoformat(),
                "earliest_data_point": earliest,
                "latest_data_point": latest,
                "keys_allocated": KEY_ALLOCATION.get(result['spot_name'], 0)
            },
            "hours": result['hours']
        }

        # Save to file
        with open(output_filename, 'w') as f:
            json.dump(output_json, f, indent=2)

        file_size = os.path.getsize(output_filename) / (1024 * 1024)  # MB
        print(
            f"  ✅ {result['spot_name']:20s} → {output_filename:50s} ({file_size:.1f} MB)")

    # --- Final Summary ---
    print(f"\n{'='*70}")
    print("✅ COLLECTION COMPLETE!")
    print('='*70)

    total_hours = sum(r['total_hours'] for r in all_results)
    total_requests = sum(r['requests_used'] for r in all_results)
    total_possible_requests = len(API_KEYS) * 10

    print(f"Total hours collected: {total_hours:,}")
    print(f"Total days collected: {total_hours / 24:,.1f}")
    print(f"Total years collected: {total_hours / 24 / 365:.2f}")
    print(f"Total requests used: {total_requests}/{total_possible_requests}")
    print(
        f"Keys efficiency: {total_requests / total_possible_requests * 100:.1f}%")

    print(f"\n📋 Breakdown by location:")
    for r in all_results:
        if r['total_hours'] > 0:
            print(
                f"  {r['spot_name']:20s}: {r['total_hours']:>7,} hours ({r['total_hours']/24/365:>4.1f} years)")

    print(f"\n🎯 Next steps:")
    print(f"  1. Verify all JSON files in surfapp--ml-engine/data/")
    print(f"  2. Run: python training/prepare_timeseries_data.py")
    print(f"  3. Run: python training/train_random_forest_model.py")
    print(f"  4. Run: python training/train_wave_forecast_lstm.py")


if __name__ == "__main__":
    collect_historical_data()
