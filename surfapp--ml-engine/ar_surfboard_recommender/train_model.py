"""
Advanced ML Model Training for AR Surfboard Recommendation
This script builds a high-accuracy regression model to predict ideal surfing configurations
based on real-world doctorate research data from Kaggle.

Target Accuracy: >90%
Uses advanced ensemble techniques and cross-validation for maximum accuracy
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, VotingRegressor
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import joblib
import json
import os
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class SurfboardRecommenderModel:
    """
    Multi-output regression model to predict:
    1. Board Length
    2. Board Volume  
    3. Ideal Wave Height
    Based on surfer's physical attributes and skill level
    """
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_names = []
        self.target_names = ['board_length', 'board_volume', 'wave_height_mean']
        self.metrics = {}
        
    def load_and_prepare_data(self, csv_path):
        """Load and prepare the surfing dataset"""
        print("📊 Loading dataset...")
        df = pd.read_csv(csv_path)
        print(f"✅ Loaded {len(df)} records with {len(df.columns)} features")
        
        # NOTE: In the original dataset:
        # - board_length is in METERS (1 meter = 3.28084 feet)
        # - surfer_height is in METERS (need to convert to cm)
        # - surfer_weight is in kg
        # - wave_height_mean is in feet
        
        # Convert height from meters to cm for better feature engineering
        df['surfer_height_cm'] = df['surfer_height'] * 100
        
        # Select relevant features and targets
        feature_columns = [
            'surfer_height_cm',   # in cm (converted)
            'surfer_weight',      # in kg
            'surfer_age',         
            'surfer_experience',  
            'surfer_gender'       
        ]
        
        # Target Variables (will keep in original units internally)
        target_columns = self.target_names
        
        # Create a clean dataset
        print("\n🧹 Cleaning data...")
        df_clean = df[feature_columns + target_columns].copy()
        
        # Remove rows with missing values in critical columns
        critical_cols = ['surfer_height_cm', 'surfer_weight', 'board_length']
        df_clean = df_clean.dropna(subset=critical_cols)
        
        # For missing board volumes, use intelligent imputation based on similar boards
        df_clean = df_clean.copy()
        if df_clean['board_volume'].isnull().any():
            for idx in df_clean[df_clean['board_volume'].isnull()].index:
                # Find similar boards (within ±10cm length)
                board_len = df_clean.loc[idx, 'board_length']
                similar_boards = df_clean[
                    (df_clean['board_length'].between(board_len - 0.1, board_len + 0.1)) & 
                    df_clean['board_volume'].notna()
                ]['board_volume']
                
                if len(similar_boards) > 0:
                    df_clean.loc[idx, 'board_volume'] = similar_boards.median()
                else:
                    # Use overall median as fallback
                    df_clean.loc[idx, 'board_volume'] = df_clean['board_volume'].median()
        
        # Fill wave height missing values
        df_clean.loc[df_clean['wave_height_mean'].isnull(), 'wave_height_mean'] = df_clean['wave_height_mean'].median()
        
        # Fill categorical missing values
        df_clean.loc[df_clean['surfer_experience'].isnull(), 'surfer_experience'] = 'Beginner'
        df_clean.loc[df_clean['surfer_gender'].isnull(), 'surfer_gender'] = 'Male'
        df_clean.loc[df_clean['surfer_age'].isnull(), 'surfer_age'] = df_clean['surfer_age'].median()
        
        print(f"✅ Clean dataset: {len(df_clean)} records")
        print(f"📊 Features: {feature_columns}")
        print(f"🎯 Targets: {target_columns}")
        
        # Show data ranges
        print(f"\n📏 Data Ranges:")
        print(f"  Board Length: {df_clean['board_length'].min():.2f}m - {df_clean['board_length'].max():.2f}m ({df_clean['board_length'].min()*3.28084:.1f}ft - {df_clean['board_length'].max()*3.28084:.1f}ft)")
        print(f"  Board Volume: {df_clean['board_volume'].min():.1f}L - {df_clean['board_volume'].max():.1f}L")
        print(f"  Wave Height: {df_clean['wave_height_mean'].min():.1f}ft - {df_clean['wave_height_mean'].max():.1f}ft")
        print(f"  Surfer Height: {df_clean['surfer_height_cm'].min():.0f}cm - {df_clean['surfer_height_cm'].max():.0f}cm")
        print(f"  Surfer Weight: {df_clean['surfer_weight'].min():.0f}kg - {df_clean['surfer_weight'].max():.0f}kg")
        
        return df_clean, feature_columns, target_columns
    
    def encode_categorical_features(self, df, feature_columns):
        """Encode categorical variables"""
        print("\n🔢 Encoding categorical features...")
        df_encoded = df.copy()
        
        categorical_cols = ['surfer_experience', 'surfer_gender']
        
        for col in categorical_cols:
            if col in feature_columns:
                le = LabelEncoder()
                df_encoded[col] = le.fit_transform(df_encoded[col].astype(str))
                self.label_encoders[col] = le
                print(f"  {col}: {list(le.classes_)}")
        
        return df_encoded
    
    def feature_engineering(self, df):
        """Create additional engineered features"""
        print("\n⚙️ Engineering features...")
        df_eng = df.copy()
        
        # BMI (Body Mass Index) - important for board volume
        # Height is already in cm, convert to meters for BMI calculation
        df_eng['bmi'] = df_eng['surfer_weight'] / ((df_eng['surfer_height_cm'] / 100) ** 2)
        
        # Height-to-weight ratio
        df_eng['height_weight_ratio'] = df_eng['surfer_height_cm'] / df_eng['surfer_weight']
        
        # Age group encoding (for experience correlation)
        df_eng['age_group'] = pd.cut(df_eng['surfer_age'], 
                                      bins=[0, 25, 35, 45, 100], 
                                      labels=[0, 1, 2, 3])
        df_eng['age_group'] = df_eng['age_group'].astype(int)
        
        print("  ✅ Created: BMI, height_weight_ratio, age_group")
        return df_eng
    
    def train(self, csv_path):
        """Train the multi-output regression model with advanced techniques"""
        print("\n" + "="*60)
        print("🚀 TRAINING AR SURFBOARD RECOMMENDATION MODEL")
        print("="*60)
        
        # Load and prepare data
        df_clean, feature_columns, target_columns = self.load_and_prepare_data(csv_path)
        
        # Encode categorical features
        df_encoded = self.encode_categorical_features(df_clean, feature_columns)
        
        # Feature engineering
        df_final = self.feature_engineering(df_encoded)
        
        # Update feature list with engineered features
        self.feature_names = feature_columns + ['bmi', 'height_weight_ratio', 'age_group']
        
        # Prepare X (features) and y (targets)
        X = df_final[self.feature_names].values
        y = df_final[target_columns].values
        
        print(f"\n📊 Training Dataset Shape:")
        print(f"  Features (X): {X.shape}")
        print(f"  Targets (y): {y.shape}")
        
        # Split data with stratification consideration
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.15, random_state=42  # Smaller test set for small dataset
        )
        
        # Scale features
        print("\n📏 Scaling features...")
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Build ensemble of models for maximum accuracy
        print("\n🎯 Building advanced stacked ensemble model...")
        
        # Base models - each specialized for different patterns
        rf_model = RandomForestRegressor(
            n_estimators=300,
            max_depth=12,
            min_samples_split=2,
            min_samples_leaf=1,
            max_features='sqrt',
            random_state=42,
            n_jobs=-1
        )
        
        gb_model = GradientBoostingRegressor(
            n_estimators=250,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            random_state=42
        )
        
        ridge_model = Ridge(alpha=1.0, random_state=42)
        
        # Use ensemble voting for better predictions
        print("  📊 Training Ensemble (RF + GB + Ridge)...")
        ensemble = VotingRegressor([
            ('rf', rf_model),
            ('gb', gb_model),
            ('ridge', ridge_model)
        ])
        
        self.model = MultiOutputRegressor(ensemble)
        self.model.fit(X_train_scaled, y_train)
        
        # Cross-validation for reliability estimate
        print("\n🔄 Performing 5-fold cross-validation...")
        cv_scores = []
        kfold = KFold(n_splits=5, shuffle=True, random_state=42)
        
        for train_idx, val_idx in kfold.split(X_train_scaled):
            X_cv_train, X_cv_val = X_train_scaled[train_idx], X_train_scaled[val_idx]
            y_cv_train, y_cv_val = y_train[train_idx], y_train[val_idx]
            
            cv_model = MultiOutputRegressor(ensemble)
            cv_model.fit(X_cv_train, y_cv_train)
            y_cv_pred = cv_model.predict(X_cv_val)
            
            cv_r2 = r2_score(y_cv_val, y_cv_pred, multioutput='uniform_average')
            cv_scores.append(cv_r2)
        
        cv_mean = np.mean(cv_scores)
        cv_std = np.std(cv_scores)
        print(f"  Cross-validation R² = {cv_mean:.4f} ± {cv_std:.4f}")
        
        # Evaluate model
        print("\n📈 Evaluating model performance...")
        y_pred_train = self.model.predict(X_train_scaled)
        y_pred_test = self.model.predict(X_test_scaled)
        
        # Calculate metrics for each target
        for i, target_name in enumerate(target_columns):
            train_r2 = r2_score(y_train[:, i], y_pred_train[:, i])
            test_r2 = r2_score(y_test[:, i], y_pred_test[:, i])
            mae = mean_absolute_error(y_test[:, i], y_pred_test[:, i])
            rmse = np.sqrt(mean_squared_error(y_test[:, i], y_pred_test[:, i]))
            
            # Calculate percentage error
            mean_actual = np.mean(y_test[:, i])
            mape = (mae / mean_actual) * 100 if mean_actual != 0 else 0
            
            self.metrics[target_name] = {
                'train_r2': float(train_r2),
                'test_r2': float(test_r2),
                'cv_r2_mean': float(cv_mean),
                'cv_r2_std': float(cv_std),
                'mae': float(mae),
                'rmse': float(rmse),
                'mape': float(mape),
                'accuracy_percentage': float(max(0, test_r2) * 100)
            }
            
            print(f"\n  🎯 {target_name.upper()}:")
            print(f"     Training R²: {train_r2:.4f} ({train_r2*100:.2f}%)")
            print(f"     Test R²: {test_r2:.4f} ({test_r2*100:.2f}%)")
            print(f"     CV R²: {cv_mean:.4f} ± {cv_std:.4f}")
            print(f"     MAE: {mae:.4f}")
            print(f"     MAPE: {mape:.2f}%")
        
        # Overall accuracy
        overall_r2 = np.mean([max(0, m['test_r2']) for m in self.metrics.values()])
        print(f"\n  ⭐ OVERALL MODEL ACCURACY: {overall_r2*100:.2f}%")
        print(f"  ⭐ CROSS-VALIDATION RELIABILITY: {cv_mean*100:.2f}% ± {cv_std*100:.2f}%")
        
        # Feature importance
        print("\n🔍 Feature Importance Analysis:")
        importances = []
        for estimator in self.model.estimators_:
            # Get RF feature importance from ensemble
            if hasattr(estimator, 'estimators_'):
                for sub_estimator in estimator.estimators_:
                    if hasattr(sub_estimator, 'feature_importances_'):
                        importances.append(sub_estimator.feature_importances_)
                        break
        
        if importances:
            avg_importance = np.mean(importances, axis=0)
            feature_importance = sorted(
                zip(self.feature_names, avg_importance),
                key=lambda x: x[1],
                reverse=True
            )
            
            for feat, imp in feature_importance[:5]:
                print(f"  {feat}: {imp:.4f}")
        
        return self.metrics
    
    def predict(self, height_cm, weight_kg, age, experience_level, gender):
        """
        Make a prediction for a new surfer
        
        Args:
            height_cm: Height in centimeters
            weight_kg: Weight in kilograms
            age: Age in years
            experience_level: 'Beginner', 'Intermediate', or 'Advanced'
            gender: 'Male' or 'Female'
        
        Returns:
            dict: Predicted board specs and wave conditions with proper unit conversions
        """
        # Encode categorical features
        experience_encoded = self.label_encoders['surfer_experience'].transform([experience_level])[0]
        gender_encoded = self.label_encoders['surfer_gender'].transform([gender])[0]
        
        # Calculate engineered features
        bmi = weight_kg / ((height_cm / 100) ** 2)
        height_weight_ratio = height_cm / weight_kg
        
        if age <= 25:
            age_group = 0
        elif age <= 35:
            age_group = 1
        elif age <= 45:
            age_group = 2
        else:
            age_group = 3
        
        # Create feature array
        features = np.array([[
            height_cm,
            weight_kg,
            age,
            experience_encoded,
            gender_encoded,
            bmi,
            height_weight_ratio,
            age_group
        ]])
        
        # Scale features
        features_scaled = self.scaler.transform(features)
        
        # Predict (returns meters, liters, feet)
        prediction = self.model.predict(features_scaled)[0]
        
        # Convert board length from meters to feet and inches
        board_length_meters = prediction[0]
        board_length_feet = board_length_meters * 3.28084
        board_length_feet_int = int(board_length_feet)
        board_length_inches = (board_length_feet - board_length_feet_int) * 12
        
        # Get overall model accuracy for confidence
        overall_r2 = np.mean([max(0, m['test_r2']) for m in self.metrics.values()])
        cv_r2 = self.metrics[list(self.metrics.keys())[0]]['cv_r2_mean']
        
        if cv_r2 > 0.8:
            confidence = 'Very High'
        elif cv_r2 > 0.6:
            confidence = 'High'
        elif cv_r2 > 0.4:
            confidence = 'Medium'
        else:
            confidence = 'Developing'
        
        return {
            'board_length_feet': float(board_length_feet),
            'board_length_feet_inches': f"{board_length_feet_int}'{int(board_length_inches)}\"",
            'board_length_meters': float(board_length_meters),
            'board_volume_liters': float(prediction[1]),
            'ideal_wave_height_feet': float(prediction[2]),
            'recommendation_confidence': confidence,
            'model_accuracy': f"{overall_r2*100:.1f}%",
            'surfer_bmi': float(bmi),
            'skill_tips': self._generate_tips(experience_level, board_length_feet, prediction[2])
        }
    
    def _generate_tips(self, experience, board_length_ft, wave_height):
        """Generate personalized surfing tips based on predictions"""
        tips = []
        
        # Board size tips
        if board_length_ft >= 7:
            tips.append("Your longer board provides excellent stability - perfect for learning!")
        elif board_length_ft >= 6:
            tips.append("This board length offers a great balance of control and maneuverability")
        else:
            tips.append("Your shorter board is ideal for quick turns and advanced maneuvers")
        
        # Wave height tips
        if wave_height <= 3:
            tips.append(f"Ideal for {wave_height:.1f}ft waves - great for practicing fundamentals")
        elif wave_height <= 5:
            tips.append(f"Perfect for {wave_height:.1f}ft waves - intermediate challenge level")
        else:
            tips.append(f"Recommended for {wave_height:.1f}ft+ waves - advanced surfing conditions")
        
        # Experience-based tips
        if experience in ['Beginner', 'First-timer']:
            tips.append("Focus on: Paddle technique, pop-up timing, and balance")
        elif experience == 'Intermediate':
            tips.append("Focus on: Bottom turns, cutbacks, and reading wave sections")
        else:
            tips.append("Focus on: Advanced maneuvers, barrel riding, and aerial techniques")
        
        return tips
    
    def save_model(self, output_dir):
        """Save the trained model and metadata"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Save model
        model_path = os.path.join(output_dir, 'ar_surfboard_model.joblib')
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'label_encoders': self.label_encoders,
            'feature_names': self.feature_names,
            'target_names': self.target_names
        }, model_path)
        print(f"\n💾 Model saved to: {model_path}")
        
        # Save metadata
        metadata = {
            'model_type': 'MultiOutputRegressor with RandomForest',
            'training_date': datetime.now().isoformat(),
            'feature_names': self.feature_names,
            'target_names': self.target_names,
            'metrics': self.metrics,
            'label_encoders': {
                key: list(encoder.classes_) 
                for key, encoder in self.label_encoders.items()
            }
        }
        
        metadata_path = os.path.join(output_dir, 'model_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"💾 Metadata saved to: {metadata_path}")
        
        return model_path, metadata_path


def main():
    """Main training pipeline"""
    print("\n" + "🏄 "*20)
    print("AR SURFBOARD RECOMMENDATION MODEL TRAINING")
    print("🏄 "*20 + "\n")
    
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(script_dir, 'surfing_data.csv')
    output_dir = os.path.join(script_dir, 'trained_model')
    
    # Initialize and train model
    model = SurfboardRecommenderModel()
    metrics = model.train(data_path)
    
    # Save model
    model_path, metadata_path = model.save_model(output_dir)
    
    # Test predictions
    print("\n" + "="*60)
    print("🧪 TESTING PREDICTIONS WITH SAMPLE USERS")
    print("="*60)
    
    test_cases = [
        {
            'name': 'Beginner - Small Build',
            'height_cm': 165,
            'weight_kg': 60,
            'age': 22,
            'experience': 'Beginner',
            'gender': 'Female'
        },
        {
            'name': 'Intermediate - Average Build',
            'height_cm': 175,
            'weight_kg': 75,
            'age': 28,
            'experience': 'Intermediate',
            'gender': 'Male'
        },
        {
            'name': 'Advanced - Tall Build',
            'height_cm': 190,
            'weight_kg': 90,
            'age': 35,
            'experience': 'Advanced',
            'gender': 'Male'
        }
    ]
    
    for test in test_cases:
        print(f"\n👤 {test['name']}:")
        print(f"   📊 Physical: {test['height_cm']}cm, {test['weight_kg']}kg, {test['age']} years")
        print(f"   🏄 Experience: {test['experience']} | Gender: {test['gender']}")
        
        prediction = model.predict(
            test['height_cm'],
            test['weight_kg'],
            test['age'],
            test['experience'],
            test['gender']
        )
        
        print(f"\n   🏄 PERSONALIZED RECOMMENDATIONS:")
        print(f"   📏 Board Length: {prediction['board_length_feet_inches']} ({prediction['board_length_feet']:.2f} ft)")
        print(f"   💧 Board Volume: {prediction['board_volume_liters']:.1f} liters")
        print(f"   🌊 Ideal Wave Height: {prediction['ideal_wave_height_feet']:.1f} feet")
        print(f"   📊 BMI: {prediction['surfer_bmi']:.1f}")
        print(f"   ✅ Confidence: {prediction['recommendation_confidence']} ({prediction['model_accuracy']})")
        print(f"\n   💡 COACHING TIPS:")
        for tip in prediction['skill_tips']:
            print(f"      • {tip}")
    
    print("\n" + "="*60)
    print("✅ MODEL TRAINING COMPLETE!")
    print("="*60)
    print(f"\n📦 Model files saved in: {output_dir}")
    print("\n📌 Next steps:")
    print("  1. Review the model metrics above")
    print("  2. Create the prediction service API")
    print("  3. Integrate with the backend and frontend")


if __name__ == "__main__":
    main()
