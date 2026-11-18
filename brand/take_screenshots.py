import os
import subprocess
import time
from PIL import Image

output_dir = r"C:\Users\Praneeth Burada\.gemini\antigravity\brain\a37eaf96-1894-4147-998a-0d9cd41133ec"
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(chrome_path):
    chrome_path = r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

print("Chrome path:", chrome_path)

# 1. Capture landing page light mode
landing_light = os.path.join(output_dir, "olmera_landing_light.png")
cmd1 = [
    chrome_path,
    "--headless=new",
    "--disable-gpu",
    "--window-size=1440,900",
    f"--screenshot={landing_light}",
    "http://localhost:5174/"
]
print("Capturing landing light...")
subprocess.run(cmd1, check=True)
print("Saved:", landing_light)

# 2. Capture with chrome devtools or python script
print("Done!")
