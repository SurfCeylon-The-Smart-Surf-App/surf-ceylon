#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Surf AI - Cardio ML Service Startup Script
Starts the Cardio AI Recommendation Server
"""

import subprocess
import sys
import os
import time
import signal
import platform
import io
import threading

# Fix Windows console encoding for Unicode
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Store process references
processes = []
service_names = []

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print("\n\nShutting down all services...")
    for proc in processes:
        try:
            if platform.system() == "Windows":
                proc.terminate()
            else:
                os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        except:
            pass
    time.sleep(1)
    # Force kill if still running
    for proc in processes:
        try:
            if proc.poll() is None:
                proc.kill()
        except:
            pass
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def read_output(proc, name):
    """Read and print output from a subprocess"""
    try:
        # With universal_newlines=True, readline returns strings, not bytes
        for line in iter(proc.stdout.readline, ''):
            if line:
                print(f"[{name}] {line.rstrip()}")
    except:
        pass

def read_errors(proc, name):
    """Read and print errors from a subprocess"""
    try:
        # With universal_newlines=True, readline returns strings, not bytes
        for line in iter(proc.stderr.readline, ''):
            if line:
                print(f"[{name} ERROR] {line.rstrip()}", file=sys.stderr)
    except:
        pass

def start_service(name, script_path, port):
    """Start a service in a separate process"""
    print(f"Starting {name} on port {port}...")
    
    try:
        if platform.system() == "Windows":
            # Windows: use CREATE_NEW_CONSOLE to see output
            proc = subprocess.Popen(
                [sys.executable, script_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
                bufsize=1,
                universal_newlines=True
            )
        else:
            # Unix/Linux/Mac
            proc = subprocess.Popen(
                [sys.executable, script_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                preexec_fn=os.setsid,
                bufsize=1,
                universal_newlines=True
            )
        
        # Start threads to read output
        stdout_thread = threading.Thread(target=read_output, args=(proc, name), daemon=True)
        stderr_thread = threading.Thread(target=read_errors, args=(proc, name), daemon=True)
        stdout_thread.start()
        stderr_thread.start()
        
        processes.append(proc)
        service_names.append(name)
        return proc
    except Exception as e:
        print(f"Failed to start {name}: {e}", file=sys.stderr)
        return None

if __name__ == "__main__":
    print("=" * 60)
    print("Surf AI - Cardio ML Service Startup")
    print("=" * 60)
    print("")
    print("Starting Cardio AI Recommendation Server...")
    print("  Port: 5001")
    print("")
    print("Press Ctrl+C to stop the service")
    print("=" * 60)
    print("")
    
    # Get script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Start Cardio ML Server
    cardio_server_script = os.path.join(script_dir, "services", "cardio_ml_server.py")
    proc1 = start_service("Cardio AI", cardio_server_script, 5001)
    if proc1 is None:
        print("Failed to start Cardio AI server", file=sys.stderr)
        sys.exit(1)
    
    time.sleep(3)  # Give it time to start
    
    # Check if service is still running
    if proc1.poll() is not None:
        print(f"ERROR: Cardio AI server exited with code {proc1.returncode}", file=sys.stderr)
        if proc1.stderr:
            try:
                error_output = proc1.stderr.read()
                if error_output:
                    # With universal_newlines=True, error_output is already a string
                    if isinstance(error_output, bytes):
                        error_output = error_output.decode('utf-8', errors='replace')
                    print(f"Error output: {error_output}", file=sys.stderr)
            except Exception as e:
                print(f"Could not read error output: {e}", file=sys.stderr)
        sys.exit(1)
    
    print("")
    print("Cardio AI service started successfully!")
    print("")
    print("Service URL:")
    print("  - Cardio AI: http://localhost:5001")
    print("    Health: http://localhost:5001/health")
    print("    Recommend: POST http://localhost:5001/api/ai-tutor/recommend")
    print("    Model Info: GET http://localhost:5001/api/ai-tutor/model/info")
    print("")
    print("Monitoring service... (Press Ctrl+C to stop)")
    print("")
    
    # Monitor processes
    try:
        while True:
            time.sleep(2)
            # Check if any process died
            for i, proc in enumerate(processes):
                if proc.poll() is not None:
                    name = service_names[i] if i < len(service_names) else f"Service {i+1}"
                    print(f"WARNING: {name} stopped unexpectedly (exit code: {proc.returncode})", file=sys.stderr)
                    # Read error output
                    try:
                        if proc.stderr:
                            error_output = proc.stderr.read()
                            if error_output:
                                # With universal_newlines=True, error_output is already a string
                                if isinstance(error_output, bytes):
                                    error_output = error_output.decode('utf-8', errors='replace')
                                print(f"Error details: {error_output}", file=sys.stderr)
                    except Exception as e:
                        print(f"Could not read error details: {e}", file=sys.stderr)
                    # Exit on failure
                    signal_handler(None, None)
    except KeyboardInterrupt:
        signal_handler(None, None)

