import os
import firebase_admin
from firebase_admin import auth
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Initialize Firebase Admin SDK
try:
    firebase_admin.get_app()
except ValueError:
    # On Cloud Run, it will automatically use Application Default Credentials.
    # We can also configure a project ID via env variables if needed.
    firebase_project_id = os.environ.get("FIREBASE_PROJECT_ID")
    if firebase_project_id:
        firebase_admin.initialize_app(options={'projectId': firebase_project_id})
    else:
        firebase_admin.initialize_app()

# Check if we should use mock database/auth (no credentials and not in GCP environment)
IS_GCP = os.environ.get("K_SERVICE") is not None or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") is not None
USE_MOCK_DB = not IS_GCP

security = HTTPBearer()

def verify_firebase_token(authorization: HTTPAuthorizationCredentials = Security(security)):
    token = authorization.credentials
    
    # For local development bypass if Firebase is not yet configured
    if USE_MOCK_DB and token.startswith("mock-token-"):
        email = token.replace("mock-token-", "")
        # Return a decoded token shape containing email
        return {"email": email}

    try:
        # verify_id_token checks signature, expiration, and project audience
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        # Playful sarcastic tone if authentication fails
        raise HTTPException(
            status_code=401,
            detail=f"QRU 73! สัญญาณของคุณถูกรบกวนโดยความจน หรือ Token หมดอายุ: {str(e)}"
        )
