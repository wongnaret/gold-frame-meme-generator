#!/bin/bash

# Stop execution if any command fails
set -e

# --- Variables Configuration (Adjust to your project settings) ---
PROJECT_ID="gold-frame-generator-499316"
REGION="asia-southeast1"
SERVICE_NAME="gold-frame-generator"
IMAGE_TAG="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

echo "🌟 Starting deployment to Cloud Run..."

# 1. Set gcloud active project
gcloud config set project $PROJECT_ID

# 2. Build Docker Image and Push to Google Container Registry
echo "📦 Building and pushing container image..."
gcloud builds submit --tag $IMAGE_TAG .

# 3. Deploy to Cloud Run (Scale to Zero enabled)
echo "🚀 Deploying service to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_TAG \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --min-instances 0 \
    --max-instances 2 \
    --memory 256Mi \
    --cpu 1 \
    --set-env-vars "FIREBASE_API_KEY=AIzaSyAfDS8Ww-JP2A6zXs68grH7mj6jW2Vjjsg,FIREBASE_AUTH_DOMAIN=gold-frame-generator-499316.firebaseapp.com,FIREBASE_PROJECT_ID=gold-frame-generator-499316,FIREBASE_APP_ID=1:1093042643837:web:d21f7b22546dfc6702a214"

echo "✨ Done! Your Gold Frame Meme app is ready. Check the URL above!"

