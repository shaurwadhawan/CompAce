import sqlite3
import os

paths = ["prisma/dev.db", "dev.db"]

for p in paths:
    if os.path.exists(p):
        try:
            conn = sqlite3.connect(p)
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(Competition)")
            columns = [info[1] for info in cursor.fetchall()]
            print(f"Columns in {p}: {columns}")
            conn.close()
        except Exception as e:
            print(f"Error reading {p}: {e}")
    else:
        print(f"File not found: {p}")
