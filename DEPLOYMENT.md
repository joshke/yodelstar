# 🎤✨💖 YODELSTAR DEPLOYMENT GUIDE ✨💖🎤

This guide will help you deploy your Yodelstar application to Google Cloud using Docker and Cloud Run.

## 📋 Prerequisites

Before you begin, make sure you have:

1. **Google Cloud Account** with billing enabled
2. **Google Cloud CLI** installed ([Installation Guide](https://cloud.google.com/sdk/docs/install))
3. **Docker** installed ([Installation Guide](https://docs.docker.com/get-docker/))
4. **Gemini API Key** from Google AI Studio ([Get API Key](https://ai.google.dev/))

## 🚀 Quick Deployment (Recommended)

### Step 1: Set up your environment

```bash
# Set your Gemini API key
export GEMINI_API_KEY="your-gemini-api-key-here"

# Set your Google Cloud project (optional - script will detect it)
export PROJECT_ID="your-project-id"
```

### Step 2: Run the deployment script

```bash
# Make sure you're in the project root directory
cd /path/to/yodelstar

# Run the deployment script
./deploy.sh
```

The script will:
- ✅ Check prerequisites (gcloud, docker)
- 🔐 Authenticate with Google Cloud
- 🏗️ Build the Docker image
- 📤 Push to Google Container Registry
- 🚀 Deploy to Cloud Run
- 🌐 Provide you with the live URL

## 🛠️ Manual Deployment

If you prefer to deploy manually or need more control:

### Step 1: Authenticate with Google Cloud

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Configure Docker for Google Cloud
gcloud auth configure-docker
```

### Step 2: Enable required APIs

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### Step 3: Build and push Docker image

```bash
# Build the image
docker build -t gcr.io/YOUR_PROJECT_ID/yodelstar-app:latest .

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/yodelstar-app:latest
```

### Step 4: Deploy to Cloud Run

```bash
gcloud run deploy yodelstar \
    --image gcr.io/YOUR_PROJECT_ID/yodelstar-app:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 1 \
    --max-instances 10 \
    --min-instances 0 \
    --port 8080 \
    --timeout 300 \
    --set-env-vars GEMINI_API_KEY=your-api-key-here
```

## 🔄 Automated Deployment with Cloud Build

For continuous deployment, you can use Cloud Build:

### Step 1: Set up Cloud Build trigger

1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click "Create Trigger"
3. Connect your repository (GitHub/Bitbucket/Cloud Source Repositories)
4. Configure the trigger:
   - **Name**: `yodelstar-deploy`
   - **Event**: Push to branch
   - **Branch**: `^main$` (or your main branch)
   - **Configuration**: Cloud Build configuration file
   - **Location**: `cloudbuild.yaml`

### Step 2: Set substitution variables

In the trigger configuration, add substitution variables:
- `_GEMINI_API_KEY`: Your Gemini API key

### Step 3: Enable automatic deployment

Now every push to your main branch will automatically deploy to Cloud Run!

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Yes |
| `PORT` | Port for the application (default: 8080) | No |
| `FLASK_ENV` | Flask environment (default: production) | No |

### Cloud Run Settings

You can customize these settings in `deploy.sh` or during manual deployment:

| Setting | Default | Description |
|---------|---------|-------------|
| `MEMORY` | 2Gi | Memory allocation |
| `CPU` | 1 | CPU allocation |
| `MAX_INSTANCES` | 10 | Maximum number of instances |
| `MIN_INSTANCES` | 0 | Minimum number of instances |
| `TIMEOUT` | 300s | Request timeout |
| `REGION` | us-central1 | Deployment region |

## 🔍 Monitoring and Troubleshooting

### View logs

```bash
# View real-time logs
gcloud logs tail --follow \
    --project=YOUR_PROJECT_ID \
    --resource-type=cloud_run_revision \
    --resource-labels=service_name=yodelstar

# View logs in Cloud Console
# https://console.cloud.google.com/logs/query
```

### Health check

Your deployed app includes a health check endpoint:

```bash
curl https://your-app-url.run.app/health
```

### Common issues

1. **Build fails**: Check Docker syntax and file paths
2. **Deployment fails**: Verify API keys and permissions
3. **App doesn't start**: Check logs for environment variable issues
4. **Frontend not loading**: Ensure React build completed successfully

## 💰 Cost Optimization

### Cloud Run Pricing

Cloud Run charges based on:
- **CPU and Memory**: Only when handling requests
- **Requests**: $0.40 per million requests
- **Networking**: Egress charges may apply

### Optimization tips

1. **Set min-instances to 0** for cost savings (cold starts acceptable)
2. **Adjust memory/CPU** based on actual usage
3. **Use request timeout** to prevent long-running requests
4. **Monitor usage** in Cloud Console

## 🔒 Security Best Practices

1. **Environment Variables**: Store sensitive data in Cloud Run environment variables
2. **IAM**: Use least-privilege access for service accounts
3. **HTTPS**: Cloud Run provides HTTPS by default
4. **Authentication**: Consider adding authentication for production use

## 🌍 Custom Domain (Optional)

To use a custom domain:

1. **Verify domain ownership** in Google Cloud Console
2. **Map domain** to your Cloud Run service
3. **Update DNS** records as instructed

```bash
# Map custom domain
gcloud run domain-mappings create \
    --service yodelstar \
    --domain your-domain.com \
    --region us-central1
```

## 📊 Scaling Configuration

Cloud Run automatically scales based on traffic, but you can configure:

```bash
# Update scaling settings
gcloud run services update yodelstar \
    --region us-central1 \
    --min-instances 1 \
    --max-instances 100 \
    --concurrency 80
```

## 🎯 Next Steps

After successful deployment:

1. **Test your application** thoroughly
2. **Set up monitoring** and alerting
3. **Configure custom domain** if needed
4. **Set up CI/CD pipeline** for automated deployments
5. **Monitor costs** and optimize as needed

## 🆘 Support

If you encounter issues:

1. Check the [troubleshooting section](#monitoring-and-troubleshooting)
2. Review Cloud Run logs
3. Verify all prerequisites are met
4. Check Google Cloud status page

---

**🎤 Happy Yodeling in the Cloud! 🎤**

Your Yodelstar app is now ready to scale globally and handle yodelers from around the world! ✨💖 