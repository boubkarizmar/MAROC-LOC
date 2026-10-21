FROM python:3.11-slim

WORKDIR /app
ENV PYTHONPATH=/app

# System deps for audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast, reliable Python package management
RUN pip install --no-cache-dir uv

# Create non-root user and directories
RUN groupadd -r appgroup && useradd -r -g appgroup appuser \
    && mkdir -p /app/mlflow /app/data /app/chroma_db /app/tts_outputs /home/appuser/.cache/huggingface /home/appuser/.cache/torch \
    && chown -R appuser:appgroup /app /home/appuser
ENV HOME=/home/appuser
ENV HF_HOME=/home/appuser/.cache/huggingface
ENV TRANSFORMERS_CACHE=/home/appuser/.cache/huggingface
ENV TORCH_HOME=/home/appuser/.cache/torch

# Copier et installer les dépendances (PyTorch CPU-only via extra-index-url dans requirements.txt)
COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

# Model will be downloaded at runtime and cached via volume mount

COPY . .

# DEV NOTE: running as root to work around Windows bind-mount ownership.
# In production, use a non-root user with writable named volumes.
USER root

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
