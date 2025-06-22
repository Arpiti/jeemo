# 🚀 Jeemo Deployment Guide

This guide covers deploying Jeemo to Google Cloud Run with continuous deployment.

## Prerequisites

- Google Cloud Platform account
- GitHub account
- Docker installed locally (optional)
- Google Cloud CLI installed

## 🔧 Setup Instructions

### 1. Create Google Cloud Project

```bash
# Create a new project
gcloud projects create jeemo-bot-PROJECT_ID --name="Jeemo Bot"

# Set as default project
gcloud config set project jeemo-bot-PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 2. Create Secrets in Google Cloud Secret Manager

```bash
# Create secrets for environment variables
echo -n "YOUR_TELEGRAM_BOT_TOKEN" | gcloud secrets create telegram-bot-token --data-file=-
echo -n "YOUR_OPENAI_API_KEY" | gcloud secrets create openai-api-key --data-file=-
echo -n "YOUR_YOUTUBE_API_KEY" | gcloud secrets create youtube-api-key --data-file=-
echo -n "YOUR_REDIS_URL" | gcloud secrets create redis-url --data-file=-
```

### 3. Setup GitHub Repository

1. Create a new repository on GitHub named `jeemo`
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Jeemo bot"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/jeemo.git
   git push -u origin main
   ```

### 4. Configure GitHub Actions Secrets

In your GitHub repository, go to Settings > Secrets and variables > Actions, and add:

- `GCP_PROJECT_ID`: Your Google Cloud project ID
- `GCP_SA_KEY`: Service account key JSON (see below)

#### Create Service Account for GitHub Actions

```bash
# Create service account
gcloud iam service-accounts create github-actions \
    --description="Service account for GitHub Actions" \
    --display-name="GitHub Actions"

# Grant necessary permissions
gcloud projects add-iam-policy-binding jeemo-bot-PROJECT_ID \
    --member="serviceAccount:github-actions@jeemo-bot-PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudbuild.builds.builder"

gcloud projects add-iam-policy-binding jeemo-bot-PROJECT_ID \
    --member="serviceAccount:github-actions@jeemo-bot-PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding jeemo-bot-PROJECT_ID \
    --member="serviceAccount:github-actions@jeemo-bot-PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding jeemo-bot-PROJECT_ID \
    --member="serviceAccount:github-actions@jeemo-bot-PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# Create and download key
gcloud iam service-accounts keys create github-actions-key.json \
    --iam-account=github-actions@jeemo-bot-PROJECT_ID.iam.gserviceaccount.com
```

## 🎯 Deployment Options

### Option 1: Continuous Deployment (Recommended)

With the GitHub Actions workflow in place, every push to the `main` branch will automatically:

1. Run tests and linting
2. Build Docker image
3. Push to Google Container Registry
4. Deploy to Cloud Run

### Option 2: Manual Deployment with Cloud Build

```bash
# Submit build
gcloud builds submit --config cloudbuild.yaml

# Or deploy directly with Cloud Run
gcloud run deploy jeemo \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated
```

### Option 3: Local Docker Build & Deploy

```bash
# Build locally
docker build -t gcr.io/jeemo-bot-PROJECT_ID/jeemo .

# Push to registry
docker push gcr.io/jeemo-bot-PROJECT_ID/jeemo

# Deploy to Cloud Run
gcloud run deploy jeemo \
  --image gcr.io/jeemo-bot-PROJECT_ID/jeemo \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated
```

## 🔒 Environment Variables & Secrets

The deployment uses Google Cloud Secret Manager for sensitive data:

- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `OPENAI_API_KEY`: OpenAI API key
- `YOUTUBE_API_KEY`: YouTube Data API key (optional)
- `REDIS_URL`: Redis connection string (optional)

## 🌐 Webhook Configuration

After deployment, configure your Telegram bot webhook:

```bash
# Get your Cloud Run service URL
gcloud run services describe jeemo --region=asia-south1 --format='value(status.url)'

# Set webhook (replace with your actual URL and bot token)
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-cloud-run-url.com/webhook"}'
```

## 📊 Monitoring & Management

### View Logs
```bash
gcloud run services logs read jeemo --region=asia-south1
```

### Update Secrets
```bash
echo -n "NEW_VALUE" | gcloud secrets versions add SECRET_NAME --data-file=-
```

### Scale Service
```bash
gcloud run services update jeemo \
  --region=asia-south1 \
  --min-instances=1 \
  --max-instances=20
```

## 🔧 Troubleshooting

### Common Issues

1. **Build failing**: Check GitHub Actions logs for detailed error messages
2. **Service not responding**: Verify environment variables and secrets are set correctly
3. **Telegram webhook not working**: Ensure the webhook URL is publicly accessible

### Debugging Commands

```bash
# Check service status
gcloud run services describe jeemo --region=asia-south1

# View recent logs
gcloud run services logs tail jeemo --region=asia-south1

# Test health endpoint
curl https://your-service-url.com/health
```

## 💰 Cost Optimization

Cloud Run pricing is based on:
- CPU and memory allocation
- Request count
- Execution time

Optimize costs by:
- Setting appropriate min/max instances
- Using smaller memory allocations if possible
- Implementing proper caching

## 🔐 Security Best Practices

- Use Secret Manager for all sensitive data
- Enable HTTPS-only access
- Regularly rotate API keys
- Monitor service logs for suspicious activity
- Use least-privilege IAM roles

---

Built with ❤️ for deployment on Google Cloud Platform