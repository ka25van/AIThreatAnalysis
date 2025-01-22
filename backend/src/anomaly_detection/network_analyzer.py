import numpy as np
import logging
from sklearn.ensemble import IsolationForest
from datetime import datetime


class NetworkTrafficAnalyzer:
    def __init__(self, contamination = 0.1):
        self.model = IsolationForest(contamination = contamination, random_state=42)
        self.logger = logging.getLogger(__name__)
    
    def prepare_features(self, traffic_data):
        features=[]
        for entry in traffic_data:
            feature_vector=[
                entry['bytes_sent'],
                entry['bytes_received'],
                entry['packets_sent'],
                entry['packets_received'],
                entry['duration'],
                self._encode_time(entry['timestamp'])
            ]
            features.append(feature_vector)
        return np.array(features)
    
    def train(self, traffic_data):
        features = self.prepare_features(traffic_data)
        self.model.fit(features)
        self.logger.info("Model trained successfully on %d samples", len(features))

    def detect_anomalies(self, traffic_data):
        features = self.prepare_features(traffic_data)
        predictions = self.model.predict(features)
        anomalies = [pred == -1 for pred in predictions]
        
        self.logger.info("Detected %d anomalies in %d samples",
                        sum(anomalies), len(anomalies))
        return anomalies


