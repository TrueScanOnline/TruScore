#!/usr/bin/env python3
"""
Analyze IARC Database Excel File
Reads and analyzes the structure of the IARC Monographs database
"""

import sys
import json

try:
    import pandas as pd
except ImportError:
    print("ERROR: pandas not installed. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pandas", "openpyxl"])
    import pandas as pd

def analyze_iarc_database(file_path):
    """Analyze the IARC database Excel file"""
    
    print("=" * 80)
    print("IARC DATABASE ANALYSIS")
    print("=" * 80)
    print()
    
    try:
        # Read Excel file
        print(f"Reading Excel file: {file_path}")
        df = pd.read_excel(file_path, engine='openpyxl')
        
        print(f"\n✅ File loaded successfully!")
        print(f"   Total rows: {len(df)}")
        print(f"   Total columns: {len(df.columns)}")
        print()
        
        # Display column names
        print("=" * 80)
        print("COLUMN STRUCTURE")
        print("=" * 80)
        print("\nColumn names:")
        for i, col in enumerate(df.columns, 1):
            print(f"  {i}. {col}")
        print()
        
        # Display first few rows
        print("=" * 80)
        print("SAMPLE DATA (First 10 rows)")
        print("=" * 80)
        print(df.head(10).to_string())
        print()
        
        # Analyze data types
        print("=" * 80)
        print("DATA TYPES")
        print("=" * 80)
        print(df.dtypes)
        print()
        
        # Check for IARC Group classifications
        print("=" * 80)
        print("IARC GROUP DISTRIBUTION")
        print("=" * 80)
        
        # Try to find IARC group column (common names)
        group_columns = [col for col in df.columns if 'group' in col.lower() or 'classification' in col.lower() or 'iarc' in col.lower()]
        
        if group_columns:
            for col in group_columns:
                print(f"\nColumn: {col}")
                print(df[col].value_counts())
        else:
            print("\n⚠️  No obvious 'Group' column found. Checking all columns for IARC classifications...")
            # Check all columns for Group 1, 2A, 2B, 3, 4
            for col in df.columns:
                if df[col].dtype == 'object':  # String columns
                    unique_vals = df[col].unique()
                    if any('1' in str(v) or '2A' in str(v) or '2B' in str(v) or '3' in str(v) or '4' in str(v) for v in unique_vals[:20]):
                        print(f"\nPossible IARC Group column: {col}")
                        print(f"  Sample values: {unique_vals[:10]}")
        
        print()
        
        # Check for agent/substance names
        print("=" * 80)
        print("SUBSTANCE/AGENT COLUMNS")
        print("=" * 80)
        name_columns = [col for col in df.columns if 'agent' in col.lower() or 'substance' in col.lower() or 'name' in col.lower() or 'chemical' in col.lower()]
        if name_columns:
            print(f"\nFound {len(name_columns)} potential name columns:")
            for col in name_columns:
                print(f"  - {col}")
                print(f"    Sample: {df[col].iloc[0] if len(df) > 0 else 'N/A'}")
        else:
            print("\n⚠️  No obvious name columns found. Checking first column...")
            if len(df.columns) > 0:
                print(f"  First column: {df.columns[0]}")
                print(f"  Sample: {df[df.columns[0]].iloc[0] if len(df) > 0 else 'N/A'}")
        
        print()
        
        # Summary statistics
        print("=" * 80)
        print("SUMMARY STATISTICS")
        print("=" * 80)
        print(f"\nTotal entries: {len(df)}")
        print(f"Columns: {', '.join(df.columns[:5])}{'...' if len(df.columns) > 5 else ''}")
        
        # Check for null values
        print(f"\nNull value counts:")
        null_counts = df.isnull().sum()
        for col, count in null_counts.items():
            if count > 0:
                print(f"  {col}: {count} ({count/len(df)*100:.1f}%)")
        
        print()
        
        # Export structure to JSON for further analysis
        structure = {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "columns": list(df.columns),
            "sample_row": df.iloc[0].to_dict() if len(df) > 0 else {},
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()}
        }
        
        with open("iarc_database_structure.json", "w", encoding="utf-8") as f:
            json.dump(structure, f, indent=2, ensure_ascii=False)
        
        print("✅ Database structure exported to: iarc_database_structure.json")
        print()
        
        return df
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    file_path = r"C:\TrueScan-FoodScanner\TruScore logic\Agents Classified by the IARC Monographs, Volumes 1–140 (1).xlsx"
    df = analyze_iarc_database(file_path)
    
    if df is not None:
        print("=" * 80)
        print("ANALYSIS COMPLETE")
        print("=" * 80)

