from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
import random
import math
from datetime import datetime, timedelta
from .anomaly_detection.network_analyzer import NetworkTrafficAnalyzer
from .threat_intelligence.threat_analyzer import ThreatAnalyzer


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

network_analyzer = NetworkTrafficAnalyzer()
threat_analyzer = ThreatAnalyzer()

class SecurityState:
    def __init__(self):
        self.base_threat_level = 30
        self.threat_variation = 0
        self.anomaly_baseline = 25
        self.connected_clients = set()

    def update_threat_level(self):
        self.threat_variation += random.uniform(-5, 5)
        self.threat_variation = max(-15, min(40, self.threat_variation))
        return max(0, min(100, self.base_threat_level + self.threat_variation))
    
security_state = SecurityState()

async def generate_dynamic_data():
    current_time = datetime.now()

    anomalies=[]
    for i in range(6):
        time = (current_time - timedelta(hours=5-i)).strftime("%H:%M")
        base_count =  security_state.anomaly_baseline
        time_factor = math.sin(i* math.pi/3)
        random_factor = random.uniform(-5,5)
        count = max(0, base_count + time_factor *10 + random_factor)
        anomalies.append({"time":time, "count":count})

    threats =[]
    for threat_type in ["Malware", "DDos", "Phishing", "Intrusion"]:
        base_count = random.randint(15, 35)
        variation = random.uniform(-5, 5)
        threats.append({
            "category":threat_type,
            "count":round(max(0, base_count + variation))
        })

    return {
        "anomalies":anomalies,
        "threats":threats,
        "threat_level":round(security_state.update_threat_level())
    }


@app.websocket("/ws/security_feed")
async def security_feed_websocket(websocket: WebSocket):
    await websocket.accept()
    security_state.connected_clients.add(websocket)

    try:
        while True:
            data = await generate_dynamic_data()
            await websocket.send_json(data)
            await asyncio.sleep(2)
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        security_state.connected_clients.remove(websocket)
        await websocket.close()

@app.get("/api/security/summary")
async def get_security_summary():
    data = await generate_dynamic_data()

    return {
        "threat_level": data["threat_level"],
        "active_threats": sum(threat["count"] for threat in data["threats"]),
        "network_status": "Protected",
        "last_updated": datetime.now().isoformat()
    }

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


