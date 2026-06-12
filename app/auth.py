import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

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
_firebase_configured = os.environ.get("FIREBASE_PROJECT_ID") is not None and os.environ.get("FIREBASE_API_KEY") is not None
_force_mock = os.environ.get("USE_MOCK_DB", "").lower() in ("1", "true", "yes")
USE_MOCK_DB = _force_mock or not _firebase_configured


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
