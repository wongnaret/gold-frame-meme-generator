#!/bin/bash

# สั่งให้สคริปต์หยุดทำงานทันทีถ้ามีบรรทัดไหน Error
set -e

# --- ตั้งค่าตัวแปร (ปรับเปลี่ยนตามโปรเจกต์ของคุณ) ---
PROJECT_ID="gold-frame-meme"
REGION="asia-southeast1"
SERVICE_NAME="gold-frame-generator"
IMAGE_TAG="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

echo "🌟 เริ่มต้นกระบวนการเลี่ยมทองบน Cloud Run..."

# 1. ยืนยันโปรเจกต์บน gcloud
gcloud config set project $PROJECT_ID

# 2. Build Docker Image และ Push ขึ้น Google Container Registry
echo "📦 กำลังแพ็คแอปพลิเคชันลง Container..."
gcloud builds submit --tag $IMAGE_TAG .

# 3. Deploy ขึ้น Cloud Run (เปิดโหมดประหยัดสุด Scale to Zero)
echo "🚀 กำลังส่งแอปขึ้นยาน Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_TAG \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --min-instances 0 \
    --max-instances 2 \
    --memory 256Mi \
    --cpu 1

echo "✨ เสร็จสิ้น! แอปกรอบหลุยส์สุดมีมพร้อมใช้งานแล้วที่ URL ด้านบน!"
