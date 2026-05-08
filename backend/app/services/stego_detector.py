from __future__ import annotations

import math
from datetime import datetime
from typing import Dict, Tuple

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = 70_000_000

MAX_SAMPLE_PIXELS = 10_000_000
MAX_SAMPLE_DIM = 2048


def _run_with_timeout(func, timeout_seconds: int, *args):
    return func(*args)


def analyze_lsb(image: Image.Image) -> float:
    if image.width * image.height > MAX_SAMPLE_PIXELS:
        image = image.copy()
        image.thumbnail((MAX_SAMPLE_DIM, MAX_SAMPLE_DIM))

    array = np.array(image)
    if array.size == 0:
        return 0.0

    lsb = array & 1
    ones_ratio = float(lsb.mean())
    chi_score = min(1.0, abs(ones_ratio - 0.5) / 0.25)

    if lsb.shape[1] > 1:
        pattern_ratio = float(np.mean(lsb[:, :-1] == lsb[:, 1:]))
        pattern_score = min(1.0, max(0.0, (pattern_ratio - 0.5) * 2.0))
    else:
        pattern_score = 0.0

    return min(1.0, (chi_score * 0.7) + (pattern_score * 0.3))


def analyze_histogram(image: Image.Image) -> float:
    if image.width * image.height > MAX_SAMPLE_PIXELS:
        image = image.copy()
        image.thumbnail((MAX_SAMPLE_DIM, MAX_SAMPLE_DIM))

    array = np.array(image)
    if array.size == 0:
        return 0.0

    scores = []
    for channel in range(array.shape[2]):
        hist, _ = np.histogram(array[:, :, channel], bins=256, range=(0, 255))
        smooth = np.convolve(hist, np.array([1, 2, 1]), mode="same") / 4.0
        diff = np.abs(hist - smooth)
        chi = float(diff.sum() / max(hist.sum(), 1))
        scores.append(min(1.0, chi * 5.0))

    return float(np.mean(scores)) if scores else 0.0


def check_eof_anomaly(file_path: str) -> float:
    with open(file_path, "rb") as file_handle:
        data = file_handle.read()

    if not data:
        return 0.0

    extra_bytes = 0

    if data.startswith(b"\xff\xd8"):
        marker = data.rfind(b"\xff\xd9")
        if marker != -1:
            extra_bytes = len(data) - (marker + 2)
    elif data.startswith(b"\x89PNG"):
        marker = data.rfind(b"IEND")
        if marker != -1:
            extra_bytes = len(data) - (marker + 8)
    elif data.startswith(b"GIF"):
        marker = data.rfind(b"\x3b")
        if marker != -1:
            extra_bytes = len(data) - (marker + 1)
    elif data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        if len(data) >= 12:
            riff_size = int.from_bytes(data[4:8], "little") + 8
            extra_bytes = max(0, len(data) - riff_size)

    if extra_bytes <= 0:
        return 0.0

    ratio = extra_bytes / len(data)
    return min(1.0, ratio * 10.0)


def entropy_analysis(image: Image.Image) -> float:
    if image.width * image.height > MAX_SAMPLE_PIXELS:
        image = image.copy()
        image.thumbnail((MAX_SAMPLE_DIM, MAX_SAMPLE_DIM))

    grayscale = image.convert("L")
    histogram = grayscale.histogram()
    total = sum(histogram)
    if total == 0:
        return 0.0

    entropy = 0.0
    for count in histogram:
        if count == 0:
            continue
        probability = count / total
        entropy -= probability * math.log2(probability)

    score = (entropy - 5.0) / 3.0
    return min(1.0, max(0.0, score))


def analyze_image(file_path: str, timeout_seconds: int = 10) -> Dict[str, object]:
    with Image.open(file_path) as image:
        image = image.convert("RGB")

        lsb_score = _run_with_timeout(analyze_lsb, timeout_seconds, image)
        hist_score = _run_with_timeout(analyze_histogram, timeout_seconds, image)
        entropy_score = _run_with_timeout(entropy_analysis, timeout_seconds, image)

    eof_score = _run_with_timeout(check_eof_anomaly, timeout_seconds, file_path)

    scores = [lsb_score, hist_score, eof_score, entropy_score]
    stego_score = (lsb_score * 0.35) + (hist_score * 0.25) + (eof_score * 0.2) + (entropy_score * 0.2)

    confidence = 1.0 - float(np.std(scores))
    confidence = min(1.0, max(0.0, confidence))

    if stego_score < 0.6:
        verdict = "CLEAN"
    elif stego_score < 0.85:
        verdict = "SUSPICIOUS"
    else:
        verdict = "MALICIOUS"

    return {
        "stego_score": float(min(1.0, max(0.0, stego_score))),
        "confidence": confidence,
        "verdict": verdict,
        "details": {
            "lsb_score": lsb_score,
            "histogram_score": hist_score,
            "eof_score": eof_score,
            "entropy_score": entropy_score,
            "confidence": confidence,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
    }
