#!/usr/bin/env python3
"""
Clean and prepare working mom CSV data for D3.js visualization
"""

import pandas as pd
import csv

def clean_working_mom_data():
    print("Loading and cleaning working mom data...")
    
    # Read the original CSV
    try:
        df = pd.read_csv('working mom - Sheet1 (1).csv')
        print(f"Original data loaded: {len(df)} rows")
        print(f"Columns: {list(df.columns)}")
        
        # Display first few rows to understand structure
        print("\nFirst 5 rows:")
        print(df.head())
        
        # Check for missing data
        print(f"\nMissing data analysis:")
        missing_without_kid = df['Things she did(Without kid)'].isna().sum()
        missing_without_cat = df['Categories(without kid)'].isna().sum()
        print(f"Missing 'Without kid' activities: {missing_without_kid}")
        print(f"Missing 'Without kid' categories: {missing_without_cat}")
        
        # Clean the data
        cleaned_df = df.copy()
        
        # 1. Fill missing "without kid" activities
        print("\n1. Filling missing 'without kid' activities...")
        cleaned_df['Things she did(Without kid)'].fillna('', inplace=True)
        
        # Forward fill empty activities with previous activity
        last_activity = 'Sleep'
        last_category = 'Self'
        
        for i in range(len(cleaned_df)):
            if pd.isna(cleaned_df.loc[i, 'Things she did(Without kid)']) or cleaned_df.loc[i, 'Things she did(Without kid)'].strip() == '':
                cleaned_df.loc[i, 'Things she did(Without kid)'] = last_activity
                cleaned_df.loc[i, 'Categories(without kid)'] = last_category
            else:
                last_activity = cleaned_df.loc[i, 'Things she did(Without kid)']
                last_category = cleaned_df.loc[i, 'Categories(without kid)']
        
        # 2. Clean text data
        print("2. Cleaning text data...")
        
        # Remove extra quotes and clean text
        def clean_text(text):
            if pd.isna(text):
                return ''
            text = str(text).strip()
            # Remove nested quotes
            text = text.replace('""""', '"')
            # Remove tabs
            text = text.replace('\t', ' ')
            # Clean up extra spaces
            text = ' '.join(text.split())
            return text
        
        text_columns = ['Things she did(With kid)', 'Things she did(Without kid)']
        for col in text_columns:
            cleaned_df[col] = cleaned_df[col].apply(clean_text)
        
        # 3. Normalize categories
        print("3. Normalizing categories...")
        
        def normalize_category(cat):
            if pd.isna(cat):
                return 'Self'
            cat = str(cat).strip().lower()
            if cat in ['kid', 'child', 'children']:
                return 'Kid'
            elif cat == 'work':
                return 'Work'
            else:
                return 'Self'
        
        cleaned_df['Categories(with kid)'] = cleaned_df['Categories(with kid)'].apply(normalize_category)
        cleaned_df['Categories(without kid)'] = cleaned_df['Categories(without kid)'].apply(normalize_category)
        
        # 4. Ensure time format is consistent
        print("4. Checking time format...")
        def clean_time(time_str):
            if pd.isna(time_str):
                return None
            time_str = str(time_str).strip()
            # Ensure format is H:MM or HH:MM
            if ':' in time_str:
                parts = time_str.split(':')
                hours = int(parts[0])
                minutes = int(parts[1])
                return f"{hours}:{minutes:02d}"
            return time_str
        
        cleaned_df['Time'] = cleaned_df['Time'].apply(clean_time)
        
        # 5. Remove any completely invalid rows
        cleaned_df = cleaned_df.dropna(subset=['Time'])
        
        # 6. Stop at midnight (0:00)
        midnight_idx = cleaned_df[cleaned_df['Time'] == '0:00'].index
        if len(midnight_idx) > 0:
            cleaned_df = cleaned_df.loc[:midnight_idx[0]]
            print(f"Data truncated at midnight. Final length: {len(cleaned_df)} rows")
        
        # Save cleaned data
        output_file = 'working-mom-data-cleaned.csv'
        cleaned_df.to_csv(output_file, index=False, quoting=csv.QUOTE_MINIMAL)
        print(f"\nCleaned data saved to: {output_file}")
        
        # Show summary
        print(f"\nFinal data summary:")
        print(f"Total rows: {len(cleaned_df)}")
        print(f"Time range: {cleaned_df['Time'].iloc[0]} to {cleaned_df['Time'].iloc[-1]}")
        
        # Category distribution
        print(f"\nWith Kid categories:")
        print(cleaned_df['Categories(with kid)'].value_counts())
        print(f"\nWithout Kid categories:")
        print(cleaned_df['Categories(without kid)'].value_counts())
        
        # Show sample of cleaned data
        print(f"\nSample cleaned data:")
        print(cleaned_df[['Time', 'Things she did(With kid)', 'Categories(with kid)', 
                         'Things she did(Without kid)', 'Categories(without kid)']].head(10).to_string())
        
        return cleaned_df
        
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    clean_working_mom_data()
