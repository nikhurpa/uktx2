import mysql.connector
from math import radians
import numpy as np
from scipy.spatial import KDTree

def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="uktx",
        password="uktx123",
        database="ukcfa"
    )

conn = get_connection()
cursor = conn.cursor()

cursor.execute("SELECT block_name, lat, lng FROM villages")
villages = cursor.fetchall()

cursor.execute("SELECT id, lat, lng FROM olt WHERE lat IS NOT NULL AND lng IS NOT NULL")
olts = cursor.fetchall()

# Build KD-Tree from village coordinates
village_blocks = [v[0] for v in villages]
village_coords = np.array([[radians(v[1]), radians(v[2])] for v in villages])

tree = KDTree(village_coords)

# Query all OLTs at once (bulk — very fast)
olt_coords = np.array([[radians(o[1]), radians(o[2])] for o in olts])
_, indices = tree.query(olt_coords)  # finds nearest village index for each OLT

updates = [
    (village_blocks[idx], olt[0])
    for olt, idx in zip(olts, indices)
]

cursor.executemany("UPDATE olt SET block_name = %s WHERE id = %s", updates)
conn.commit()
print(f"Updated {len(updates)} OLT records")
cursor.close()
conn.close()