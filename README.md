# 🪙 โปรเจกต์เสี่ยสั่งเลี่ยม (Gold Frame Meme Generator)

**เปลี่ยนภาพถ่ายธรรมดาให้กลายเป็นมีมสัญชาติมหาเศรษฐีเลี่ยมกรอบหลุยส์สีเหลืองอร่ามตระการตาใน 1 คลิก!** 

โปรเจกต์เว็บแอปพลิเคชันสายกวนประสาทที่เน้นความเสถียร สตรีท และประหยัดงบขั้นสุด (ค่าดูแลระบบรายเดือน 0 บาท!) โดยใช้การคำนวณ Canvas ฝั่ง Client-side ทั้งหมดเพื่อลดภาระเซิฟเวอร์

---

## 🏗️ Tech Stack & Architecture

* **Frontend:** HTML5, CSS (Tailwind CSS via CDN), Vanilla JavaScript (HTML5 Canvas API)
* **Backend:** Python 3.11 (FastAPI)
* **Database:** Google Cloud Datastore (Firestore in Datastore Mode)
* **Authentication:** Firebase Authentication (Google OAuth Provider)
* **Deployment:** Google Cloud Run (Scale to Zero - ฟรีเมื่อไม่มีคนใช้งาน)

---

## 💻 วิธีการรันในเครื่องสำหรับนักพัฒนา (Local Development)

ระบบถูกออกแบบมาให้มี **Mock Mode** สำหรับพัฒนารันในเครื่องได้ทันทีโดยไม่ต้องเชื่อมต่อระบบ Firebase หรือ Google Cloud จริงๆ!

### 1. ติดตั้ง Dependencies
ใช้ Python 3.11 หรือสูงกว่า:
```bash
pip install -r requirements.txt
```

### 2. รันแอปพลิเคชัน
```bash
uvicorn app.main:app --reload
```
เปิดบราวเซอร์ไปที่ [http://127.0.0.1:8000](http://127.0.0.1:8000)

### 3. การ Login ใน Mock Mode
เมื่อเปิดใช้งานครั้งแรกและระบบไม่พบค่าคอนฟิก Firebase ใน Env Vars ระบบจะเปิดใช้งาน **Mock Mode** อัตโนมัติ:
* กรอกอีเมล whitelist ที่เตรียมไว้เพื่อเช็คสิทธิ์และรับบทตัวละคร เช่น:
  * `test@example.com` (ได้รับบท: **เสี่ยดม**)
  * `admin@goldframe.com` (ได้รับบท: **ผู้กองยอดรัก**)
  * `wongnaret@gmail.com` (ได้รับบท: **เสี่ยสั่งเลี่ยม**)
* กดปุ่ม **เข้าสู่ระบบจำลอง** เพื่อเข้าใช้ฟังก์ชันเลี่ยมทอง

---

## 🚀 การจัดเตรียม Infrastructure บน GCP & Firebase (สำหรับการใช้งานจริง)

ทำตามขั้นตอนอย่างระมัดระวังเพื่อให้ระบบทำงานได้เสถียร 0 บาท:

### ขั้นตอนที่ 1: ตั้งค่าโปรเจกต์ Google Cloud
1. ติดตั้ง `gcloud CLI` ในเครื่องคอมพิวเตอร์ของคุณ
2. ทำการ Login ผ่าน Command Line:
   ```bash
   gcloud auth login
   ```
3. เปิดใช้งาน API ที่จำเป็นบน GCP Project ของคุณ:
   ```bash
   gcloud services enable artifactregistry.googleapis.com run.googleapis.com datastore.googleapis.com
   ```

### ขั้นตอนที่ 2: ตั้งค่า Datastore (Firestore in Datastore Mode)
1. ไปที่ GCP Console -> **Firestore**
2. เลือกเปลี่ยนรูปแบบเป็น **Datastore Mode** (เพื่อสอดคล้องกับ SDK และประหยัดงบ)
3. เลือก Location ใกล้ประเทศไทย เช่น `asia-southeast1` (Singapore)

### ขั้นตอนที่ 3: เพิ่มข้อมูล Whitelist ใน Datastore
ใน Datastore Console ให้สร้าง Entity ภายใต้ Kind `whitelist_users` เพื่ออนุญาตให้ผู้ใช้เข้าสู่ระบบ:
* **Key identifier (Name/ID):** ใส่อีเมลของผู้ใช้แบบตรงตัว (เช่น `somchai@gmail.com`)
* **Properties:**
  * `callsign` (ประเภท String): ชื่อสัญญาณเรียกขานที่จะแสดงในระบบ (เช่น `เสี่ยสมชายสายเปย์`)

### ขั้นตอนที่ 4: ตั้งค่า Firebase Authentication
1. ไปที่ [Firebase Console](https://console.firebase.google.com/) แล้วสร้างโปรเจกต์ใหม่ (หรือเลือกเชื่อมโยงกับโปรเจกต์ GCP เดิม)
2. ไปที่เมนู **Build > Authentication** แล้วคลิก **Get Started**
3. ไปที่แท็บ **Sign-in method** และเปิดใช้งาน **Google**
4. จดจำข้อมูล Firebase Web Config สำหรับนำไปใส่เป็น Env Variables ให้ Cloud Run:
   * `apiKey`
   * `authDomain`
   * `projectId`
   * `appId`

---

## 🚢 วิธีการ Deploy ขึ้น Google Cloud Run

เรามีสคริปต์อัตโนมัติเตรียมไว้ให้เรียบร้อยแล้ว:

1. เปิดไฟล์ `deploy.sh` และปรับแก้ตัวแปรตามความเหมาะสม:
   ```bash
   PROJECT_ID="ชื่อ-gcp-project-ของคุณ"
   REGION="asia-southeast1"
   SERVICE_NAME="gold-frame-generator"
   ```
2. รันคำสั่ง deploy:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. เมื่อ Deploy เสร็จสิ้น ให้นำข้อมูล Firebase Config มาใส่เป็น **Environment Variables** ใน Cloud Run Service เพื่อเชื่อมต่อ Firebase:
   * `FIREBASE_API_KEY`
   * `FIREBASE_AUTH_DOMAIN`
   * `FIREBASE_PROJECT_ID`
   * `FIREBASE_APP_ID`

*(ระบบหลังบ้านจะดึงค่าคอนฟิกเหล่านี้ส่งให้หน้าบ้านโดยอัตโนมัติผ่านทาง API `/api/config` ทำให้นักพัฒนาไม่ต้อง Hardcode คอนฟิกทิ้งไว้ในโค้ด)*

---

## 🤫 กฎการพัฒนาเพิ่มเติม (Persona & Tone of Voice)
* หน้าความจนขัดข้อง (เมื่อผู้ใช้ไม่อยู่ใน Whitelist) ต้องใช้โทนภาษาประชดประชันความรวย เช่น *"สัญญาณของคุณถูกรบกวนโดยความจน กรุณากลับไปสะสมแต้มบุญกับท่านเจ้าคุณใหม่"*
* ห้ามมีการอัปโหลดรูปภาพเข้าสู่ฝั่ง Backend เด็ดขาด ให้จัดการผ่าน Canvas เสมอ!
