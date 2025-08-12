#!/usr/bin/env python3
"""
Calculate working mother rates from census data
"""

import pandas as pd

def calculate_working_rates():
    print("Loading census data...")
    
    # Read the census data CSV
    df = pd.read_csv('census_data.csv')
    
    print(f"Original data shape: {df.shape}")
    print("Original columns:", list(df.columns))
    
    # Calculate the three working rate columns
    print("\nCalculating working rates...")
    
    # 1. Working mothers with children under 6 years old rate
    df['working_mom_under6yos_rate'] = (
        df['working_mom_under6yos_estimate'] / 
        (df['working_mom_under6yos_estimate'] + df['non_working_mom_under6yos_estimate'])
    )
    
    # 2. Working mothers with children 6-17 years old rate  
    df['working_mom_6yosto17yos_rate'] = (
        df['working_mom_6yosto17yos_estimate'] / 
        (df['working_mom_6yosto17yos_estimate'] + df['non_working_mom_6yosto17yos_estimate'])
    )
    
    # 3. Working women overall rate
    df['working_women_rate'] = (
        df['working_women_estimate'] / 
        (df['working_women_estimate'] + df['non_working_women_estimate'])
    )
    
    # Round to 4 decimal places for readability
    df['working_mom_under6yos_rate'] = df['working_mom_under6yos_rate'].round(4)
    df['working_mom_6yosto17yos_rate'] = df['working_mom_6yosto17yos_rate'].round(4)
    df['working_women_rate'] = df['working_women_rate'].round(4)
    
    print(f"New data shape: {df.shape}")
    print("New columns added:")
    print("- working_mom_under6yos_rate")
    print("- working_mom_6yosto17yos_rate") 
    print("- working_women_rate")
    
    # Display sample calculations
    print("\nSample data with new rates:")
    sample_cols = [
        'year', 'working_mom_under6yos_estimate', 'non_working_mom_under6yos_estimate', 'working_mom_under6yos_rate',
        'working_mom_6yosto17yos_estimate', 'non_working_mom_6yosto17yos_estimate', 'working_mom_6yosto17yos_rate',
        'working_women_estimate', 'non_working_women_estimate', 'working_women_rate'
    ]
    
    print(df[sample_cols].head())
    
    # Save the updated data
    output_file = 'census_data_with_rates.csv'
    df.to_csv(output_file, index=False)
    print(f"\nUpdated data saved to: {output_file}")
    
    # Show summary statistics
    print("\nSummary of working rates:")
    print("Working mothers with children under 6:")
    print(f"  Min: {df['working_mom_under6yos_rate'].min():.1%}")
    print(f"  Max: {df['working_mom_under6yos_rate'].max():.1%}")
    print(f"  Mean: {df['working_mom_under6yos_rate'].mean():.1%}")
    
    print("Working mothers with children 6-17:")
    print(f"  Min: {df['working_mom_6yosto17yos_rate'].min():.1%}")
    print(f"  Max: {df['working_mom_6yosto17yos_rate'].max():.1%}")
    print(f"  Mean: {df['working_mom_6yosto17yos_rate'].mean():.1%}")
    
    print("Working women overall:")
    print(f"  Min: {df['working_women_rate'].min():.1%}")
    print(f"  Max: {df['working_women_rate'].max():.1%}")
    print(f"  Mean: {df['working_women_rate'].mean():.1%}")
    
    # Convert year back to actual years for reference
    years = [2015, 2016, 2017, 2018, 2019, 2021, 2022, 2023]
    df['actual_year'] = df['year'].apply(lambda x: years[int(x)-1])
    
    print(f"\nData covers years: {df['actual_year'].tolist()}")
    
    return df

if __name__ == "__main__":
    calculate_working_rates()
