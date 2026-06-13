# 🪙 โปรเจกต์ทองอร่าม (Gold Frame Meme Generator)

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

### 1. ติดตั้ง Dependencies
ใช้ Python 3.11 หรือสูงกว่า:
```bash
pip install -r requirements.txt
```

### 2. เตรียมไฟล์กำหนดค่าสำหรับการพัฒนา (Configuration Setup)
คัดลอกไฟล์ตัวอย่างเพื่อสร้างไฟล์คอนฟิกจริงสำหรับใช้งานบนเครื่องของคุณ (ไฟล์เหล่านี้จะถูกละเว้นโดย `.gitignore` เพื่อไม่ให้บันทึกข้อมูลส่วนตัวหรือความลับขึ้น Git):
* **ตัวแปรสิ่งแวดล้อม (.env)**:
  คัดลอก [.env.example](file:///d:/repositories/gold-frame-meme-generator/.env.example) ไปเป็น `.env` (บน Windows ใช้คำสั่ง `copy .env.example .env` หรือ `cp` บน Unix/Linux)
* **รายชื่อ Whitelist (whitelist.json)**:
  คัดลอก [whitelist.json.example](file:///d:/repositories/gold-frame-meme-generator/whitelist.json.example) ไปเป็น `whitelist.json` (บน Windows ใช้คำสั่ง `copy whitelist.json.example whitelist.json`) เพื่อใช้กำหนดบทบาทตัวละครใน Mock Mode

### 3. รันแอปพลิเคชัน
```bash
uvicorn app.main:app --reload
```
เปิดบราวเซอร์ไปที่ [http://127.0.0.1:8000](http://127.0.0.1:8000)

### 4. การ Login ใน Mock Mode
เมื่อเปิดใช้งานครั้งแรกและระบบไม่พบค่าคอนฟิก Firebase ใน Env Vars ระบบจะเปิดใช้งาน **Mock Mode** อัตโนมัติ:
* กรอกอีเมล whitelist ที่เตรียมไว้เพื่อเช็คสิทธิ์และรับบทตัวละคร เช่น:
  * `test@example.com` (ได้รับบท: **เสี่ยดม**)
  * `admin@goldframe.com` (ได้รับบท: **ผู้กองยอดรัก**)
  * `wongnaret@gmail.com` (ได้รับบท: **เสี่ยสั่งเลี่ยม**)
* กดปุ่ม **เข้าสู่ระบบจำลอง** เพื่อเข้าใช้ฟังก์ชันเลี่ยมทอง

---

## 🚀 การจัดเตรียม Infrastructure บน GCP & Firebase (สำหรับการใช้งานจริง)

ทำตามขั้นตอนอย่างระมัดระวังเพื่อให้ระบบทำงานได้เสถียร 0 บาท:

> [!TIP]
> **สำหรับผู้ใช้ Windows (PowerShell)**:
> คุณสามารถใช้สคริปต์ตั้งค่าแบบอัตโนมัติที่จะทำการตรวจสอบ, ล็อกอิน, เปิดใช้งาน API ทั้งหมด, สร้าง Datastore (Datastore Mode), ตั้งค่าสิทธิ์ IAM, กำหนดสิทธิ์ ADC และอัปโหลดข้อมูล Whitelist ให้เสร็จสิ้นในครั้งเดียว โดยการรันคำสั่ง:
> ```powershell
> .\setup_gcp.ps1
> ```
> หากใช้สคริปต์นี้แล้ว คุณสามารถข้ามขั้นตอนที่ 1 ถึง 3 ด้านล่าง และไปยัง **ขั้นตอนที่ 4: ตั้งค่า Firebase Authentication** ได้ทันที!

### ขั้นตอนที่ 1: ตั้งค่าโปรเจกต์ Google Cloud
1. ติดตั้ง `gcloud CLI` ในเครื่องคอมพิวเตอร์ของคุณ
2. ทำการ Login ผ่าน Command Line:
   ```bash
   gcloud auth login
   ```
3. กำหนดสิทธิ์เพิ่มเติม (Application Default Credentials) เพื่อเชื่อมต่อกับโปรเจกต์จากสคริปต์โลคอล:
   ```bash
   gcloud auth application-default login
   ```
4. ตรวจสอบรหัสโปรเจกต์ปัจจุบันที่กำลังใช้งาน (Active Project ID):
   ```bash
   gcloud config get-value project
   ```
5. หากต้องการสลับหรือเปลี่ยนโปรเจกต์ให้ถูกต้อง ให้ใช้คำสั่ง:
   ```bash
   gcloud config set project ชื่อโปรเจกต์-gcp-ของคุณ
   ```
6. เปิดใช้งาน API ที่จำเป็นบน GCP Project ของคุณ:
   ```bash
   gcloud services enable artifactregistry.googleapis.com run.googleapis.com datastore.googleapis.com
   ```

### ขั้นตอนที่ 2: เตรียม Firestore in Datastore Mode

> [!IMPORTANT]
> **ข้อควรระวังสำคัญก่อนเริ่ม**: แต่ละโปรเจกต์ GCP สามารถเปิดใช้ Firestore ได้เพียงครั้งเดียวและเลือกได้เพียง 1 โหมดตลอดไป (Firestore Native Mode หรือ Datastore Mode) **ไม่สามารถเปลี่ยนโหมดได้ในภายหลัง** โปรเจกต์นี้ใช้ **Datastore Mode** เท่านั้น

#### วิธีที่ 1: ตั้งค่าผ่าน gcloud CLI (แนะนำ — เร็วและแม่นยำที่สุด)

```bash
# 1. ตรวจสอบว่า gcloud ชี้ไปที่โปรเจกต์ที่ถูกต้อง
gcloud config get-value project

# 2. เปิดใช้งาน Datastore API
gcloud services enable datastore.googleapis.com

# 3. สร้างฐานข้อมูล Datastore Mode ใน region ใกล้ไทย (Singapore)
#    --type=DATASTORE_MODE คือ flag สำคัญที่กำหนดโหมด
gcloud firestore databases create --location=asia-southeast1 --type=datastore-mode

# 4. ตรวจสอบว่าสร้างสำเร็จ — ควรเห็น type: DATASTORE_MODE และ locationId: asia-southeast1
gcloud firestore databases describe --database="(default)"
```

> [!TIP]
> ถ้ารัน `gcloud firestore databases create` แล้วได้ error ว่า `"already exists"` แสดงว่าโปรเจกต์นี้มี Firestore อยู่แล้ว ให้รัน `gcloud firestore databases describe --database="(default)"` เพื่อดูว่าเป็น Datastore Mode หรือ Native Mode

#### วิธีที่ 2: ตั้งค่าผ่าน GCP Console (สำหรับผู้ที่ชอบ UI)

1. ไปที่ [GCP Console](https://console.cloud.google.com/) แล้วค้นหา **"Firestore"** หรือ **"Datastore"** ในแถบค้นหา
2. สำหรับโปรเจกต์ใหม่ที่ยังไม่มีฐานข้อมูล ระบบจะแสดงหน้าเลือกโหมดทันที:
   - ✅ คลิกเลือก **"Firestore in Datastore mode"**
   - ❌ อย่าเลือก "Native mode" เด็ดขาด
3. เลือก **Location**: `asia-southeast1 (Singapore)` แล้วกด **Create Database**
4. รอประมาณ 1-2 นาที ฐานข้อมูลจะมีชื่อ ID เป็น `(default)` อัตโนมัติ

> [!CAUTION]
> **ปัญหาที่พบบ่อย**: หากเปิดหน้าสร้างแล้วมีช่องให้พิมพ์ **Database ID** และเกิด error ว่า *"Can only start with a lower case letter"* เมื่อพิมพ์ `(default)` — แสดงว่าโปรเจกต์นี้มี Firestore ถูกสร้างไปแล้วในโหมดอื่น **ไม่สามารถแก้ไขได้** ต้องสร้าง GCP Project ใหม่แล้วทำตั้งแต่ต้น

#### ขั้นตอนการตรวจสอบ (Verification)

หลังจากสร้าง Datastore แล้ว ให้ตรวจสอบการเชื่อมต่อก่อนทำขั้นตอนต่อไป:

```bash
# 1. ตรวจสอบว่า gcloud Auth พร้อมใช้งาน
gcloud auth application-default print-access-token

# 2. ทดสอบเชื่อมต่อ Datastore ด้วย Python (รันจาก root ของโปรเจกต์)
python scripts/test_datastore.py
```

> [!NOTE]
> ถ้าผลลัพธ์ขึ้น `"✅ เชื่อมต่อสำเร็จ"` แต่พบข้อมูล 0 รายการ — ถือว่าปกติ เพราะยังไม่ได้อัปโหลด Whitelist ซึ่งจะทำในขั้นตอนถัดไป

#### Troubleshooting ปัญหาที่พบบ่อย

| ปัญหา | สาเหตุ | วิธีแก้ไข |
|---|---|---|
| `UNAUTHENTICATED` | ยังไม่ได้ login | รัน `gcloud auth application-default login` |
| `Project not found` | project id ไม่ถูก | รัน `gcloud config set project YOUR_PROJECT_ID` |
| `PERMISSION_DENIED` | ไม่มีสิทธิ์ใช้ Datastore | ไปที่ IAM แล้วให้สิทธิ์ `Cloud Datastore User` กับ account ของคุณ |
| `Quota exceeded` | ใช้เกิน Free Tier | ตรวจสอบการใช้งานใน GCP Console → Billing |


### ขั้นตอนที่ 3: เพิ่มข้อมูล Whitelist ใน Datastore
มีวิธีการจัดการ 2 วิธี:
* **วิธีที่ 1 (แนะนำ - อัปโหลดอัตโนมัติ)**:
  รันสคริปต์อัปโหลดข้อมูลจากไฟล์ `whitelist.json` ในระบบโลคอลของคุณไปยัง Datastore ได้ทันทีด้วยคำสั่ง:
  ```bash
  python scripts/upload_whitelist.py
  ```
* **วิธีที่ 2 (ทำทีละคนด้วยตัวเอง)**:
  ไปที่ Datastore Console -> สร้าง Entity ภายใต้ Kind `whitelist_users` เพื่ออนุญาตรายบุคคล:
  * **Key identifier (Name/ID)**: ใส่อีเมลของผู้ใช้ (เช่น `somchai@gmail.com`)
  * **Properties**: 
    - `callsign` (ประเภท String): ชื่อสัญญาณเรียกขานที่จะแสดง (เช่น `เสี่ยสมชายสายเปย์`)

### ขั้นตอนที่ 4: ตั้งค่า Firebase Authentication
1. ไปที่ [Firebase Console](https://console.firebase.google.com/) แล้วสร้างโปรเจกต์ใหม่ (เลือกเชื่อมโยงเข้ากับโปรเจกต์ GCP เดิม)
2. ที่เมนูด้านซ้าย ให้คลิกที่หมวด **Security** แล้วเลือก **Authentication**

   > [!NOTE]
   > Firebase Console ได้อัปเดต UI ใหม่ เมนู **Build** เดิมถูกแทนที่ด้วยหมวดหมู่ย่อย ได้แก่ `Databases & Storage`, **`Security`**, `Hosting & Serverless` ฯลฯ — **Authentication อยู่ใต้ Security**

3. คลิก **Get Started** เพื่อเปิดใช้งาน Authentication
4. ไปที่แท็บ **Sign-in method** และเปิดใช้งานผู้ให้บริการล็อกอินด้วย **Google**
5. ลงทะเบียนแอปเว็บ (Web App) เพื่อรับค่า Firebase Web Config ไปป้อนเป็น Environment Variables ในภายหลัง:
   * `apiKey`
   * `authDomain`
   * `projectId`
   * `appId`

---

## 🚢 วิธีการ Deploy ขึ้น Google Cloud Run

เรามีสคริปต์อัตโนมัติเตรียมไว้ให้เรียบร้อยแล้ว:

1. เปิดไฟล์ `deploy.sh` (สำหรับ Linux/macOS) หรือ `deploy.ps1` (สำหรับ Windows PowerShell) และปรับแก้ตัวแปรตามความเหมาะสม:
   ```bash
   PROJECT_ID="ชื่อ-gcp-project-ของคุณ"
   REGION="asia-southeast1"
   SERVICE_NAME="gold-frame-generator"
   ```
2. รันคำสั่ง deploy:
   * **สำหรับ Bash (Linux/macOS)**:
     ```bash
     chmod +x deploy.sh
     ./deploy.sh
     ```
   * **สำหรับ PowerShell (Windows)**:
     ```powershell
     .\deploy.ps1
     ```

3. **การสลับจากระบบจำลอง (Mock Mode) เป็นระบบจริง (Production Mode)**:
   โดยค่าเริ่มต้น แอปพลิเคชันจะรันในโหมดจำลอง หากคุณต้องการเปิดใช้งานระบบ Firebase Auth และ Google Cloud Datastore ของจริง ให้ดำเนินการดังนี้:

   > [!IMPORTANT]
   > **การตั้งค่า Firebase Environment Variables**:
   > ให้เปิดไฟล์ [deploy.ps1](file:///D:/repositories/gold-frame-meme-generator/deploy.ps1) หรือ `deploy.sh` จากนั้นนำข้อมูล Firebase Web Config มาป้อนลงในตัวเลือก `--set-env-vars` ก่อนการ Deploy:
   > - `FIREBASE_API_KEY`
   > - `FIREBASE_AUTH_DOMAIN`
   > - `FIREBASE_PROJECT_ID`
   > - `FIREBASE_APP_ID`
   >
   > *(ระบบหลังบ้านจะตรวจจับว่าตัวแปรสภาพแวดล้อมเหล่านี้ถูกป้อนครบถ้วน แล้วจะเปลี่ยนโหมดจาก Mock เป็น Real Connection โดยอัตโนมัติ)*

   > [!IMPORTANT]
   > **การตั้งค่า IAM Permissions ให้กับ Cloud Run**:
   > ตัวแปรสภาพแวดล้อมที่รันแอปพลิเคชันบน Cloud Run (โดยปกติคือ Compute Engine default service account: `[PROJECT_NUMBER]-compute@developer.gserviceaccount.com`) จำเป็นต้องได้รับบทบาท **Cloud Datastore User** (`roles/datastore.user`) เพื่อให้ระบบสามารถคิวรี Whitelist ผู้ใช้จาก Datastore ได้:
   > ```bash
   > gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
   >     --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
   >     --role="roles/datastore.user"
   > ```

   > [!NOTE]
   > **การจัดการข้อมูลรายชื่อ Whitelist**:
   > เมื่อปิดโหมด Mock แล้ว ระบบจะไม่ดึงรายชื่อจาก `whitelist.json` ในเครื่องอีกต่อไป ให้ทำตาม **ขั้นตอนที่ 3: เพิ่มข้อมูล Whitelist ใน Datastore** (โดยใช้สคริปต์ `python scripts/upload_whitelist.py` หรือเข้าไปสร้าง Entity บน Console เองภายใต้ Kind `whitelist_users`) เพื่อเก็บสิทธิ์การเข้าใช้งานของผู้ใช้อย่างถาวร


## 🌐 การตั้งค่า Custom Domain (เช่น subdomain.domain.xx)

หลังจาก Deploy ไปที่ Google Cloud Run แล้ว หากคุณต้องการผูกโดเมนส่วนตัวของคุณ (เช่น `goldframe.yourdomain.com`) สามารถดำเนินการได้ 2 วิธีหลักๆ ดังนี้:

### วิธีที่ 1: การใช้ Cloud Run Domain Mapping (ง่ายที่สุด)
เป็นบริการฟรีของ Cloud Run ที่ใช้ Google Managed Certificate ในการออก SSL ให้อัตโนมัติ:

1. **ผ่าน GCP Console**:
   * ไปที่หน้า **Cloud Run** ใน Google Cloud Console
   * คลิกปุ่ม **Manage Custom Domains** (หรือคลิกที่บริการของคุณ -> แถบ Integrations -> ค้นหา Custom Domains)
   * คลิก **Add Mapping**
   * เลือก Service `gold-frame-generator` และเลือกภูมิภาค (Region) ที่ติดตั้งแอป
   * ในช่อง Domain ให้กรอกชื่อโดเมนย่อยที่คุณต้องการ เช่น `goldframe.yourdomain.com`
   * คลิก **Continue** ระบบจะแสดงตารางข้อมูล **DNS Records** (เช่น ชนิด CNAME และค่าที่ต้องชี้ไปยัง `ghs.googlehosted.com.`)

2. **ผ่าน gcloud CLI**:
   คุณสามารถสั่งผูกโดเมนได้ทันทีผ่าน Command Line:
   ```bash
   gcloud beta run domain-mappings create \
       --service=gold-frame-generator \
       --domain=subdomain.domain.xx \
       --region=asia-southeast1
   ```

3. **ตั้งค่าที่ Domain Registrar ของคุณ**:
   * เข้าไปยังผู้ให้บริการจดโดเมนของคุณ (เช่น Cloudflare, GoDaddy, Namecheap)
   * ไปที่ **DNS Management** และเพิ่ม Record ใหม่:
     * **Type**: `CNAME`
     * **Name (Host)**: `subdomain` (เช่น `goldframe`)
     * **Target (Value/Points to)**: `ghs.googlehosted.com.`
     * **TTL**: ตั้งค่าเป็น `Automatic` หรือ `3600`
   * ระบบ SSL Certificate จะใช้เวลาเตรียมการและเปิดใช้งานโดยอัตโนมัติภายใน 15-60 นาที

---

### วิธีที่ 2: การตั้งค่าผ่าน Firebase Hosting (แนะนำหากมีการใช้บริการ Firebase อื่นๆ อยู่แล้ว)
เนื่องจากโปรเจกต์นี้มี Firebase Project อยู่แล้ว การใช้ Firebase Hosting เป็น Proxy ไปยัง Cloud Run เป็นอีกหนึ่งวิธีที่เร็ว มีประสิทธิภาพ และตั้งค่าง่ายมาก:

1. ติดตั้ง Firebase CLI บนเครื่อง:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
2. เชื่อมโปรเจกต์ Firebase:
   ```bash
   firebase use --add
   ```
3. สร้างไฟล์ `firebase.json` ไว้ที่โฟลเดอร์ Root ของโปรเจกต์ เพื่อตั้งค่า Rewrite ไปหา Cloud Run:
   ```json
   {
     "hosting": {
       "public": "app/static",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ],
       "rewrites": [
         {
           "source": "/api/**",
           "run": {
             "serviceId": "gold-frame-generator",
             "region": "asia-southeast1"
           }
         },
         {
           "source": "/frame_template/**",
           "run": {
             "serviceId": "gold-frame-generator",
             "region": "asia-southeast1"
           }
         },
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```
4. Deploy ขึ้น Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```
5. เชื่อมต่อ Custom Domain ในหน้า **Firebase Console** -> **Hosting** -> กด **Add Custom Domain** และดำเนินการตามขั้นตอนการยืนยันความเป็นเจ้าของและชี้ DNS ที่ระบุไว้บนหน้าจอ

---

## 🖼️ การจัดการเทมเพลตกรอบทอง (Frame Templates)

ระบบรองรับกรอบทองหลายรูปแบบ โดยสแกนจากโฟลเดอร์ [frame_template/](file:///d:/repositories/gold-frame-meme-generator/frame_template) ที่ root ของโปรเจกต์โดยอัตโนมัติ:
1. **การเพิ่มกรอบใหม่**: นำไฟล์รูปภาพกรอบทอง (แนะนำเป็นไฟล์ PNG ที่มีพื้นที่ตรงกลางสำหรับใส่รูปภาพเป็นสีดำสนิท เนื่องจากระบบมีฟังก์ชันฟิลเตอร์เปลี่ยนพิกเซลสีดำเป็นโปร่งแสงให้โดยอัตโนมัติ) มาวางไว้ในโฟลเดอร์ `frame_template/`
2. **การตั้งชื่อไฟล์**: ตั้งชื่อไฟล์ภาพในรูปแบบงูเลื้อยหรือมีขีด (เช่น `gold_frame_diamond.png` หรือ `gold_frame_luxury.png`) ระบบหน้าบ้านจะดึงชื่อมาจัดรูปแบบเป็นปุ่มกดให้สวยงามบน UI อัตโนมัติ (เช่น `Gold Frame Diamond` และ `Gold Frame Luxury`)
3. **การระบุเครดิต/ลิขสิทธิ์รูปภาพ**: บันทึกข้อมูลที่มาของไฟล์รูปภาพที่นำมาใช้ลงในไฟล์ [`app/static/attribution.json`](file:///d:/repositories/gold-frame-meme-generator/app/static/attribution.json) โดยระบุรูปแบบ JSON Array ของออบเจกต์ ซึ่งมีฟิลด์ดังนี้:
   - `title`: ชื่อเรียกของรูปภาพเทมเพลต (จำเป็นต้องระบุ)
   - `author`: ชื่อเจ้าของผลงาน/ผู้สร้างสรรค์รูปภาพ (ไม่บังคับ)
   - `license`: สัญญาอนุญาตลิขสิทธิ์ (ไม่บังคับ)
   - `source`: ลิงก์เชื่อมโยงไปยังเว็บไซต์ต้นทางของรูปภาพนั้น (ไม่บังคับ)
   *(หมายเหตุ: หากรูปภาพใดเปิดให้ใช้ฟรีและไม่จำเป็นต้องอ้างอิงลิขสิทธิ์/แหล่งที่มาตามเงื่อนไขสัญญาอนุญาต คุณไม่จำเป็นต้องสร้างเรคคอร์ดของรูปนั้นๆ ในไฟล์ `attribution.json` ก็ได้ ระบบจะข้ามการแสดงผลโดยไม่เกิดข้อผิดพลาด)*

---

## 🤫 กฎการพัฒนาเพิ่มเติม (Persona & Tone of Voice)
* หน้าความจนขัดข้อง (เมื่อผู้ใช้ไม่อยู่ใน Whitelist) ต้องใช้โทนภาษาประชดประชันความรวย เช่น *"สัญญาณของคุณถูกรบกวนโดยความจน กรุณากลับไปสะสมแต้มบุญกับท่านเจ้าคุณใหม่"*
* ห้ามมีการอัปโหลดรูปภาพเข้าสู่ฝั่ง Backend เด็ดขาด ให้จัดการผ่าน Canvas เสมอ!

