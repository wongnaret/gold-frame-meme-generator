"""
ทดสอบการเชื่อมต่อ Google Cloud Datastore (Firestore in Datastore Mode)
รันจาก root ของโปรเจกต์:
    python scripts/test_datastore.py
"""

from google.cloud import datastore


def test_connection():
    print("=" * 50)
    print("🔍 ทดสอบการเชื่อมต่อ Google Cloud Datastore")
    print("=" * 50)

    # 1. เชื่อมต่อ
    try:
        client = datastore.Client()
        print(f"✅ เชื่อมต่อสำเร็จ! Project: {client.project}")
    except Exception as e:
        print(f"❌ เชื่อมต่อไม่ได้: {e}")
        print()
        print("💡 วิธีแก้:")
        print("   1. รัน: gcloud auth application-default login")
        print("   2. รัน: gcloud config set project YOUR_PROJECT_ID")
        print("   3. ตรวจสอบว่าเปิด datastore.googleapis.com แล้ว")
        return

    # 2. ทดสอบ Query whitelist_users
    print()
    print("📋 ตรวจสอบข้อมูล whitelist_users...")
    try:
        query = client.query(kind="whitelist_users")
        results = list(query.fetch(limit=5))
        if results:
            print(f"✅ พบข้อมูล {len(results)} รายการ (แสดง {min(len(results), 5)} รายการแรก):")
            for entity in results:
                email = entity.key.name
                callsign = entity.get("callsign", "(ไม่มีชื่อ)")
                print(f"   • {email} → {callsign}")
        else:
            print("⚠️  ไม่พบข้อมูลใน whitelist_users (ยังไม่ได้อัปโหลด)")
            print("   รัน: python scripts/upload_whitelist.py")
    except Exception as e:
        print(f"❌ Query whitelist_users ล้มเหลว: {e}")

    # 3. ทดสอบ Query generation_logs
    print()
    print("📊 ตรวจสอบข้อมูล generation_logs...")
    try:
        query = client.query(kind="generation_logs")
        results = list(query.fetch(limit=3))
        print(f"✅ พบ generation_logs: {len(results)} รายการ (แสดง 3 ล่าสุด)")
        for entity in results:
            callsign = entity.get("callsign", "?")
            ts = entity.get("timestamp", "?")
            print(f"   • {callsign} @ {ts}")
    except Exception as e:
        print(f"❌ Query generation_logs ล้มเหลว: {e}")

    print()
    print("=" * 50)
    print("🎉 ทดสอบเสร็จสิ้น")
    print("=" * 50)


if __name__ == "__main__":
    test_connection()
