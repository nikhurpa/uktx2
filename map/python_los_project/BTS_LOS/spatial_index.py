import numpy as np
from scipy.spatial import cKDTree


class SpatialIndex:

    def __init__(self, gp_dataframe):

        self.df = gp_dataframe

        coords = np.radians(
            gp_dataframe[
                ["Latitude", "Longitude"]
            ].values
        )

        self.tree = cKDTree(coords)

    def find_nearby(self,
                    latitude,
                    longitude,
                    radius_km):

        earth_radius = 6371.0

        radius = radius_km / earth_radius

        point = np.radians(
            [latitude, longitude]
        )

        ids = self.tree.query_ball_point(
            point,
            radius
        )

        return self.df.iloc[ids]