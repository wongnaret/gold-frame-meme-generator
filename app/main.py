from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from app.auth import verify_firebase_token
from app.database import db_manager

app = FastAPI(
    title="Gold Frame Generator API",
    description="ระบบเบื้องหลังการเลี่ยมกรอบทองคำแท้ (ปลอม) สตรีท กวนประสาท",
    version="1.0.0"
)

# CORS configuration to allow local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware to disable caching on API endpoints
@app.middleware("http")
async def add_no_cache_headers(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/api"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

@app.get("/api/config")
def get_client_config():
    """
    Expose Firebase client configuration from environment variables.
    Falls back to mock mode if credentials are not set or USE_MOCK_DB is True.
    """
    import os
    from app.database import USE_MOCK_DB
    
    if not USE_MOCK_DB:
        api_key = os.environ.get("FIREBASE_API_KEY")
        auth_domain = os.environ.get("FIREBASE_AUTH_DOMAIN")
        project_id = os.environ.get("FIREBASE_PROJECT_ID")
        app_id = os.environ.get("FIREBASE_APP_ID")
        
        if api_key and auth_domain and project_id:
            return {
                "isMock": False,
                "config": {
                    "apiKey": api_key,
                    "authDomain": auth_domain,
                    "projectId": project_id,
                    "appId": app_id
                }
            }
            
    return {
        "isMock": True,
        "message": "รันในโหมดจำลอง (Mock Mode) เนื่องจากตั้งค่า USE_MOCK_DB เป็น True หรือไม่ได้ตั้งค่า Env Vars"
    }


@app.get("/api/auth/check")
def check_auth(decoded_token: dict = Depends(verify_firebase_token)):
    """
    Check if the authenticated user's email is whitelisted.
    Returns the callsign if approved, otherwise raises 403 Forbidden.
    """
    email = decoded_token.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ไม่พบ Email ในข้อมูลความรวยของคุณ"
        )
    
    callsign = db_manager.get_callsign(email)
    if not callsign:
        # Sarcastic, playful Thai responses for non-whitelisted users
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ขออภัย สัญญาณเรียกขานของคุณยังไม่ได้รับการอนุมัติ... บารมียังไม่ถึงขั้น โปรดติดต่อแอดมินเพื่อขอสิทธิ์เลี่ยมทอง"
        )
    
    return {
        "status": "success",
        "email": email,
        "callsign": callsign
    }

@app.post("/api/logs/generate")
def log_generation(decoded_token: dict = Depends(verify_firebase_token)):
    """
    Log a meme generation event under the user's callsign.
    """
    email = decoded_token.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ไม่พบ Email ในข้อมูล"
        )
        
    callsign = db_manager.get_callsign(email)
    if not callsign:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="QRU 73! สัญญาณของคุณถูกรบกวนโดยความจน กรุณากลับไปสะสมแต้มบุญกับท่านเจ้าคุณใหม่"
        )
        
    db_manager.log_generation(callsign)
    return {
        "status": "success",
        "message": f"เลี่ยมทองสำเร็จเรียบร้อยสำหรับสัญญาณเรียกขาน {callsign}!"
    }

@app.get("/api/stats")
def get_stats():
    """
    Fetch all aggregated leaderboard stats (Hall of Frame).
    Publicly accessible.
    """
    try:
        stats = db_manager.get_stats()
        return stats
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"เกิดข้อผิดพลาดทางเทคนิค (ความรวยขัดข้อง): {str(e)}"}
        )

# API to list available frame templates
@app.get("/api/templates")
def list_templates():
    """
    List all available template image filenames in the frame_template directory.
    """
    import os
    template_dir = "frame_template"
    if not os.path.exists(template_dir):
        return []
    
    valid_extensions = {".png", ".jpg", ".jpeg", ".webp"}
    templates = []
    try:
        for file in os.listdir(template_dir):
            if os.path.splitext(file)[1].lower() in valid_extensions:
                templates.append(file)
    except Exception as e:
        print(f"Error listing templates: {e}")
        
    return sorted(templates)

# Mount static files for frame templates first
app.mount("/frame_template", StaticFiles(directory="frame_template"), name="frame_templates")

# Mount static files at the root
# Note: FastAPI matches routes in order of declaration, so /api/... will be resolved first.
# Any other routes will fall through to the static files directory.
app.mount("/", StaticFiles(directory="app/static", html=True), name="static")

