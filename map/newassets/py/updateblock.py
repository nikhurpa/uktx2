import mysql.connector
from math import radians
import numpy as np
from scipy.spatial import KDTree

# =========================
# CONFIG
# =========================

TARGET_TABLE = "bts"        # table where block column will be updated
ID_COLUMN = "TS_SITE_ID"        # unique id column of target table
BLOCK_COLUMN = "BLOCK"      # block column to update

LAT_COLUMN = "lat"
LNG_COLUMN = "lng"

VILLAGE_TABLE = "vil"       # reference village table

# =========================
# DB CONNECTION
# =========================

def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="uktx",
        password="uktx123",
        database="ukcfa"
    )

conn = get_connection()
cursor = conn.cursor()

# =========================
# FETCH VILLAGES
# =========================

cursor.execute(f"""
    SELECT block, {LAT_COLUMN}, {LNG_COLUMN}
    FROM {VILLAGE_TABLE}
""")

villages_raw = cursor.fetchall()

# Convert VARCHAR lat/lng to float safely
villages = []

for v in villages_raw:
    try:
        if v[1] and v[2]:
            villages.append((
                v[0],
                float(v[1]),
                float(v[2])
            ))
    except:
        continue

# =========================
# FETCH TARGET TABLE DATA
# =========================

cursor.execute(f"""
    SELECT {ID_COLUMN}, {LAT_COLUMN}, {LNG_COLUMN}
    FROM {TARGET_TABLE}
    WHERE {LAT_COLUMN} IS NOT NULL
      AND {LNG_COLUMN} IS NOT NULL
""")

targets_raw = cursor.fetchall()

targets = []

for t in targets_raw:
    try:
        if t[1] and t[2]:
            targets.append((
                t[0],
                float(t[1]),
                float(t[2])
            ))
    except:
        continue

# =========================
# BUILD KD TREE
# =========================

village_blocks = [v[0] for v in villages]

village_coords = np.array([
    [radians(v[1]), radians(v[2])]
    for v in villages
])

tree = KDTree(village_coords)

# =========================
# FIND NEAREST BLOCK
# =========================

target_coords = np.array([
    [radians(t[1]), radians(t[2])]
    for t in targets
])

_, indices = tree.query(target_coords)

updates = [
    (village_blocks[idx], target[0])
    for target, idx in zip(targets, indices)
]

# =========================
# UPDATE TABLE
# =========================

update_query = f"""
    UPDATE {TARGET_TABLE}
    SET {BLOCK_COLUMN} = %s
    WHERE {ID_COLUMN} = %s
"""

cursor.executemany(update_query, updates)

conn.commit()

print(f"Updated {len(updates)} records in {TARGET_TABLE}")

cursor.close()
conn.close()