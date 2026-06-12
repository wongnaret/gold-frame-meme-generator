import os
import json
from google.cloud import datastore

def upload_whitelist():
    """
    Reads whitelist.json and uploads all users as 'whitelist_users' entities in GCP Datastore.
    """
    # Initialize Datastore Client
    try:
        client = datastore.Client()
        print(f"🌟 เชื่อมต่อ Datastore บนโปรเจกต์: {client.project}")
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Datastore: {e}")
        print("💡 วิธีแก้: ตรวจสอบให้แน่ใจว่าคุณได้รันคำสั่ง 'gcloud auth application-default login' หรือตั้งค่าตัวแปร GOOGLE_APPLICATION_CREDENTIALS แล้ว")
        return

    whitelist_file = "whitelist.json"
    if not os.path.exists(whitelist_file):
        print(f"❌ ไม่พบไฟล์ {whitelist_file} ที่ root ของโปรเจกต์")
        return

    try:
        with open(whitelist_file, "r", encoding="utf-8") as f:
            users = json.load(f)
    except Exception as e:
        print(f"❌ ไม่สามารถอ่านไฟล์ JSON ได้: {e}")
        return

    print(f"📦 ตรวจพบรายชื่อผู้ใช้ทั้งหมด {len(users)} รายการ ใน {whitelist_file}")
    print("⏳ กำลังเริ่มการอัปโหลดข้อมูลเข้า GCP Datastore...")

    try:
        # Upload in batch to make it fast and atomic
        batch = client.batch()
        batch.begin()
        
        for email, callsign in users.items():
            email_normalized = email.lower().strip()
            key = client.key('whitelist_users', email_normalized)
            entity = datastore.Entity(key=key)
            entity.update({
                'callsign': callsign
            })
            batch.put(entity)
            print(f"  + เตรียมส่ง: {email_normalized} ➔ {callsign}")
            
        batch.commit()
        print("\n🎉 [SUCCESS] อัปโหลดข้อมูล Whitelist ทั้งหมดขึ้น GCP Datastore เรียบร้อยแล้ว!")
    except Exception as e:
        print(f"\n❌ เกิดข้อผิดพลาดในการบันทึกข้อมูลแบบ Batch: {e}")

if __name__ == "__main__":
    upload_whitelist()
