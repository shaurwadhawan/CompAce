
import csv
import re
from datetime import datetime

# Input and output file paths
input_file = '/Users/shauryawadhawan/compace/raw_batch_5.csv'
output_file = '/Users/shauryawadhawan/compace/temp_comps_final.csv'

# Month map
MONTHS = {
    "January": "01", "February": "02", "March": "03", "April": "04", "May": "05", "June": "06",
    "July": "07", "August": "08", "September": "09", "October": "10", "November": "11", "December": "12",
    "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04", "Jun": "06", "Jul": "07", "Aug": "08", "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"
}

def parse_date(date_str):
    if not date_str: return "TBA"
    date_str = date_str.strip()
    
    if "TBA" in date_str.upper(): return "TBA"
    
    # Check for "Month Day, Year" e.g. "December 5, 2025"
    match_full = re.match(r"([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})", date_str)
    if match_full:
        month_name, day, year = match_full.groups()
        month_num = MONTHS.get(month_name)
        if month_num:
            return f"{year}-{month_num}-{int(day):02d}"

    # Check for "Month Year" e.g. "March 2026" -> default to 01
    match_month_year = re.match(r"([A-Za-z]+)\s+(\d{4})", date_str)
    if match_month_year:
        month_name, year = match_month_year.groups()
        month_num = MONTHS.get(month_name)
        if month_num:
            return f"{year}-{month_num}-01"

    if date_str.lower() == "monthly":
        return "Rolling"

    return date_str

def detect_track(row):
    title = row['title'].lower()
    text = (row['title'] + " " + row['description'] + " " + row['tags']).lower()
    
    if "mun" in text or "model united nations" in text or "diplomacy" in text:
        return "MUN"
        
    # Priority 1: Coding phrases
    if any(x in text for x in ["coding", "computer science", "informatics", "algorithm", "cyber", "hackathon", "robotics"]):
        if "robotics" in text and "coding" not in text and "algorithm" not in text:
             return "Science" 
        if "robotics" in text:
             return "Science" 
        return "Coding"

    # Priority 2: Math phrases
    if any(x in text for x in ["math", "calculus", "geometry", "algebra", "number theory", "arithmetic"]):
        return "Math"

    # Priority 3: Science phrases
    if any(x in text for x in ["science", "biology", "physics", "chemistry", "astronomy", "engineering", "medicine", "brain", "neuroscience", "stem"]):
        return "Science"
        
    # Priority 4: Econ
    if any(x in text for x in ["econ", "finance", "business", "investment", "case"]):
        return "Econ"
        
    if "olympiad" in text:
        return "Math"

    return "MUN" # Default for this batch per user context

def process_csv():
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames

    processed_rows = []
    
    for row in rows:
        # Detect Track
        # The user provided batch has "MUN" in the track field mostly, but let's double check or default to MUN
        curr_track = row.get('track', '')
        if not curr_track or curr_track == 'HS' or curr_track == 'Uni': # Sometimes columns shift
           row['track'] = detect_track(row)
        
        # 2. Fix Deadline
        row['deadline'] = parse_date(row.get('deadline', ''))
        
        processed_rows.append(row)

    # Write to output
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(processed_rows)

    print(f"Processed {len(processed_rows)} rows. Output written to {output_file}")
    
    # Print first few rows to verify
    for i in range(min(5, len(processed_rows))):
        print(f"Row {i+1}: {processed_rows[i]['title']} -> {processed_rows[i]['track']} | {processed_rows[i]['deadline']}")

if __name__ == "__main__":
    process_csv()
