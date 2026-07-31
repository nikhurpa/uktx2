import config

from excel_reader import read_excel
from spatial_index import SpatialIndex

from geopy.distance import geodesic

import pandas as pd

print("Reading Excel...")

bts, gp = read_excel(config)

print("Building Spatial Index...")

index = SpatialIndex(gp)

results = []

total = len(bts)

for i, (_, tower) in enumerate(bts.iterrows(), start=1):

    print(f"{i}/{total}  {tower['BTS']}")

    nearby = index.find_nearby(
        tower["Latitude"],
        tower["Longitude"],
        config.SEARCH_RADIUS_KM
    )

    for _, village in nearby.iterrows():

        d = geodesic(
            (
                tower["Latitude"],
                tower["Longitude"]
            ),
            (
                village["Latitude"],
                village["Longitude"]
            )
        ).km

        results.append({

            "BTS": tower["BTS"],

            "GP": village["GP"],

            "Distance_km": round(d, 2)

        })

output = pd.DataFrame(results)

output.sort_values(
    ["BTS", "Distance_km"],
    inplace=True
)

output.to_excel(
    "Nearby_GPs.xlsx",
    index=False
)

print()
print("--------------------------------")
print("Completed Successfully")
print(f"Matches : {len(output)}")
print("--------------------------------")