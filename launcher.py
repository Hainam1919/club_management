import os
import sys
import subprocess

# 1. Setup paths
PROJECT_ROOT = "/sessions/ecstatic-exciting-davinci/mnt/claude_code/club_management"
LOCAL_SITE_PACKAGES = "/sessions/ecstatic-exciting-davinci/.local/lib/python3.10/site-packages"

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
if LOCAL_SITE_PACKAGES not in sys.path:
    sys.path.insert(0, LOCAL_SITE_PACKAGES)

print(f"Paths configured. Project root: {PROJECT_ROOT}")

# 2. Try to import required modules to verify
try:
    import uvicorn
    import structlog
    import fastapi
    print("All core dependencies loaded successfully.")
except ImportError as e:
    print(f"Missing dependency: {e}")
    sys.exit(1)

# 3. Launch Uvicorn
# Create a copy of current environment and add PYTHONPATH
env = os.environ.copy()
env["PYTHONPATH"] = f"{PROJECT_ROOT}:{LOCAL_SITE_PACKAGES}:{env.get('PYTHONPATH', '')}"

cmd = [
    "python3",
    "-m", "uvicorn",
    "app.main:app",
    "--host", "0.0.0.0",
    "--port", "9000",
    "--log-level", "info"
]

print(f"Launching server with command: {' '.join(cmd)}")
try:
    # Use env=env to pass the updated PYTHONPATH to the subprocess
    subprocess.run(cmd, check=True, env=env)
except subprocess.CalledProcessError as e:
    print(f"Server crashed: {e}")
    sys.exit(1)
