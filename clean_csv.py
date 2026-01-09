import csv
import sys
from datetime import datetime

# Input and output file paths
input_file = 'temp_econ_comps.csv'

def clean_csv():
    # Read the input CSV
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    # Process rows
    for row in rows:
        dl = row.get('deadline', '')
        if dl:
            dl_str = dl.strip()
            # If it's not "Rolling" or "TBA", try to convert
            if dl_str.lower() not in ['rolling', 'tba', '']:
                # validation regex in app allows YYYY-MM-DD
                # We want to convert "Month Day, Year" or "Month Year" to YYYY-MM-DD
                
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
                
                # Try "Month YYYY" (e.g. April 2026) -> default to 1st
                # Covered by %B %Y

                if date_obj:
                    row['deadline'] = date_obj.strftime("%Y-%m-%d")

    # Write to stdout
    writer = csv.DictWriter(sys.stdout, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
    writer.writeheader()
    writer.writerows(rows)

if __name__ == '__main__':
    clean_csv()
