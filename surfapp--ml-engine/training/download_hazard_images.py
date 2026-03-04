"""
Hazard Image Downloader for Surf Ceylon ML Engine
=================================================
This script downloads images from various free sources to build a training dataset
for the surf hazard classification model.

IMPORTANT: 
- This uses web scraping and free image APIs
- Respect rate limits and terms of service
- Manual curation is recommended after download
- Delete any irrelevant/low-quality images

Usage:
    python download_hazard_images.py --category shark --count 150
    python download_hazard_images.py --all --count 100
"""

import os
import sys
import time
import argparse
import hashlib
import requests
from pathlib import Path
from urllib.parse import quote_plus
from concurrent.futures import ThreadPoolExecutor, as_completed

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configuration
BASE_DIR = Path(__file__).parent.parent / "data" / "hazard_images"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

# Hazard categories with search terms for better results
HAZARD_CATEGORIES = {
    'shark': [
        'shark in ocean',
        'shark fin water surface',
        'great white shark swimming',
        'shark near beach',
        'shark underwater ocean'
    ],
    'jellyfish': [
        'jellyfish ocean',
        'jellyfish bloom beach',
        'jellyfish underwater',
        'box jellyfish water',
        'jellyfish swarm sea'
    ],
    'rip_current': [
        'rip current beach',
        'rip current aerial view',
        'dangerous rip current ocean',
        'rip tide beach warning',
        'rip current water pattern'
    ],
    'sea_urchin': [
        'sea urchin reef',
        'sea urchin underwater',
        'black sea urchin rocks',
        'sea urchin spines close up',
        'sea urchin coral reef'
    ],
    'large_waves': [
        'large dangerous waves',
        'big wave surfing hazard',
        'storm surge ocean waves',
        'tsunami wave approaching',
        'high surf warning waves'
    ],
    'reef_coral': [
        'sharp coral reef danger',
        'exposed reef low tide',
        'coral reef shallow water',
        'reef cuts hazard surfing',
        'dangerous coral outcrop'
    ],
    'no_hazard': [
        'calm beach ocean',
        'safe surfing conditions',
        'peaceful ocean beach',
        'beautiful beach scenery',
        'calm sea water'
    ]
}


def get_image_hash(image_data):
    """Generate hash to avoid duplicate images."""
    return hashlib.md5(image_data).hexdigest()


def download_image(url, save_path, existing_hashes):
    """Download a single image if it's not a duplicate."""
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if 'image' in content_type:
                img_hash = get_image_hash(response.content)
                if img_hash not in existing_hashes:
                    with open(save_path, 'wb') as f:
                        f.write(response.content)
                    return True, img_hash
        return False, None
    except Exception as e:
        return False, None


def search_unsplash(query, count=30):
    """
    Search Unsplash for free images.
    Note: For production, get an API key from https://unsplash.com/developers
    """
    # Using Unsplash Source (random images based on query)
    urls = []
    base_url = "https://source.unsplash.com/800x600/?"
    
    for i in range(count):
        # Add random parameter to get different images
        url = f"{base_url}{quote_plus(query)}&sig={i}"
        urls.append(url)
    
    return urls


def search_pexels_free(query, count=30):
    """
    Get image URLs from Pexels (free stock photos).
    For better results, get an API key from https://www.pexels.com/api/
    """
    urls = []
    # Pexels provides free images - using their CDN pattern
    search_url = f"https://images.pexels.com/photos/search?query={quote_plus(query)}&per_page={count}"
    
    try:
        # Note: This is a simplified approach
        # For production, use the official Pexels API
        pass
    except:
        pass
    
    return urls


def search_pixabay(query, count=30, api_key=None):
    """
    Search Pixabay for free images.
    Get free API key from: https://pixabay.com/api/docs/
    """
    urls = []
    
    if api_key:
        try:
            url = f"https://pixabay.com/api/?key={api_key}&q={quote_plus(query)}&image_type=photo&per_page={min(count, 200)}"
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                for hit in data.get('hits', []):
                    urls.append(hit.get('webformatURL'))
        except Exception as e:
            print(f"Pixabay error: {e}")
    
    return urls


def download_from_bing(query, count=50, save_dir=None):
    """
    Download images using Bing Image Search (scraping approach).
    For production, consider using Azure Bing Image Search API.
    """
    urls = []
    
    try:
        search_url = f"https://www.bing.com/images/search?q={quote_plus(query)}&first=0&count={count}"
        response = requests.get(search_url, headers=HEADERS, timeout=10)
        
        if response.status_code == 200:
            # Simple regex to find image URLs (basic approach)
            import re
            # Find murl (media URL) parameters
            pattern = r'murl&quot;:&quot;(https?://[^&]+?)&quot;'
            matches = re.findall(pattern, response.text)
            urls = list(set(matches))[:count]
    except Exception as e:
        print(f"Bing search error: {e}")
    
    return urls


def download_category_images(category, target_count=100, api_keys=None):
    """Download images for a specific hazard category."""
    
    if category not in HAZARD_CATEGORIES:
        print(f"❌ Unknown category: {category}")
        return 0
    
    save_dir = BASE_DIR / category
    save_dir.mkdir(parents=True, exist_ok=True)
    
    # Get existing image hashes to avoid duplicates
    existing_hashes = set()
    existing_files = list(save_dir.glob("*.jpg")) + list(save_dir.glob("*.png"))
    
    print(f"\n📂 Category: {category}")
    print(f"   Existing images: {len(existing_files)}")
    
    # Load existing hashes
    for f in existing_files:
        try:
            with open(f, 'rb') as img:
                existing_hashes.add(get_image_hash(img.read()))
        except:
            pass
    
    search_terms = HAZARD_CATEGORIES[category]
    all_urls = []
    
    # Collect URLs from multiple sources
    print(f"   🔍 Searching for images...")
    
    for term in search_terms:
        # Unsplash
        all_urls.extend(search_unsplash(term, count=target_count // len(search_terms)))
        
        # Bing (as fallback)
        all_urls.extend(download_from_bing(term, count=target_count // len(search_terms)))
        
        # Pixabay (if API key provided)
        if api_keys and api_keys.get('pixabay'):
            all_urls.extend(search_pixabay(term, count=20, api_key=api_keys['pixabay']))
        
        time.sleep(0.5)  # Rate limiting
    
    # Remove duplicates
    all_urls = list(set(all_urls))
    print(f"   📥 Found {len(all_urls)} unique URLs")
    
    # Download images
    downloaded = 0
    img_index = len(existing_files) + 1
    
    for url in all_urls:
        if downloaded >= target_count:
            break
        
        save_path = save_dir / f"{category}_{img_index:04d}.jpg"
        success, img_hash = download_image(url, save_path, existing_hashes)
        
        if success:
            existing_hashes.add(img_hash)
            downloaded += 1
            img_index += 1
            
            if downloaded % 10 == 0:
                print(f"   ✅ Downloaded {downloaded}/{target_count}")
        
        time.sleep(0.3)  # Rate limiting
    
    print(f"   ✅ Downloaded {downloaded} new images for '{category}'")
    return downloaded


def print_dataset_summary():
    """Print summary of current dataset."""
    print("\n" + "="*60)
    print("📊 HAZARD IMAGE DATASET SUMMARY")
    print("="*60)
    
    total = 0
    for category in HAZARD_CATEGORIES.keys():
        cat_dir = BASE_DIR / category
        if cat_dir.exists():
            count = len(list(cat_dir.glob("*.jpg"))) + len(list(cat_dir.glob("*.png")))
            status = "✅" if count >= 100 else "⚠️" if count >= 50 else "❌"
            print(f"  {status} {category:15s}: {count:4d} images")
            total += count
        else:
            print(f"  ❌ {category:15s}: 0 images (folder missing)")
    
    print("-"*60)
    print(f"  📦 TOTAL: {total} images")
    print("="*60)
    
    if total < 500:
        print("\n⚠️  WARNING: You need at least 500-700 images total for good model training.")
        print("   Aim for 100+ images per category.")
    elif total < 700:
        print("\n⚠️  Dataset is acceptable but more images would improve accuracy.")
    else:
        print("\n✅ Dataset size looks good for training!")


def main():
    parser = argparse.ArgumentParser(description='Download hazard images for ML training')
    parser.add_argument('--category', type=str, help='Specific category to download')
    parser.add_argument('--all', action='store_true', help='Download all categories')
    parser.add_argument('--count', type=int, default=100, help='Target images per category')
    parser.add_argument('--pixabay-key', type=str, help='Pixabay API key (optional, for better results)')
    parser.add_argument('--summary', action='store_true', help='Show dataset summary only')
    
    args = parser.parse_args()
    
    # Ensure base directory exists
    BASE_DIR.mkdir(parents=True, exist_ok=True)
    
    if args.summary:
        print_dataset_summary()
        return
    
    api_keys = {}
    if args.pixabay_key:
        api_keys['pixabay'] = args.pixabay_key
    
    print("🏄 Surf Ceylon - Hazard Image Downloader")
    print("="*50)
    
    if args.all:
        for category in HAZARD_CATEGORIES.keys():
            download_category_images(category, args.count, api_keys)
    elif args.category:
        download_category_images(args.category, args.count, api_keys)
    else:
        print("Please specify --category <name> or --all")
        print(f"Available categories: {', '.join(HAZARD_CATEGORIES.keys())}")
        return
    
    print_dataset_summary()
    
    print("\n📝 NEXT STEPS:")
    print("   1. Review downloaded images and delete irrelevant ones")
    print("   2. Manually add more images from Google/other sources if needed")
    print("   3. Run: python train_hazard_classifier.py")


if __name__ == "__main__":
    main()
