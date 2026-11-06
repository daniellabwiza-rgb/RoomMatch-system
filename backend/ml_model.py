import pandas as pd
import numpy as np
from kmodes.kmodes import KModes

class RoommateMatcher:
    def __init__(self, n_clusters=4):
        self.n_clusters = n_clusters
        self.kmodes_model = KModes(n_clusters=self.n_clusters, init='Cao', n_init=5, random_state=42)
        
        # Categorical features used for K-Modes clustering
        self.categorical_features = [
            'sleeping_schedule', 'wakeup_schedule', 'cleanliness', 
            'study_habits', 'noise_tolerance', 'social_preference', 
            'guest_preference', 'smoking_preference', 'pet_preference', 
            'cooking_habits', 'room_environment'
        ]
        
        # Weighted scoring factors (totaling 100%)
        self.weights = {
            'sleeping_schedule': 0.15,
            'cleanliness': 0.20,
            'study_habits': 0.15,
            'noise_tolerance': 0.15,
            'guest_preference': 0.10,
            'smoking_preference': 0.10,
            'pet_preference': 0.05,
            'room_environment': 0.10
        }

    def train_clusters(self, data_list):
        """Trains the K-Modes model on a list of student lifestyle dictionaries."""
        if not data_list or len(data_list) < self.n_clusters:
            return {"status": "error", "message": "Not enough student records to train clusters."}
        
        df = pd.DataFrame(data_list)
        X = df[self.categorical_features].astype(str)
        
        # Fit K-Modes clustering
        clusters = self.kmodes_model.fit_predict(X)
        df['cluster_id'] = clusters
        
        return {
            "status": "success",
            "total_records": len(df),
            "num_clusters": self.n_clusters,
            "trained": True
        }

    def calculate_compatibility(self, student, candidate):
        """Calculates a weighted compatibility score percentage and plain-language explanation."""
        score = 0.0
        matches = []
        differences = []

        for feature, weight in self.weights.items():
            val1 = student.get(feature)
            val2 = candidate.get(feature)
            
            if val1 and val2:
                if val1 == val2:
                    score += weight * 100.0
                    matches.append(feature.replace('_', ' '))
                elif self._is_close_match(feature, val1, val2):
                    score += weight * 50.0  # Partial credit for compatible habits

        score = round(max(0.0, min(100.0, score)), 1)
        
        # Determine category
        if score >= 85:
            category = "Very high compatibility"
        elif score >= 70:
            category = "High compatibility"
        elif score >= 50:
            category = "Moderate compatibility"
        else:
            category = "Low compatibility"

        # Generate explanation
        explanation = f"Both students share similar preferences in {', '.join(matches[:2])}." if matches else "Different daily routines, but compatible accommodation needs."

        return {
            "compatibility_score": score,
            "compatibility_category": category,
            "explanation": explanation
        }

    def _is_close_match(self, feature, val1, val2):
        """Allows partial scoring for adjacent preferences (e.g., moderate clean vs very clean)."""
        compatible_pairs = [
            ('moderately clean', 'very clean'),
            ('moderately clean', 'relaxed'),
            ('quiet environment', 'flexible'),
            ('moderate', 'low'),
            ('moderate', 'high')
        ]
        return (val1, val2) in compatible_pairs or (val2, val1) in compatible_pairs