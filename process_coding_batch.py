
import csv
import re
from datetime import datetime

input_file = '/Users/shauryawadhawan/compace/coding_comps_raw.txt'
output_file = '/Users/shauryawadhawan/compace/temp_comps_final.csv'

def parse_date(date_str):
    date_str = date_str.strip()
    
    # 1. Full Date: "Jan 9-12, 2026" or "Jan 10, 2026"
    match = re.search(r'([A-Za-z]{3}) (\d+)(?:[ -]+[A-Za-z0-9]*)?, (\d{4})', date_str)
    if match:
        month_str, day_str, year_str = match.groups()
        try:
            dt = datetime.strptime(f"{month_str} {day_str} {year_str}", "%b %d %Y")
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            pass

    # 2. Month Year only: "Feb 2026", "Jan 2026" -> "TBA"
    match_month_year = re.search(r'^([A-Za-z]{3}) (\d{4})$', date_str)
    if match_month_year:
        return "TBA"

    current_year = 2026
    year_match = re.search(r'20\d\d', date_str)
    if year_match:
        current_year = int(year_match.group(0))
        
    # 3. Month Day: "Jan 30 - Feb 2" or "Dec 26-29"
    match_short = re.search(r'([A-Za-z]{3}) (\d+)', date_str)
    if match_short:
        month_str, day_str = match_short.groups()
        try:
            year = current_year
            if month_str == 'Dec' and year == 2026:
                if not year_match:
                   year = 2025 
            
            dt = datetime.strptime(f"{month_str} {day_str} {year}", "%b %d %Y")
            return dt.strftime("%Y-%m-%d")
        except:
            pass
            
    if "Spring" in date_str or "Summer" in date_str or "Fall" in date_str or "Winter" in date_str:
        return "TBA"
    
    # Check if we failed to parse into YYYY-MM-DD
    if not re.match(r'\d{4}-\d{2}-\d{2}', date_str):
        return "TBA"
    
    return date_str

def process():
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            raw_lines = f.readlines()
    except FileNotFoundError:
        print(f"Error: Input file {input_file} not found.")
        return

    clean_lines = [l.strip() for l in raw_lines if l.strip()]
    
    entries = []
    chunk_size = 13
    
    for i in range(0, len(clean_lines), chunk_size):
        chunk = clean_lines[i:i+chunk_size]
        if len(chunk) < 13:
            print(f"Skipping incomplete chunk at end: {chunk}")
            continue
            
        entry = {
            'id': chunk[0],
            'title': chunk[1],
            'track': chunk[2],
            'mode': chunk[3],
            'region': chunk[4],
            'level': chunk[5],
            'deadline': chunk[6],
            'description': chunk[7],
            'format': chunk[8],
            'eligibility': chunk[9],
            'howToApply': chunk[10],
            'tags': chunk[11],
            'officialUrl': chunk[12]
        }
        
        # Transformations
        entry['deadline'] = parse_date(entry['deadline'])
        
        # ApplyUrl and OfficialUrl validation (Protocol check)
        if entry['officialUrl'] and not entry['officialUrl'].startswith('http'):
             entry['officialUrl'] = "https://" + entry['officialUrl']
             
        entry['applyUrl'] = entry['officialUrl']
        
        # Track Validation logic
        original_track = entry['track']
        entry['track'] = "Coding"
        
        if entry['tags']:
            entry['tags'] = f"{entry['tags']}|{original_track}"
        else:
            entry['tags'] = original_track

        entries.append(entry)

    headers = ["title","track","mode","region","level","deadline","description","format","eligibility","howToApply","tags","applyUrl","officialUrl"]
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        for e in entries:
            row = {k: e[k] for k in headers}
            writer.writerow(row)
            
    print(f"Processed {len(entries)} competitions to {output_file}")

if __name__ == "__main__":
    process()
