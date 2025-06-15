# Multi-stage Docker build for Yodelstar
# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY yodelstar-app/package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps --omit=dev

# Copy source code
COPY yodelstar-app/ ./

# Build the React app
RUN npm run build

# Stage 2: Python backend with built frontend
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY api/ ./api/

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend/build ./static

# Create steps directory for audio files
RUN mkdir -p ./api/steps

# Set environment variables
ENV FLASK_APP=api/api.py
ENV FLASK_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Create a startup script that serves both frontend and backend
RUN echo '#!/bin/bash\n\
cd /app\n\
exec gunicorn --bind 0.0.0.0:$PORT --workers 1 --timeout 120 api.api:app' > /app/start.sh

RUN chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

CMD ["/app/start.sh"] 