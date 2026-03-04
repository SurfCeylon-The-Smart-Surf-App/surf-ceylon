"""
Step 1: Download Kaggle Fitness Dataset
Automatically downloads 600K fitness exercise dataset using kagglehub
"""

import kagglehub
import pandas as pd
import json
from pathlib import Path
from cardio_config import KAGGLE_DATASET, RAW_DATA_PATH, DATA_DIR

def download_dataset():
    """Download Kaggle dataset automatically"""
    print("=" * 80)
    print("📥 DOWNLOADING KAGGLE DATASET")
    print("=" * 80)
    print(f"Dataset: {KAGGLE_DATASET}")
    print(f"Target: {RAW_DATA_PATH}\n")
    
    try:
        # Download using kagglehub (automatic)
        print("⏳ Downloading... (this may take a few minutes)")
        path = kagglehub.dataset_download(KAGGLE_DATASET)
        
        print(f"✅ Download complete!")
        print(f"📁 Downloaded to: {path}\n")
        
        # Save path reference
        path_info = {
            "kaggle_path": str(path),
            "dataset": KAGGLE_DATASET
        }
        
        with open(DATA_DIR / "dataset_path.json", "w") as f:
            json.dump(path_info, f, indent=2)
        
        return path
        
    except Exception as e:
        print(f"❌ Error downloading dataset: {e}")
        raise

def explore_dataset(path):
    """Explore downloaded dataset structure"""
    print("=" * 80)
    print("🔍 EXPLORING DATASET STRUCTURE")
    print("=" * 80)
    
    path_obj = Path(path)
    
    # List all files
    print("\n📂 Files in dataset:")
    files = list(path_obj.glob("**/*"))
    csv_files = [f for f in files if f.suffix == ".csv"]
    
    for f in csv_files:
        size_mb = f.stat().st_size / (1024 * 1024)
        print(f"  • {f.name} ({size_mb:.2f} MB)")
    
    # Load and analyze CSV files
    print("\n" + "=" * 80)
    print("📊 ANALYZING CSV CONTENT")
    print("=" * 80)
    
    for csv_file in csv_files:
        print(f"\n📄 {csv_file.name}")
        print("-" * 80)
        
        try:
            df = pd.read_csv(csv_file, nrows=5)
            
            print(f"Rows: {len(df):,} (showing first 5)")
            print(f"Columns: {len(df.columns)}")
            print(f"\nColumn Names:")
            for col in df.columns:
                dtype = df[col].dtype
                print(f"  • {col} ({dtype})")
            
            print(f"\nSample Data:")
            print(df.head(2).to_string())
            
            # Count total rows
            total_df = pd.read_csv(csv_file)
            print(f"\n📈 Total Rows: {len(total_df):,}")
            
            # Check for exercise-related columns
            exercise_cols = [c for c in total_df.columns if 'exercise' in c.lower() or 'name' in c.lower()]
            if exercise_cols:
                print(f"\n🏋️ Exercise Columns Found: {exercise_cols}")
                unique_exercises = total_df[exercise_cols[0]].nunique()
                print(f"   Unique Exercises: {unique_exercises:,}")
            
            # Check for category/type columns
            category_cols = [c for c in total_df.columns if 'category' in c.lower() or 'type' in c.lower() or 'muscle' in c.lower()]
            if category_cols:
                print(f"\n📂 Category Columns: {category_cols}")
                for col in category_cols[:2]:  # Show first 2
                    print(f"\n   {col} unique values:")
                    print(f"   {total_df[col].value_counts().head(10).to_dict()}")
            
        except Exception as e:
            print(f"⚠️ Error reading {csv_file.name}: {e}")
    
    print("\n" + "=" * 80)
    print("✅ DATASET EXPLORATION COMPLETE")
    print("=" * 80)
    
    return csv_files

def main():
    """Main execution"""
    print("\n🚀 KAGGLE DATASET DOWNLOAD & EXPLORATION")
    print("=" * 80)
    
    # Download dataset
    dataset_path = download_dataset()
    
    # Explore structure
    csv_files = explore_dataset(dataset_path)
    
    print(f"\n✅ SUCCESS!")
    print(f"📁 Dataset location: {dataset_path}")
    print(f"📄 CSV files found: {len(csv_files)}")
    print(f"\n➡️ Next step: Run 2_preprocess_cardio_data.py")
    print("=" * 80)

if __name__ == "__main__":
    main()
