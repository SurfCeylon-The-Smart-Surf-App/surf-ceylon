"""
Performance Benchmarking Module
===============================
Benchmark tests for ML model performance and API response times.

Usage:
    python benchmark.py
"""

import time
import statistics
import numpy as np
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def benchmark_risk_prediction(iterations=100):
    """
    Benchmark risk prediction performance.
    
    Args:
        iterations: Number of predictions to run
    
    Returns:
        dict: Benchmark results
    """
    import joblib
    
    print(f"🏃 Benchmarking risk prediction ({iterations} iterations)...")
    
    models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
    
    try:
        rf_model = joblib.load(os.path.join(models_dir, 'risk_classifier.pkl'))
        feature_cols = joblib.load(os.path.join(models_dir, 'feature_cols.pkl'))
    except FileNotFoundError:
        print("❌ Models not found. Run training first.")
        return None
    
    # Generate random test data
    np.random.seed(42)
    test_features = np.random.rand(iterations, len(feature_cols)) * 10
    
    # Warm up
    rf_model.predict(test_features[:10])
    
    # Benchmark predictions
    times = []
    for i in range(iterations):
        start = time.perf_counter()
        rf_model.predict(test_features[i:i+1])
        end = time.perf_counter()
        times.append((end - start) * 1000)  # Convert to ms
    
    results = {
        'iterations': iterations,
        'mean_ms': statistics.mean(times),
        'median_ms': statistics.median(times),
        'std_ms': statistics.stdev(times),
        'min_ms': min(times),
        'max_ms': max(times),
        'p95_ms': np.percentile(times, 95),
        'p99_ms': np.percentile(times, 99)
    }
    
    print(f"   Mean:   {results['mean_ms']:.3f} ms")
    print(f"   Median: {results['median_ms']:.3f} ms")
    print(f"   P95:    {results['p95_ms']:.3f} ms")
    print(f"   P99:    {results['p99_ms']:.3f} ms")
    
    return results


def benchmark_batch_prediction(batch_sizes=[1, 10, 50, 100]):
    """
    Benchmark batch prediction performance.
    
    Args:
        batch_sizes: List of batch sizes to test
    
    Returns:
        dict: Results for each batch size
    """
    import joblib
    
    print("\n🏃 Benchmarking batch predictions...")
    
    models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
    
    try:
        rf_model = joblib.load(os.path.join(models_dir, 'risk_classifier.pkl'))
        feature_cols = joblib.load(os.path.join(models_dir, 'feature_cols.pkl'))
    except FileNotFoundError:
        print("❌ Models not found.")
        return None
    
    results = {}
    
    for batch_size in batch_sizes:
        np.random.seed(42)
        test_features = np.random.rand(batch_size, len(feature_cols)) * 10
        
        # Warm up
        rf_model.predict(test_features[:min(10, batch_size)])
        
        # Benchmark
        times = []
        for _ in range(20):  # 20 runs per batch size
            start = time.perf_counter()
            rf_model.predict(test_features)
            end = time.perf_counter()
            times.append((end - start) * 1000)
        
        results[batch_size] = {
            'mean_ms': statistics.mean(times),
            'per_item_ms': statistics.mean(times) / batch_size
        }
        
        print(f"   Batch {batch_size}: {results[batch_size]['mean_ms']:.3f} ms total, {results[batch_size]['per_item_ms']:.3f} ms/item")
    
    return results


def benchmark_hazard_analysis(iterations=10):
    """
    Benchmark hazard image analysis performance.
    
    Args:
        iterations: Number of analyses to run
    
    Returns:
        dict: Benchmark results
    """
    print(f"\n🏃 Benchmarking hazard analysis ({iterations} iterations)...")
    
    from analyze_hazard import analyze_hazard_image
    
    # Create a dummy test image
    test_image_path = os.path.join(os.path.dirname(__file__), 'test_image.jpg')
    
    # Check if test image exists, if not create a simple one
    if not os.path.exists(test_image_path):
        try:
            import cv2
            # Create a simple test image
            img = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
            cv2.imwrite(test_image_path, img)
            created_image = True
        except ImportError:
            print("   ⚠️ OpenCV not available, using fake path")
            created_image = False
    else:
        created_image = False
    
    times = []
    for _ in range(iterations):
        start = time.perf_counter()
        analyze_hazard_image(test_image_path, 'Rip Current')
        end = time.perf_counter()
        times.append((end - start) * 1000)
    
    # Clean up
    if created_image and os.path.exists(test_image_path):
        os.remove(test_image_path)
    
    results = {
        'iterations': iterations,
        'mean_ms': statistics.mean(times),
        'median_ms': statistics.median(times),
        'min_ms': min(times),
        'max_ms': max(times)
    }
    
    print(f"   Mean:   {results['mean_ms']:.3f} ms")
    print(f"   Median: {results['median_ms']:.3f} ms")
    
    return results


def benchmark_api_response_time():
    """
    Benchmark API endpoint response times.
    
    Returns:
        dict: Response times for each endpoint
    """
    print("\n🏃 Benchmarking API response times...")
    
    try:
        from app import app
        client = app.test_client()
    except ImportError:
        print("   ❌ Flask app not available")
        return None
    
    endpoints = [
        ('GET', '/health'),
        ('GET', '/predict-risk/Hikkaduwa'),
    ]
    
    results = {}
    
    for method, endpoint in endpoints:
        times = []
        
        for _ in range(20):
            start = time.perf_counter()
            if method == 'GET':
                client.get(endpoint)
            elif method == 'POST':
                client.post(endpoint)
            end = time.perf_counter()
            times.append((end - start) * 1000)
        
        results[endpoint] = {
            'mean_ms': statistics.mean(times),
            'p95_ms': np.percentile(times, 95)
        }
        
        print(f"   {method} {endpoint}: {results[endpoint]['mean_ms']:.3f} ms (p95: {results[endpoint]['p95_ms']:.3f} ms)")
    
    return results


def run_all_benchmarks():
    """Run all benchmarks and generate report"""
    print("=" * 60)
    print("📊 ML Engine Performance Benchmarks")
    print("=" * 60)
    
    results = {}
    
    # Risk prediction benchmark
    results['risk_prediction'] = benchmark_risk_prediction()
    
    # Batch prediction benchmark
    results['batch_prediction'] = benchmark_batch_prediction()
    
    # Hazard analysis benchmark
    results['hazard_analysis'] = benchmark_hazard_analysis()
    
    # API benchmark
    results['api_response'] = benchmark_api_response_time()
    
    print("\n" + "=" * 60)
    print("📋 Benchmark Summary")
    print("=" * 60)
    
    if results['risk_prediction']:
        print(f"Risk Prediction: {results['risk_prediction']['mean_ms']:.3f} ms avg")
    
    if results['hazard_analysis']:
        print(f"Hazard Analysis: {results['hazard_analysis']['mean_ms']:.3f} ms avg")
    
    return results


if __name__ == '__main__':
    run_all_benchmarks()
