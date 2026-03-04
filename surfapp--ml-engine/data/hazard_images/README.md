# Hazard Image Dataset for Surf Ceylon ML Engine

## 📁 Folder Structure

```
hazard_images/
├── shark/           # Shark images (min 100 images)
├── jellyfish/       # Jellyfish images (min 100 images)
├── rip_current/     # Rip current patterns (min 100 images)
├── sea_urchin/      # Sea urchin images (min 100 images)
├── large_waves/     # Dangerous wave conditions (min 100 images)
├── reef_coral/      # Reef/coral hazards (min 100 images)
└── no_hazard/       # Safe beach/ocean scenes (min 100 images)
```

## 🎯 Target: 700+ images total (100+ per category)

## 📥 How to Collect Images

### Option 1: Automated Download (Recommended First Step)

Run the downloader script:

```powershell
cd surfapp--ml-engine
python training/download_hazard_images.py --all --count 100
```

For better results with Pixabay API (free):
1. Get API key from: https://pixabay.com/api/docs/
2. Run: `python training/download_hazard_images.py --all --count 100 --pixabay-key YOUR_KEY`

### Option 2: Manual Collection (Recommended for Quality)

**Best Free Sources:**

| Source | URL | Notes |
|--------|-----|-------|
| **Unsplash** | https://unsplash.com | High quality, free |
| **Pexels** | https://pexels.com | Free stock photos |
| **Pixabay** | https://pixabay.com | Free, API available |
| **Google Images** | images.google.com | Filter by license |
| **Flickr** | flickr.com | Search Creative Commons |

**Search Terms by Category:**

| Category | Search Terms |
|----------|-------------|
| **shark** | "shark in ocean", "shark fin water", "great white shark swimming" |
| **jellyfish** | "jellyfish ocean", "jellyfish bloom", "box jellyfish" |
| **rip_current** | "rip current aerial", "rip current beach", "rip tide warning" |
| **sea_urchin** | "sea urchin reef", "sea urchin underwater", "black sea urchin" |
| **large_waves** | "big waves dangerous", "storm surge waves", "high surf warning" |
| **reef_coral** | "shallow coral reef", "exposed reef low tide", "coral hazard" |
| **no_hazard** | "calm beach", "peaceful ocean", "safe swimming beach" |

### Option 3: Video Frame Extraction

Use YouTube videos of surf hazards and extract frames:

```python
# Example: Extract frames from video
import cv2
video = cv2.VideoCapture('shark_video.mp4')
frame_count = 0
while True:
    ret, frame = video.read()
    if not ret: break
    if frame_count % 30 == 0:  # Every 30 frames
        cv2.imwrite(f'shark/shark_vid_{frame_count}.jpg', frame)
    frame_count += 1
```

## ✅ Image Quality Guidelines

### DO Include:
- Clear, well-lit images
- Various angles and distances
- Different water/weather conditions
- Both underwater and above-water shots
- Real-world surf environment images

### DON'T Include:
- Blurry or low-resolution images
- Cartoons, drawings, or illustrations
- Images with heavy text/watermarks
- Stock photos with obvious staging
- Images smaller than 200x200 pixels

## 📊 After Collection

1. **Review Images**: Manually delete irrelevant or low-quality images
2. **Balance Classes**: Aim for similar counts across categories
3. **Check Summary**:
   ```powershell
   python training/download_hazard_images.py --summary
   ```
4. **Train Model**:
   ```powershell
   python training/train_hazard_classifier.py
   ```

## 🔢 Minimum Requirements

| Category | Minimum | Recommended |
|----------|---------|-------------|
| Per class | 50 | 150+ |
| Total | 350 | 1000+ |

## ⚠️ Legal Notes

- Only use images you have rights to use
- Respect Creative Commons licenses
- Don't scrape websites that prohibit it
- For production, consider licensed datasets

## 📈 Improving Accuracy

1. **More Data**: More images = better accuracy
2. **Quality**: Clean, relevant images matter more than quantity
3. **Balance**: Equal images per class prevents bias
4. **Variety**: Include different conditions (sunny, cloudy, underwater, etc.)
5. **Real Examples**: Actual hazard photos work better than stock images
