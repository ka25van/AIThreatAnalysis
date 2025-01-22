import pandas as pd
import logging
from datetime import datetime
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM, Dropout

class ThreatAnalyzer:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.threat_patterns = {}
        self.model = self._build_model()
        
    def _build_model(self):
        model = Sequential([
            LSTM(64, input_shape=(None, 5), return_sequences=True),
            Dropout(0.2),
            LSTM(32),
            Dense(16, activation='relu'),
            Dense(1, activation='sigmoid')
        ])
        
        model.compile(optimizer='adam',
                     loss='binary_crossentropy',
                     metrics=['accuracy'])
        return model
    
    def analyze_threat(self, ip_address, traffic_pattern, known_threats):
        threat_score = 0.0
        
        if ip_address in known_threats:
            threat_score += 0.5
            self.logger.warning(f"IP {ip_address} found in known threats")
            
        pattern_score = self._analyze_pattern(traffic_pattern)
        threat_score += pattern_score
        
        return {
            'ip_address': ip_address,
            'threat_score': min(threat_score, 1.0),
            'timestamp': datetime.now(),
            'confidence': self._calculate_confidence(pattern_score)
        }
    
    def _analyze_pattern(self, pattern):
        features = self._extract_features(pattern)
        prediction = self.model.predict(features)
        return float(prediction[0][0])
    
    def _extract_features(self, pattern):
        return pd.DataFrame([pattern]).values.reshape(1, 1, 5)
    
    def _calculate_confidence(self, pattern_score):
        return min(pattern_score * 100, 100)