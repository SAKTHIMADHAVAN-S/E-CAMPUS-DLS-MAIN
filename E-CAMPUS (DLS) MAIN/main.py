#!/usr/bin/env python3
"""
=============================================================================
Real-Time Face Recognition System using Python, OpenCV, and face_recognition
=============================================================================
Project Goal:
  Implement a real-time face recognition system using Python 3.x, OpenCV,
  face-recognition (dlib 128D embeddings), and NumPy.

Directory Structure:
  - Root directory containing this execution script (`main.py`)
  - Subfolder `known_faces/` containing reference baseline images named after
    the subject (e.g., "Vijay.jpg", "Ajith.jpg", "Faculty.jpg").

Processing Pipeline:
  1. Initialize webcam capture frame-by-frame (cv2.VideoCapture).
  2. Downscale frames to 0.25x for optimized real-time processing speeds.
  3. Convert image coloring framework from BGR to RGB.
  4. Extract facial boundaries (bounding boxes) and compute 128-dimension feature encodings.
  5. Apply Euclidean distance vector math against the reference database
     to compute similarity metrics (threshold limit set to 0.6).
  6. Draw a green rectangle bounding box around identified users with their name label,
     or a red rectangle tracking tag for "Unknown" profiles.
=============================================================================
"""

import os
import sys
import time
import argparse
import numpy as np

# Verify required core libraries
try:
    import cv2
except ImportError:
    print("\n[ERROR] OpenCV is not installed.")
    print("Please install required dependencies: pip install -r requirements.txt\n")
    sys.exit(1)

try:
    import face_recognition
except ImportError:
    print("\n[ERROR] 'face_recognition' library is not installed.")
    print("Please install via: pip install face-recognition\n")
    sys.exit(1)


# Path Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KNOWN_FACES_DIR = os.path.join(BASE_DIR, "known_faces")
SIMILARITY_THRESHOLD = 0.6  # Standard Euclidean distance tolerance (lower is stricter)
DOWNSCALE_FACTOR = 0.25     # 0.25x scaling for 4x faster processing speed
UPSCALE_FACTOR = int(1.0 / DOWNSCALE_FACTOR)  # 4x to scale bounding boxes back to original


def load_known_faces(known_faces_dir=KNOWN_FACES_DIR):
    """
    Step 0: Load baseline reference images from 'known_faces/' directory,
    extract the subject's name from the filename, and calculate 128-D encodings.
    """
    known_face_encodings = []
    known_face_names = []

    if not os.path.exists(known_faces_dir):
        os.makedirs(known_faces_dir, exist_ok=True)
        print(f"[INFO] Created '{known_faces_dir}' directory.")
        print(f"[INFO] Please place reference face photos (.jpg, .png) in '{known_faces_dir}'.")
        return known_face_encodings, known_face_names

    supported_extensions = (".jpg", ".jpeg", ".png", ".bmp", ".webp")
    image_files = [f for f in os.listdir(known_faces_dir) if f.lower().endswith(supported_extensions)]

    if not image_files:
        print(f"[WARNING] No face images found in '{known_faces_dir}'.")
        print(f"[INFO] Place named images like 'Vijay.jpg' or 'Ajith.jpg' in '{known_faces_dir}'.")
        return known_face_encodings, known_face_names

    print("=" * 65)
    print(f"[*] Loading Baseline Face Database from: {known_faces_dir}")
    print("=" * 65)

    for filename in image_files:
        # Extract subject name from filename (e.g., 'Vijay.jpg' -> 'Vijay')
        name = os.path.splitext(filename)[0].replace("_", " ").title()
        image_path = os.path.join(known_faces_dir, filename)

        try:
            # Load the reference image using face_recognition
            reference_image = face_recognition.load_image_file(image_path)

            # Compute 128-dimensional facial feature encodings
            encodings = face_recognition.face_encodings(reference_image)

            if len(encodings) > 0:
                known_face_encodings.append(encodings[0])
                known_face_names.append(name)
                print(f"  [+] Loaded & Encoded: {name:<20} ({filename})")
            else:
                print(f"  [!] Skipped {filename}: No detectable face found in image.")
        except Exception as e:
            print(f"  [-] Failed to load {filename}: {str(e)}")

    print(f"\n[✓] Total Known Profiles Loaded: {len(known_face_names)}")
    print("=" * 65 + "\n")
    return known_face_encodings, known_face_names


def draw_hud_header(frame, fps, known_count, frame_count):
    """Draw a clean HUD overlay banner on the top of the video feed."""
    h, w = frame.shape[:2]
    # Header bar background
    cv2.rectangle(frame, (0, 0), (w, 40), (15, 23, 42), -1)
    # Header bottom border line
    cv2.line(frame, (0, 40), (w, 40), (0, 215, 255), 1)

    # Status texts
    cv2.putText(frame, "SWCE REAL-TIME FACE RECOGNITION SYSTEM", (15, 25),
                cv2.FONT_HERSHEY_DUPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)
    cv2.putText(frame, f"FPS: {fps:.1f} | DB: {known_count} profiles", (w - 240, 25),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 215, 255), 1, cv2.LINE_AA)

    # Footer instructions
    cv2.rectangle(frame, (0, h - 28), (w, h), (15, 23, 42), -1)
    cv2.putText(frame, "Press 'Q' to Exit | Press 'S' to Save Snapshot | Press 'R' to Reload DB", (15, h - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.42, (148, 163, 184), 1, cv2.LINE_AA)


def run_face_recognition(camera_index=0, tolerance=SIMILARITY_THRESHOLD, process_every_n_frames=1):
    """
    Main Execution Loop implementing the 6-step Processing Pipeline:
      1. Initialize webcam capture frame-by-frame.
      2. Downscale frames to 0.25x for optimized real-time processing speeds.
      3. Convert image coloring framework from BGR to RGB.
      4. Extract facial boundaries (bounding boxes) and compute 128-dimension feature encodings.
      5. Apply distance vector math against the reference database to compute similarity metrics (threshold <= 0.6).
      6. Draw a green rectangle bounding box around identified users with their name label,
         or a red rectangle tracking tag for 'Unknown' profiles.
    """
    # Load known reference database
    known_face_encodings, known_face_names = load_known_faces()

    # Step 1: Initialize webcam capture frame-by-frame
    print(f"[*] Initializing Webcam Stream (Camera Index: {camera_index})...")
    video_capture = cv2.VideoCapture(camera_index)

    # Request high-definition resolution if supported by webcam hardware
    video_capture.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    video_capture.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    if not video_capture.isOpened():
        print(f"\n[ERROR] Could not access webcam at index {camera_index}.")
        print("[TIP] If running on a laptop or external webcam, try --camera 0 or --camera 1.")
        print("[TIP] You can also test on a video file with --video path/to/video.mp4\n")
        return

    print("[✓] Webcam stream initialized successfully.")
    print("[*] Starting real-time face recognition loop. Press 'q' in the video window to quit.\n")

    # State variables for processing pipeline
    face_locations = []
    face_encodings = []
    face_names = []
    face_distances = []
    frame_count = 0
    fps = 0.0
    start_time = time.time()

    cv2.namedWindow("Real-Time Face Recognition", cv2.WINDOW_AUTOSIZE)

    try:
        while True:
            ret, frame = video_capture.read()
            if not ret or frame is None:
                print("[WARNING] Empty frame received from webcam stream. Retrying...")
                time.sleep(0.05)
                continue

            frame_count += 1
            current_time = time.time()
            elapsed = current_time - start_time
            if elapsed > 0:
                fps = 1.0 / max(elapsed, 0.001)
            start_time = current_time

            # Only process face recognition every N frames for performance optimization
            if frame_count % process_every_n_frames == 0:
                # Step 2: Downscale frame to 0.25x (1/4 size) for real-time speed boost
                small_frame = cv2.resize(frame, (0, 0), fx=DOWNSCALE_FACTOR, fy=DOWNSCALE_FACTOR)

                # Step 3: Convert color space from BGR (OpenCV default) to RGB (face_recognition / dlib requirement)
                # Note: np.ascontiguousarray ensures C-contiguous memory layout for dlib C++ bindings
                rgb_small_frame = np.ascontiguousarray(small_frame[:, :, ::-1])

                # Step 4: Extract facial boundaries (bounding boxes) and compute 128-D feature encodings
                face_locations = face_recognition.face_locations(rgb_small_frame, model="hog")
                face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

                face_names = []
                face_distances = []

                # Step 5: Apply distance vector math against reference database
                for face_encoding in face_encodings:
                    name = "Unknown"
                    min_distance = 1.0

                    if len(known_face_encodings) > 0:
                        # Compute Euclidean distance vector to all known faces
                        # (128-dimensional Euclidean distance calculation)
                        distances = face_recognition.face_distance(known_face_encodings, face_encoding)
                        best_match_index = np.argmin(distances)
                        min_distance = distances[best_match_index]

                        # Verify if the shortest vector distance satisfies similarity threshold (<= 0.6)
                        if min_distance <= tolerance:
                            name = known_face_names[best_match_index]

                    face_names.append(name)
                    face_distances.append(min_distance)

            # Step 6: Draw bounding box and label tag for each detected face
            # Scale coordinates back up by 4x (UPSCALE_FACTOR) to match original frame
            for (top, right, bottom, left), name, dist in zip(face_locations, face_names, face_distances):
                top *= UPSCALE_FACTOR
                right *= UPSCALE_FACTOR
                bottom *= UPSCALE_FACTOR
                left *= UPSCALE_FACTOR

                is_known = (name != "Unknown")

                # Colors (BGR): Green for Identified Profiles, Red for Unknown Profiles
                # Identified = (0, 255, 0) Bright Green | Unknown = (0, 0, 255) Crimson Red
                box_color = (0, 220, 0) if is_known else (0, 0, 235)
                tag_bg_color = (0, 180, 0) if is_known else (0, 0, 180)

                # 6a. Draw Main Bounding Box Rectangle
                cv2.rectangle(frame, (left, top), (right, bottom), box_color, 2)

                # 6b. Draw Corner Accent Reticles for high-tech biometric look
                corner_len = min(20, (right - left) // 4)
                # Top-Left corner
                cv2.line(frame, (left, top), (left + corner_len, top), (0, 255, 255), 2)
                cv2.line(frame, (left, top), (left, top + corner_len), (0, 255, 255), 2)
                # Top-Right corner
                cv2.line(frame, (right, top), (right - corner_len, top), (0, 255, 255), 2)
                cv2.line(frame, (right, top), (right, top + corner_len), (0, 255, 255), 2)
                # Bottom-Left corner
                cv2.line(frame, (left, bottom), (left + corner_len, bottom), (0, 255, 255), 2)
                cv2.line(frame, (left, bottom), (left, bottom - corner_len), (0, 255, 255), 2)
                # Bottom-Right corner
                cv2.line(frame, (right, bottom), (right - corner_len, bottom), (0, 255, 255), 2)
                cv2.line(frame, (right, bottom), (right, bottom - corner_len), (0, 255, 255), 2)

                # 6c. Build Label Text (Name + Confidence/Distance Metric)
                if is_known:
                    confidence_pct = max(0, min(100, int((1.0 - dist) * 100)))
                    label_text = f"✓ {name} ({confidence_pct}%)"
                else:
                    label_text = "⚠ Unknown Profile"

                # 6d. Draw Name Label Tag below the bounding box
                label_height = 28
                cv2.rectangle(frame, (left, bottom), (right, bottom + label_height), tag_bg_color, cv2.FILLED)
                cv2.rectangle(frame, (left, bottom), (right, bottom + label_height), box_color, 1)

                cv2.putText(frame, label_text, (left + 6, bottom + 19),
                            cv2.FONT_HERSHEY_DUPLEX, 0.52, (255, 255, 255), 1, cv2.LINE_AA)

            # Draw HUD Status Bar
            draw_hud_header(frame, fps, len(known_face_names), frame_count)

            # Display the resulting real-time frame
            cv2.imshow("Real-Time Face Recognition", frame)

            # Keyboard Controls
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q') or key == 27:  # 'q' or ESC
                print("[*] Exit key pressed. Closing application...")
                break
            elif key == ord('s'):  # Save Snapshot
                snapshot_filename = f"snapshot_{int(time.time())}.jpg"
                cv2.imwrite(snapshot_filename, frame)
                print(f"[✓] Saved snapshot to: {snapshot_filename}")
            elif key == ord('r'):  # Reload reference images
                print("[*] Reloading known faces database...")
                known_face_encodings, known_face_names = load_known_faces()

    except KeyboardInterrupt:
        print("\n[*] Interrupted by user.")
    finally:
        # Cleanup webcam capture and destroy all OpenCV GUI windows
        video_capture.release()
        cv2.destroyAllWindows()
        print("[✓] Camera released and windows closed successfully.")


def main():
    parser = argparse.ArgumentParser(
        description="Real-Time Face Recognition System using Python, OpenCV, and 128-D dlib embeddings."
    )
    parser.add_argument(
        "--camera",
        type=int,
        default=0,
        help="Camera device index (default: 0 for built-in/primary webcam)."
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=SIMILARITY_THRESHOLD,
        help=f"Similarity threshold distance limit (default: {SIMILARITY_THRESHOLD}, lower is stricter)."
    )
    parser.add_argument(
        "--known-dir",
        type=str,
        default=KNOWN_FACES_DIR,
        help=f"Directory path containing baseline known face photos (default: {KNOWN_FACES_DIR})."
    )
    parser.add_argument(
        "--every-n-frames",
        type=int,
        default=1,
        help="Process face detection every N frames (default: 1, increase to 2 or 3 for lower CPU usage)."
    )

    args = parser.parse_args()

    print("\n" + "=" * 65)
    print("      REAL-TIME PYTHON & OPENCV FACE RECOGNITION PIPELINE     ")
    print("=" * 65)
    print(f"  • Python Runtime    : {sys.version.split()[0]}")
    print(f"  • OpenCV Version    : {cv2.__version__}")
    print(f"  • Distance Threshold: {args.threshold}")
    print(f"  • Known Faces Folder: {args.known_dir}")
    print(f"  • Camera Index      : {args.camera}")
    print("=" * 65 + "\n")

    run_face_recognition(
        camera_index=args.camera,
        tolerance=args.threshold,
        process_every_n_frames=args.every_n_frames
    )


if __name__ == "__main__":
    main()
