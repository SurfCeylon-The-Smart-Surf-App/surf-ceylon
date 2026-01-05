"""
Download and explore the Kaggle surfing dataset
This script downloads the real-world surfing data and analyzes it
"""
import kagglehub
import pandas as pd
import os
import json

def download_dataset():
    """Download the latest version of the surfing dataset"""
    print("📥 Downloading Kaggle surfing dataset...")
    path = kagglehub.dataset_download("loureiro85/surfing")
    print(f"✅ Dataset downloaded to: {path}")
    return path

def explore_dataset(dataset_path):
    """Explore the structure and contents of the dataset"""
    print("\n🔍 Exploring dataset files...")
    
    # List all files in the dataset directory
    files = os.listdir(dataset_path)
    print(f"Files found: {files}")
    
    # Find CSV files
    csv_files = [f for f in files if f.endswith('.csv')]
    
    if not csv_files:
        print("⚠️ No CSV files found in dataset")
        return None
    
    # Load and analyze the main CSV file
    csv_path = os.path.join(dataset_path, csv_files[0])
    print(f"\n📊 Loading data from: {csv_files[0]}")
    
    df = pd.read_csv(csv_path)
    
    # Display basic information
    print(f"\n📈 Dataset Shape: {df.shape[0]} rows × {df.shape[1]} columns")
    print(f"\n📋 Column Names:\n{df.columns.tolist()}")
    print(f"\n🔢 Data Types:\n{df.dtypes}")
    print(f"\n📊 First 5 rows:\n{df.head()}")
    print(f"\n📊 Statistical Summary:\n{df.describe()}")
    print(f"\n❓ Missing Values:\n{df.isnull().sum()}")
    
    # Save exploration report
    report = {
        "dataset_path": dataset_path,
        "csv_file": csv_files[0],
        "num_records": int(df.shape[0]),
        "num_features": int(df.shape[1]),
        "columns": df.columns.tolist(),
        "data_types": df.dtypes.astype(str).to_dict(),
        "missing_values": df.isnull().sum().to_dict(),
        "sample_data": df.head(10).to_dict()
    }
    
    # Save the report
    script_dir = os.path.dirname(os.path.abspath(__file__))
    report_path = os.path.join(script_dir, "dataset_exploration_report.json")
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)
    print(f"\n✅ Exploration report saved to: {report_path}")
    
    # Save a copy of the dataset to our project
    project_data_path = os.path.join(script_dir, "surfing_data.csv")
    df.to_csv(project_data_path, index=False)
    print(f"✅ Dataset copied to: {project_data_path}")
    
    return df

if __name__ == "__main__":
    try:
        # Download the dataset
        dataset_path = download_dataset()
        
        # Explore the dataset
        df = explore_dataset(dataset_path)
        
        if df is not None:
            print("\n" + "="*60)
            print("✅ SUCCESS: Dataset downloaded and explored successfully!")
            print("="*60)
            print("\n📌 Next Steps:")
            print("1. Review the dataset_exploration_report.json file")
            print("2. Identify the features for training (height, weight, etc.)")
            print("3. Build the ML model using this data")
        else:
            print("❌ Failed to explore dataset")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
