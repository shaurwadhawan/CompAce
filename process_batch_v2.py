import csv
import sys
import re
from datetime import datetime

# Input and output file paths
input_file = 'raw_batch.csv'
output_file = 'temp_econ_comps.csv'

def get_track(row):
    # Check tags first (strongest signal)
    tags = row.get('tags', '').lower()
    title = row.get('title', '').lower()
    desc = row.get('description', '').lower()
    
    # Combined text for keyword search
    text = f"{tags} {title} {desc}"
    
    # Math Keywords
    if any(k in text for k in ['math', 'amc 8', 'amc 10', 'amc 12', 'aime', 'usamo', 'usajmo', 'hmmt', 'arml', 'purple comet', 'calculus', 'algebra', 'ciphering', 'proof-based']):
        return "Math"
    
    # Science Keywords (broad)
    if any(k in text for k in ['science', 'physics', 'chemistry', 'biology', 'neuroscience', 'brain bee', 'astronomy', 'astrophysics', 'robotics', 'engineering', 'aviation', 'biotech', 'genetics', 'solar', 'botball', 'mate rov', 'seaperch', 'zero robotics', 'isef', 'sts ', 'regeneron', 'jshs', 'nasa', 'space', 'design challenge']):
        return "Science"

    # Fallback to existing or "Olympiad" if it looks like one
    if "olympiad" in text:
        return "Olympiad"
        
    return row.get('track', 'Econ') # Keep original if unsure, but user said they are wrongly labeled Econ

def process_csv():
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    # Process rows
    for row in rows:
        # 1. Fix Date
        dl = row.get('deadline', '')
        if dl:
            dl_str = dl.strip()
            if dl_str.lower() not in ['rolling', 'tba', '']:
                date_obj = None
                # Try "January 15, 2026"
                try:
                    date_obj = datetime.strptime(dl_str, "%B %d, %Y")
                except ValueError:
                    pass
                # Try "November 2025" -> default to 1st
                if not date_obj:
                    try:
                        date_obj = datetime.strptime(dl_str, "%B %Y")
                    except ValueError:
                        pass
                
                if date_obj:
                    row['deadline'] = date_obj.strftime("%Y-%m-%d")

        # 2. Fix Track
        # User said "i believe theyre listed as econs but they should be maths / science"
        if row.get('track') == 'Econ':
            row['track'] = get_track(row)

    # Write to output file
    with open(output_file, 'w', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"Processed {len(rows)} rows. Written to {output_file}")

if __name__ == '__main__':
    process_csv()
