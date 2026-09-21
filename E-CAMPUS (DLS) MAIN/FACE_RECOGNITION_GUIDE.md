# Real-Time Face Recognition System (Python + OpenCV)

A real-time face recognition and biometric identity verification system built with **Python 3.x**, **OpenCV**, **face-recognition (dlib 128D embeddings)**, and **NumPy**.

---

## 📁 Directory Structure

```
├── main.py                     # Main execution script & video processing loop
├── requirements.txt            # Python package dependencies
├── known_faces/                # Baseline reference database
│   ├── Vijay.jpg               # Identified subject: Vijay
│   ├── Ajith.jpg               # Identified subject: Ajith
│   ├── Madhavan.jpg            # Identified subject: Madhavan
│   └── README.md               # Guidelines for adding reference images
└── FACE_RECOGNITION_GUIDE.md   # Complete setup and architecture documentation
```

---

## ⚙️ Technical Stack

* **Programming Language:** Python 3.8+ / 3.10+
* **Core Computer Vision:** `opencv-python`
* **Deep Metric Learning & Embeddings:** `face-recognition` (ResNet-based 128-dimensional face embedding model)
* **Vector Math & Arrays:** `numpy`
* **Input Source:** Local Webcam Stream (`cv2.VideoCapture(0)`) or video file

---

## 🚀 Quick Start & Installation

### 1. Install System Prerequisites & Dependencies

#### On Linux / Ubuntu:
```bash
sudo apt-get update
sudo apt-get install -y cmake build-essential libopenblas-dev liblapack-dev libx11-dev libgtk-3-dev
pip install -r requirements.txt
```

#### On Windows / macOS:
```bash
pip install -r requirements.txt
```

*Note: On Windows, if `dlib` asks for C++ build tools, install CMake (`pip install cmake`) and the Visual Studio C++ Build Tools.*

---

### 2. Populate Reference Images

Place clear, frontal portrait photos inside the `known_faces/` folder:
- Name each file after the person: `Vijay.jpg`, `Ajith.jpg`, `Madhavan.jpg`.
- The system automatically parses the filename as the subject's display name.

---

### 3. Run the Face Recognition System

```bash
# Run with default primary webcam (camera 0)
python main.py

# Specify an external webcam or adjust similarity threshold
python main.py --camera 1 --threshold 0.6

# Optimize for low-power hardware (processes every 2nd frame)
python main.py --every-n-frames 2
```

---

## 🔬 6-Step Real-Time Processing Pipeline

```
[ Webcam Feed ] ─> (1) cv2.VideoCapture(0)
       │
       ▼
(2) Downscale Frame (fx=0.25, fy=0.25)
       │
       ▼
(3) Convert Color Space (BGR -> RGB)
       │
       ▼
(4) Extract Facial Boundaries & Compute 128-D Encodings
       │
       ▼
(5) Vector Math: Euclidean Distance vs. Reference Database (Threshold <= 0.6)
       │
       ├─ Distance <= 0.6 ──> [ Identified User ] ─> (6a) Green Bounding Box (0, 255, 0) + Name Label
       └─ Distance > 0.6  ──> [ Unknown Profile ] ─> (6b) Red Bounding Box (0, 0, 255) + "Unknown"
```

### Detailed Pipeline Stages:

1. **Webcam Capture**:
   - Captures continuous video frames using `cv2.VideoCapture(0)` at up to 60 FPS in HD resolution.
2. **0.25x Frame Downscaling**:
   - `cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)` reduces pixel processing volume by **16x**, dramatically increasing inference FPS and reducing CPU latency.
3. **BGR to RGB Conversion**:
   - OpenCV loads frames in BGR format; `np.ascontiguousarray(small_frame[:, :, ::-1])` transforms the array into C-contiguous RGB for the dlib C++ inference engine.
4. **128-Dimensional Face Embedding**:
   - `face_recognition.face_locations()` locates bounding boxes using HOG (Histogram of Oriented Gradients).
   - `face_recognition.face_encodings()` generates a unique 128-element numerical vector representing the facial landmarks.
5. **Similarity Vector Math**:
   - `face_recognition.face_distance(known_encodings, candidate_encoding)` calculates Euclidean distances:
     $$\text{Distance} = \sqrt{\sum_{i=1}^{128} (v_{\text{known}, i} - v_{\text{candidate}, i})^2}$$
   - Matches with `distance <= 0.6` are confirmed as verified identities (`confidence % = (1.0 - distance) * 100`).
6. **Visual Bounding Boxes & HUD**:
   - Upscales coordinate boundaries by $4\times$ back to original resolution.
   - **Green Box `(0, 255, 0)`**: Identified profiles with name pill banner.
   - **Red Box `(0, 0, 255)`**: Unknown profiles with warning tag.
   - Live HUD displaying FPS, loaded profiles count, and interactive controls.

---

## ⌨️ Runtime Keyboard Controls

| Key | Action |
|---|---|
| `Q` or `ESC` | Exit and safely release webcam hardware |
| `S` | Save current annotated frame as a high-resolution snapshot |
| `R` | Reload reference database from `known_faces/` without restarting |
