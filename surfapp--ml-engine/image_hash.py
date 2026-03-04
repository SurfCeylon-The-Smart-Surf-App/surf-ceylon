"""
Image Hash Utility for Duplicate Detection
Uses perceptual hashing (pHash) to detect duplicate/similar images
"""

import sys
import json
import cv2
import numpy as np
from pathlib import Path


def compute_phash(image_path: str, hash_size: int = 16) -> str:
    """
    Compute perceptual hash (pHash) of an image.
    pHash is robust to minor changes like resizing, compression, color adjustments.
    
    Args:
        image_path: Path to the image file
        hash_size: Size of the hash (default 16 = 256 bit hash)
    
    Returns:
        Hexadecimal string representation of the hash
    """
    try:
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            return None
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Resize to hash_size + 1 (we need one extra row/column for DCT)
        resized = cv2.resize(gray, (hash_size + 1, hash_size + 1), interpolation=cv2.INTER_AREA)
        
        # Compute DCT (Discrete Cosine Transform)
        dct = cv2.dct(np.float32(resized))
        
        # Keep only top-left hash_size x hash_size (low frequency components)
        dct_low = dct[:hash_size, :hash_size]
        
        # Compute median (excluding the DC component)
        dct_low_flat = dct_low.flatten()
        median = np.median(dct_low_flat[1:])  # Skip DC component
        
        # Create binary hash based on median
        binary_hash = (dct_low_flat > median).astype(int)
        
        # Convert to hexadecimal string
        hash_int = int(''.join(map(str, binary_hash)), 2)
        hex_hash = format(hash_int, f'0{hash_size * hash_size // 4}x')
        
        return hex_hash
        
    except Exception as e:
        print(f"Error computing hash: {e}", file=sys.stderr)
        return None


def compute_dhash(image_path: str, hash_size: int = 8) -> str:
    """
    Compute difference hash (dHash) of an image.
    dHash is simpler and faster than pHash, good for exact duplicate detection.
    
    Args:
        image_path: Path to the image file
        hash_size: Size of the hash (default 8 = 64 bit hash)
    
    Returns:
        Hexadecimal string representation of the hash
    """
    try:
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            return None
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Resize to (hash_size + 1, hash_size)
        resized = cv2.resize(gray, (hash_size + 1, hash_size), interpolation=cv2.INTER_AREA)
        
        # Compute difference (compare adjacent pixels)
        diff = resized[:, 1:] > resized[:, :-1]
        
        # Convert to hexadecimal string
        hash_int = sum([2 ** i for i, v in enumerate(diff.flatten()) if v])
        hex_hash = format(hash_int, f'0{hash_size * hash_size // 4}x')
        
        return hex_hash
        
    except Exception as e:
        print(f"Error computing dhash: {e}", file=sys.stderr)
        return None


def compute_combined_hash(image_path: str) -> str:
    """
    Compute a combined hash using both pHash and dHash for more robust detection.
    
    Returns:
        Combined hash string (phash:dhash format)
    """
    phash = compute_phash(image_path, hash_size=8)  # 64-bit pHash
    dhash = compute_dhash(image_path, hash_size=8)  # 64-bit dHash
    
    if phash and dhash:
        return f"{phash}:{dhash}"
    elif phash:
        return phash
    elif dhash:
        return dhash
    return None


def hamming_distance(hash1: str, hash2: str) -> int:
    """
    Compute Hamming distance between two hashes.
    Lower distance = more similar images.
    
    Args:
        hash1: First hash string
        hash2: Second hash string
    
    Returns:
        Number of differing bits (0 = identical)
    """
    if not hash1 or not hash2:
        return float('inf')
    
    # Handle combined hashes
    if ':' in hash1 and ':' in hash2:
        p1, d1 = hash1.split(':')
        p2, d2 = hash2.split(':')
        return hamming_distance(p1, p2) + hamming_distance(d1, d2)
    
    # Convert hex to binary and compare
    try:
        int1 = int(hash1, 16)
        int2 = int(hash2, 16)
        xor = int1 ^ int2
        return bin(xor).count('1')
    except ValueError:
        return float('inf')


def get_image_hash(image_path: str) -> dict:
    """
    Main function to compute image hash for duplicate detection.
    
    Returns:
        Dictionary with hash and success status
    """
    path = Path(image_path)
    
    if not path.exists():
        return {
            "success": False,
            "error": f"Image file not found: {image_path}"
        }
    
    hash_value = compute_combined_hash(image_path)
    
    if hash_value:
        return {
            "success": True,
            "hash": hash_value
        }
    else:
        return {
            "success": False,
            "error": "Failed to compute image hash"
        }


# CLI interface for Node.js integration
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No image path provided"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    result = get_image_hash(image_path)
    print(json.dumps(result))
