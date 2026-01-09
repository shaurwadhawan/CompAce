
import csv
import re
from datetime import datetime

# Input and output file paths
input_file = '/Users/shauryawadhawan/compace/raw_batch_8.csv'
output_file = '/Users/shauryawadhawan/compace/temp_comps_final.csv'

# Month map
MONTHS = {
    "January": "01", "February": "02", "March": "03", "April": "04", "May": "05", "June": "06",
    "July": "07", "August": "08", "September": "09", "October": "10", "November": "11", "December": "12",
    "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04", "Jun": "06", "Jul": "07", "Aug": "08", "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"
}

def parse_date(date_str):
    if not date_str: return "TBA"
    
    # Pre-cleaning for this batch's "See official..." structure
    if "see official" in date_str.lower():
        return "TBA"
    
    # Original checks
    clean_str = re.sub(r'\(.*?\)', '', date_str).strip()
    if not clean_str: return "TBA"
    if "TBA" in clean_str.upper(): return "TBA"
    if "ROLLING" in clean_str.upper(): return "Rolling"
    
    # 1. Day Month Year (e.g. "31 Jan 2026")
    match_dmy = re.match(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", clean_str)
    if match_dmy:
        day, month_name, year = match_dmy.groups()
        month_num = MONTHS.get(month_name)
        if month_num:
            return f"{year}-{month_num}-{int(day):02d}"

    # 2. Month Day, Year (e.g. "December 5, 2025")
    match_mdy = re.match(r"([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})", clean_str)
    if match_mdy:
        month_name, day, year = match_mdy.groups()
        month_num = MONTHS.get(month_name)
        if month_num:
            return f"{year}-{month_num}-{int(day):02d}"

    # 3. Month Year (e.g. "March 2026")
    match_my = re.match(r"([A-Za-z]+)\s+(\d{4})", clean_str)
    if match_my:
        month_name, year = match_my.groups()
        month_num = MONTHS.get(month_name)
        if month_num:
            return f"{year}-{month_num}-01"

    # Fallback
    return "TBA"

def process_csv():
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames

    processed_rows = []
    
    for row in rows:
        # 1. Track Check - defaulting to MUN
        curr_track = row.get('track', '').strip()
        if not curr_track:
             row['track'] = "MUN"
        
        # 2. Fix Deadline
        raw_deadline = row.get('deadline', '')
        row['deadline'] = parse_date(raw_deadline)
        
        processed_rows.append(row)

    # Write to output
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(processed_rows)

    print(f"Processed {len(processed_rows)} rows. Output written to {output_file}")

if __name__ == "__main__":
    process_csv()
