# Sample Python workflow for rooftop detection and counting
# Requirements: opencv-python, numpy, rasterio, torch/keras, and a pre-trained rooftop detection model

import cv2
import numpy as np
import rasterio
from shapely.geometry import Point
from rasterio.transform import from_origin

# Load georeferenced image
image_path = 'your_satellite_image.tif'  # GeoTIFF format recommended
with rasterio.open(image_path) as src:
    image = src.read([1, 2, 3])  # RGB bands
    transform = src.transform

# Load your pre-trained rooftop detection model here
# For example, using YOLOv5 (PyTorch):
# from yolov5 import YOLOv5
# model = YOLOv5('yolov5s.pt', device='cpu')

# Run detection (replace with your model's inference code)
# results = model.predict(image)
# For demonstration, let's assume results is a list of bounding boxes: [(x1, y1, x2, y2), ...]
results = []  # Replace with actual detection results

# Define center point (latitude, longitude) and radius in meters
center_lat, center_lon = 12.9716, 77.5946  # Example coordinates
radius_m = 100

# Convert center point to pixel coordinates
row, col = src.index(center_lon, center_lat)

# Calculate pixel radius (approximate, depends on image resolution)
pixel_size = src.res[0]  # meters per pixel
pixel_radius = int(radius_m / pixel_size)

# Count rooftops within radius
count = 0
for box in results:
    x1, y1, x2, y2 = box
    cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2)
    if np.sqrt((cx - col) ** 2 + (cy - row) ** 2) <= pixel_radius:
        count += 1

print(f'Number of rooftops in {radius_m}m radius: {count}')
