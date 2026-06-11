## 🪙 Project: Gold Frame Generator (โปรเจกต์เสี่ยสั่งเลี่ยม)

**Mission:** เปลี่ยนรูปถ่ายธรรมดาของชาวเน็ตให้กลายเป็นมีมไฮโซหรูหราหมาเห่าสีเหลืองอร่ามตระการตา ด้วยกรอบหลุยส์ชุบทองคำ (ปลอม) ภายใน 1 คลิก เน้นลีน สตรีท กวนประสาท และต้องจ่ายค่าเซิฟเวอร์เดือนละ 0 บาท

---

## 🛑 5 COMMANDMENTS (กฎเหล็กในการพัฒนาโปรเจกต์)

1. **ลีนเพื่อความประหยัด (Token Efficiency):** หากข้อความหรือ Prompt มีความยาวเกินไป **ให้สรุปใจความสำคัญให้กระชับและสั้นที่สุดก่อนนำไปประมวลผล** เพื่อความประหgibj,ยัด Token และงบประมาณขั้นสุด
2. **Continuous Documentation:** ทุกครั้งที่มีการแก้ไข บั๊กฟิกซ์ หรืออัปเดตฟีเจอร์ใดๆ **ห้ามลืมอัปเดตข้อมูลลงใน Document ที่เกี่ยวข้อง (เช่น `system_prompt.md` หรือ `README.md`) ทันที** ห้ามปล่อยให้ Docs ล้าหลังเด็ดขาด
3. **Comprehensive README:** ไฟล์ `README.md` ต้องครอบคลุมตั้งแต่ขั้นตอนการเตรียม Infrastructure บน GCP ไปจนถึงวิธีการ Deploy อย่างละเอียด เพื่อให้คนในทีมเอาไปรันต่อได้ทันที
4. **Automated Deployment:** ระบบต้องมี Scripts สำหรับการ Deploy (เช่น Bash Script) เพื่อลดความผิดพลาดและให้สามารถ Deploy แอปขึ้น Cloud Run ได้ภายในคำสั่งเดียว
5. **No Image Upload to Server:** รูปภาพทั้งหมดต้องจบที่ Client-side (HTML5 Canvas) เซิฟเวอร์ทำหน้าที่ส่งไฟล์เว็บและบันทึกข้อมูลสถิติเท่านั้น

---

## 🎯 1. Core Capabilities (ฟังก์ชันหลัก)

1. **Mobile-First UX/UI:** หน้าตาเว็บต้องคลีน สวยงาม และรองรับการส่องบนมือถือเป็นหลัก (สัดส่วนจอแนวตั้ง)
2. **Client-Side Image Merging:** ใช้ **HTML5 Canvas** รวมร่างรูปภาพของ User และ Template กรอบหลุยส์บนเครื่องของ User เอง
3. **Strict Whitelist Authentication (Via Google & Callsign):** * เข้าสู่ระบบด้วย Google Sign-In (Gmail) เท่านั้น
* ระบบจะเช็ค Email กับฐานข้อมูล หากผ่านจะดึง **Callsign** ผูกมาใช้งาน บนหน้าแอปและหน้าสถิติทั้งหมดจะใช้และโชว์แค่นี้
* หากไมู่อยู่ใน List **ห้ามเข้าใช้** และดีดไปหน้าไล่ส่งแบบกวนประสาททันที


4. **Meme Analytics:** เมื่อ User กดปุ่ม "Gen รูป" ให้ยิง API ไปบันทึกข้อมูลสะสมสถิติโดยอ้างอิงผ่าน Callsign
5. **Hall of "Frame":** หน้าแดชบอร์ดโชว์ความขยันในการปั๊มมีม แสดงสถิติแยกตาม: รายวัน, 7 วันที่แล้ว, 30 วันที่แล้ว และ All Time

---

## 🏗️ 2. Tech Stack & Infra (สายประหยัด 0 บาท)

* **Frontend:** HTML5, CSS (Tailwind CSS via CDN), Vanilla JavaScript (Canvas API)
* **Backend:** Python (FastAPI)
* **Database:** Google Cloud Firestore (Datastore Mode)
* **Authentication:** Firebase Authentication (Google Provider)
* **Deployment:** Google Cloud Run (Scale to Zero)

---

## 🗄️ 3. Database Schema (Firestore)

### Collection: `whitelist_users`

```json
{
  "email": "string (Primary Key)",
  "callsign": "string"
}

```

### Collection: `generation_logs`

```json
{
  "callsign": "string",
  "timestamp": "timestamp"
}

```

---

## 🤫 4. Persona & Tone of Voice (กฎข้อห้ามและสไตล์)

* **ความกวนประสาท 100%:** ภาษาที่ใช้ในแอปต้องมีความกวนตีนแต่ไม่หยาบคาย ให้ฟีลประชดประชันความรวยแบบมีระดับ
* **หน้า Whitelist Failed (เมื่อคนนอกแอบเข้า):** ต้องขึ้นข้อความกวนๆ เช่น
* *"ขออภัย สัญญาณเรียกขานของคุณยังไม่ได้รับการอนุมัติ... บารมียังไม่ถึงขั้น โปรดติดต่อเสี่ยเพื่อขอสิทธิ์เลี่ยมทอง"*
* *"QRU 73! สัญญาณของคุณถูกรบกวนโดยความจน กรุณากลับไปสะสมแต้มบุญกับท่านเจ้าคุณใหม่"*


* **Security & Responsibility:** โปรเจกต์นี้ใช้ `WTFPL` ทุกคนมีสิทธิ์เอาโค้ดไปยำใหญ่ได้ตามใจชอบ แต่เซิฟเวอร์ต้องไม่โดนเจาะ และระบบต้องไม่เก็บรูปภาพส่วนตัวของ User

---

## 📄 5. โครงสร้างไฟล์สำหรับ README & Deploy Script (Preview)

เพื่อให้ตรงตามกฎเหล็ก ข้อ 3 และ ข้อ 4 นี่คือโครงร่างที่คุณสามารถเอาไปสร้างไฟล์ต่อในโปรเจกต์ได้เลยครับ:

### ตัวอย่างไฟล์ `README.md` (หัวข้อการเตรียมคลาวด์)

```markdown
## 🚀 วิธีการเตรียม Infra & Deploy (GCP)

### 1. สิ่งที่ต้องเตรียมก่อนเริ่ม
* ติดตั้ง `gcloud CLI` และทำการล็อกอิน (`gcloud auth login`)
* เปิดใช้งาน (Enable) API เหล่านี้บน GCP Project:
  * Artifact Registry API
  * Cloud Run API
  * Firestore API

### 2. ตั้งค่า Firestore
* ไปที่ GCP Console -> Firestore
* เลือกโหมด **Datastore Mode** (แนะนำสำหรับความลีน) และเลือก Location ใกล้ไทย (เช่น `asia-southeast1` สิงคโปร์)

### 3. วิธีการ Deploy แบบไวแสง
เราทำ Script อัตโนมัติไว้ให้แล้ว ให้รันคำสั่งนี้ที่ Root Project:
```bash
chmod +x deploy.sh
./deploy.sh

```

---

### ตัวอย่างไฟล์ `deploy.sh` (Script สำหรับ Deploy อัตโนมัติ)

```bash
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

# 2. Build Docker Image และ Push ขึ้น Google Container Registry (หรือ Artifact Registry)
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

```

---
