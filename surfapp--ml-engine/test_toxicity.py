#!/usr/bin/env python
"""
Test script to verify the toxicity checker is working properly
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from check_toxicity_cli import check_toxicity

def test_toxicity_checker():
    """Run basic tests on the toxicity checker"""
    print("Testing Toxicity Checker...")
    print("-" * 50)
    
    test_cases = [
        ("This is a nice comment", False),
        ("You are amazing!", False),
        ("Great work on this project", False),
        ("I hate you", True),
        ("This is stupid and terrible", True),
    ]
    
    passed = 0
    failed = 0
    
    for text, expected_toxic in test_cases:
        result = check_toxicity(text)
        
        if result['success']:
            is_toxic = result['is_toxic']
            confidence = result['confidence']
            status = "✓" if is_toxic == expected_toxic else "✗"
            
            print(f"{status} Text: '{text}'")
            print(f"  Expected: {'Toxic' if expected_toxic else 'Safe'}")
            print(f"  Got: {'Toxic' if is_toxic else 'Safe'} (confidence: {confidence:.2f})")
            
            if is_toxic == expected_toxic:
                passed += 1
            else:
                failed += 1
        else:
            print(f"✗ Error checking: '{text}'")
            print(f"  Error: {result.get('error', 'Unknown')}")
            failed += 1
        
        print()
    
    print("-" * 50)
    print(f"Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("✓ All tests passed!")
        return 0
    else:
        print("✗ Some tests failed")
        return 1

if __name__ == '__main__':
    sys.exit(test_toxicity_checker())
