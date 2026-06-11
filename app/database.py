import os
from datetime import datetime, timedelta
from collections import Counter
from google.cloud import datastore

# Check if we should use mock database (no credentials and not in GCP environment)
# If local dev doesn't have credentials, we use mock db so it works instantly.
IS_GCP = os.environ.get("K_SERVICE") is not None or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") is not None
USE_MOCK_DB = not IS_GCP

# Pre-populated mock data for testing/fallback
mock_whitelist = {
    "test@example.com": "เสี่ยดม",
    "admin@goldframe.com": "ผู้กองยอดรัก",
    "wongnaret@gmail.com": "เสี่ยสั่งเลี่ยม",
    "visitor@gmail.com": "เจ๊หวังเลี่ยมทอง"
}

# In-memory logs mock
mock_logs = [
    # Seed some mock logs for analytics preview
    {"callsign": "เสี่ยดม", "timestamp": datetime.utcnow() - timedelta(hours=2)},
    {"callsign": "เสี่ยดม", "timestamp": datetime.utcnow() - timedelta(days=2)},
    {"callsign": "เจ๊หวังเลี่ยมทอง", "timestamp": datetime.utcnow() - timedelta(hours=5)},
    {"callsign": "เจ๊หวังเลี่ยมทอง", "timestamp": datetime.utcnow() - timedelta(days=8)},
    {"callsign": "ผู้กองยอดรัก", "timestamp": datetime.utcnow() - timedelta(days=15)},
    {"callsign": "เสี่ยสั่งเลี่ยม", "timestamp": datetime.utcnow() - timedelta(days=20)},
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
                    'timestamp': datetime.utcnow()
                })
                self.client.put(entity)
                return
            except Exception as e:
                print(f"Error writing to Datastore (log_generation): {e}")

        # Fallback/Mock
        mock_logs.append({
            'callsign': callsign,
            'timestamp': datetime.utcnow()
        })

    def get_stats(self):
        """
        Query generation logs and aggregate counts by callsign for:
        - Daily (Today, timezone-naive UTC)
        - 7 Days
        - 30 Days
        - All Time (Capped at last 5000 logs to prevent memory overflow)
        """
        now = datetime.utcnow()
        start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_7d = now - timedelta(days=7)
        start_30d = now - timedelta(days=30)

        logs = []

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
            except Exception as e:
                print(f"Error fetching stats from Datastore: {e}")
        
        if not self.client or not logs:
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
