#!/bin/bash

# 🎤✨💖 YODELSTAR DEPLOYMENT SCRIPT ✨💖🎤
# Deploy Yodelstar to Google Cloud Run with Docker

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=""
REGION="us-central1"
SERVICE_NAME="yodelstar"
IMAGE_NAME="yodelstar-app"
MEMORY="2Gi"
CPU="1"
MAX_INSTANCES="10"
MIN_INSTANCES="0"
PORT="8080"

echo -e "${PURPLE}🎤✨💖 YODELSTAR DEPLOYMENT SCRIPT ✨💖🎤${NC}"
echo -e "${CYAN}=======================================${NC}"

# Function to print colored output
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if gcloud is installed
print_step "Checking Google Cloud CLI installation..."
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud CLI is not installed!"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi
print_success "Google Cloud CLI is installed"

# Check if docker is installed
print_step "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed!"
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi
print_success "Docker is installed"

# Get project ID if not set
if [ -z "$PROJECT_ID" ]; then
    print_step "Getting current Google Cloud project..."
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    if [ -z "$PROJECT_ID" ]; then
        print_error "No Google Cloud project is set!"
        echo "Please run: gcloud config set project YOUR_PROJECT_ID"
        echo "Or set PROJECT_ID variable in this script"
        exit 1
    fi
fi
print_success "Using project: $PROJECT_ID"

# Authenticate with Google Cloud
print_step "Authenticating with Google Cloud..."
gcloud auth login --brief
print_success "Authenticated with Google Cloud"

# Configure Docker for Google Cloud
print_step "Configuring Docker for Google Cloud..."
gcloud auth configure-docker --quiet
print_success "Docker configured for Google Cloud"

# Enable required APIs
print_step "Enabling required Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID
gcloud services enable run.googleapis.com --project=$PROJECT_ID
gcloud services enable containerregistry.googleapis.com --project=$PROJECT_ID
print_success "Required APIs enabled"

# Check for environment variables
print_step "Checking for required environment variables..."
if [ -z "$GEMINI_API_KEY" ]; then
    print_warning "GEMINI_API_KEY environment variable not set!"
    echo "Please set it with: export GEMINI_API_KEY=your_api_key"
    echo "Or it will be prompted during deployment"
fi

# Build the Docker image
print_step "Building Docker image..."
IMAGE_TAG="gcr.io/$PROJECT_ID/$IMAGE_NAME:latest"
echo "Building image: $IMAGE_TAG"

docker build -t $IMAGE_TAG .
print_success "Docker image built successfully"

# Push the image to Google Container Registry
print_step "Pushing image to Google Container Registry..."
docker push $IMAGE_TAG
print_success "Image pushed successfully"

# Deploy to Cloud Run
print_step "Deploying to Google Cloud Run..."

# Prepare environment variables
ENV_VARS=""
if [ ! -z "$GEMINI_API_KEY" ]; then
    ENV_VARS="--set-env-vars GEMINI_API_KEY=$GEMINI_API_KEY"
else
    print_warning "GEMINI_API_KEY not set. You'll need to set it manually in Cloud Run console."
fi

# Deploy the service
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_TAG \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory $MEMORY \
    --cpu $CPU \
    --max-instances $MAX_INSTANCES \
    --min-instances $MIN_INSTANCES \
    --port $PORT \
    --timeout 300 \
    $ENV_VARS \
    --project $PROJECT_ID

print_success "Deployment completed!"

# Get the service URL
print_step "Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)' --project $PROJECT_ID)

echo -e "${PURPLE}🎉 DEPLOYMENT SUCCESSFUL! 🎉${NC}"
echo -e "${CYAN}=======================================${NC}"
echo -e "${GREEN}Your Yodelstar app is now live at:${NC}"
echo -e "${YELLOW}$SERVICE_URL${NC}"
echo ""
echo -e "${BLUE}Additional Information:${NC}"
echo -e "• Project ID: $PROJECT_ID"
echo -e "• Service Name: $SERVICE_NAME"
echo -e "• Region: $REGION"
echo -e "• Image: $IMAGE_TAG"
echo ""
echo -e "${CYAN}To view logs:${NC}"
echo -e "gcloud logs tail --follow --project=$PROJECT_ID --resource-type=cloud_run_revision --resource-labels=service_name=$SERVICE_NAME"
echo ""
echo -e "${CYAN}To update environment variables:${NC}"
echo -e "gcloud run services update $SERVICE_NAME --region=$REGION --set-env-vars GEMINI_API_KEY=your_new_key --project=$PROJECT_ID"
echo ""
echo -e "${PURPLE}🎤 Happy Yodeling! 🎤${NC}" 