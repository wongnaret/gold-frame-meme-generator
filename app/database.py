import os
import json
from datetime import datetime, timedelta, timezone
from collections import Counter
from google.cloud import datastore

# Try to detect if we're running in GCP or have valid credentials (including ADC from gcloud)
# Priority: K_SERVICE (Cloud Run) > GOOGLE_APPLICATION_CREDENTIALS > ADC (gcloud auth application-default login)
# If FIREBASE_PROJECT_ID is set, we assume the user wants to use real GCP and will try to connect.
_firebase_configured = os.environ.get("FIREBASE_PROJECT_ID") is not None and os.environ.get("FIREBASE_API_KEY") is not None
_is_local = os.environ.get("K_SERVICE") is None

# Default to Mock DB on local dev environment unless USE_MOCK_DB is explicitly configured
_force_mock_val = os.environ.get("USE_MOCK_DB")
if _force_mock_val is not None:
    USE_MOCK_DB = _force_mock_val.lower() in ("1", "true", "yes")
else:
    USE_MOCK_DB = _is_local or not _firebase_configured




# Pre-populated mock data for testing/fallback
mock_whitelist = {
    "test@example.com": "เสี่ยดม",
    "admin@goldframe.com": "ผู้กองยอดรัก",
    "wongnaret@gmail.com": "เสี่ยสั่งเลี่ยม",
    "visitor@gmail.com": "เจ๊หวังเลี่ยมทอง"
}

# Load whitelist.json only when running in Mock Mode (no real Datastore connection)
if USE_MOCK_DB:
    whitelist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "whitelist.json")
    if os.path.exists(whitelist_path):
        try:
            with open(whitelist_path, "r", encoding="utf-8") as f:
                custom_whitelist = json.load(f)
                if isinstance(custom_whitelist, dict):
                    mock_whitelist.update({k.lower(): v for k, v in custom_whitelist.items()})
                    print(f"[INFO] Mock Mode: Loaded whitelist from {whitelist_path}")
        except Exception as e:
            print(f"[WARNING] Failed to load whitelist.json: {e}")



# In-memory logs mock
_now = datetime.now(timezone.utc)
mock_logs = [
    # Seed some mock logs for analytics preview
    {"callsign": "เสี่ยดม", "timestamp": _now - timedelta(hours=2)},
    {"callsign": "เสี่ยดม", "timestamp": _now - timedelta(days=2)},
    {"callsign": "เจ๊หวังเลี่ยมทอง", "timestamp": _now - timedelta(hours=5)},
    {"callsign": "เจ๊หวังเลี่ยมทอง", "timestamp": _now - timedelta(days=8)},
    {"callsign": "ผู้กองยอดรัก", "timestamp": _now - timedelta(days=15)},
    {"callsign": "เสี่ยสั่งเลี่ยม", "timestamp": _now - timedelta(days=20)},
]

class DatastoreManager:
    def __init__(self):
        self.client = None
        if not USE_MOCK_DB:
            try:
                # Firestore Datastore mode client
                self.client = datastore.Client()
                print("[INFO] Connected to Google Cloud Datastore.")
            except Exception as e:
                print(f"[WARNING] Failed to connect to Datastore: {e}. Falling back to Mock Database.")
                self.client = None
        else:
            print("[INFO] Running with Mock Database (Local Dev Mode).")

    def get_callsign(self, email: str) -> str | None:
        """Lookup email in whitelist_users kind and return callsign."""
        if self.client:
            try:
                key = self.client.key('whitelist_users', email)
                entity = self.client.get(key)
                if entity:
                    return entity.get('callsign')
                return None
            except Exception as e:
                print(f"Error querying Datastore (get_callsign): {e}")
        
        # Fallback/Mock
        return mock_whitelist.get(email.lower())

    def log_generation(self, callsign: str):
        """Log a meme generation event."""
        if self.client:
            try:
                key = self.client.key('generation_logs')
                entity = datastore.Entity(key=key)
                entity.update({
                    'callsign': callsign,
                    'timestamp': datetime.now(timezone.utc)
                })
                self.client.put(entity)
                return
            except Exception as e:
                print(f"Error writing to Datastore (log_generation): {e}")

        # Fallback/Mock
        mock_logs.append({
            'callsign': callsign,
            'timestamp': datetime.now(timezone.utc)
        })

    def get_stats(self):
        """
        Query generation logs and aggregate counts by callsign for:
        - Daily (Today, timezone-naive UTC)
        - 7 Days
        - 30 Days
        - All Time (Capped at last 5000 logs to prevent memory overflow)
        """
        now = datetime.now(timezone.utc)
        start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_7d = now - timedelta(days=7)
        start_30d = now - timedelta(days=30)

        logs = []
        query_success = False

        if self.client:
            try:
                # Query all-time logs up to a safe limit
                query = self.client.query(kind='generation_logs')
                query.order = ['-timestamp']
                # Limit to latest 5000 generation logs to remain thin and fast
                logs_entities = list(query.fetch(limit=5000))
                
                for entity in logs_entities:
                    timestamp = entity.get('timestamp')
                    # Convert to datetime if it's not (Datastore datetime properties are returned as datetime objects)
                    if isinstance(timestamp, datetime):
                        logs.append({
                            'callsign': entity.get('callsign'),
                            'timestamp': timestamp
                        })
                query_success = True
            except Exception as e:
                print(f"Error fetching stats from Datastore: {e}")
        
        if not query_success:
            # Fallback to mock logs
            logs = mock_logs

        # Aggregate counts
        stats = {
            "daily": self._aggregate(logs, lambda l: l['timestamp'] >= start_today),
            "weekly": self._aggregate(logs, lambda l: l['timestamp'] >= start_7d),
            "monthly": self._aggregate(logs, lambda l: l['timestamp'] >= start_30d),
            "all_time": self._aggregate(logs, lambda l: True)
        }
        return stats

    def _aggregate(self, logs, filter_fn):
        """Helper to filter and aggregate log counts."""
        counter = Counter(log['callsign'] for log in logs if filter_fn(log))
        # Convert to list of dicts, sorted by count descending
        sorted_stats = [{"callsign": callsign, "count": count} for callsign, count in counter.most_common()]
        return sorted_stats

db_manager = DatastoreManager()
