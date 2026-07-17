import math
import heapq
from typing import Dict, Any, List, Tuple

# Predefined Stadium Graph representing coordinates (lat, lng) and connections (edges)
# Coordinates centered around a mock FIFA Stadium layout.
STADIUM_NODES = {
    "Gate 1": {"lat": 34.0522, "lng": -118.2437, "accessible": True},
    "Gate 2": {"lat": 34.0532, "lng": -118.2447, "accessible": True},
    "Gate 3 (Congested)": {"lat": 34.0542, "lng": -118.2457, "accessible": False}, # Stairs only
    "Gate 4": {"lat": 34.0552, "lng": -118.2467, "accessible": True},
    "Gate 5": {"lat": 34.0562, "lng": -118.2477, "accessible": True},
    "Zone A Ring": {"lat": 34.0535, "lng": -118.2430, "accessible": True},
    "Zone B Ring": {"lat": 34.0545, "lng": -118.2440, "accessible": True},
    "Zone C Stairway": {"lat": 34.0555, "lng": -118.2450, "accessible": False}, # Stairs only
    "VIP Lounge Corridor": {"lat": 34.0528, "lng": -118.2425, "accessible": True, "restricted": True},
    "Medical Station 1": {"lat": 34.0538, "lng": -118.2442, "accessible": True},
    "Concessions Plaza": {"lat": 34.0548, "lng": -118.2452, "accessible": True},
    "Restrooms North": {"lat": 34.0558, "lng": -118.2462, "accessible": True},
    "Transport Terminal": {"lat": 34.0512, "lng": -118.2427, "accessible": True}
}

# Bidirectional edges representing paths, distance in meters, accessibility, and restriction flags
STADIUM_EDGES = [
    ("Gate 1", "Zone A Ring", 150, True),
    ("Gate 1", "Transport Terminal", 100, True),
    ("Gate 2", "Zone A Ring", 120, True),
    ("Gate 2", "VIP Lounge Corridor", 80, True),
    ("Gate 3 (Congested)", "Zone B Ring", 110, False), # Stairs
    ("Gate 3 (Congested)", "Concessions Plaza", 90, False),
    ("Gate 4", "Zone B Ring", 130, True),
    ("Gate 4", "Restrooms North", 70, True),
    ("Gate 5", "Restrooms North", 100, True),
    ("Gate 5", "Concessions Plaza", 140, True),
    ("Zone A Ring", "VIP Lounge Corridor", 90, True),
    ("Zone A Ring", "Medical Station 1", 120, True),
    ("Zone B Ring", "Medical Station 1", 80, True),
    ("Zone B Ring", "Zone C Stairway", 100, False),
    ("Zone C Stairway", "Concessions Plaza", 60, False),
    ("VIP Lounge Corridor", "Transport Terminal", 200, True),
    ("Medical Station 1", "Concessions Plaza", 70, True),
    ("Concessions Plaza", "Restrooms North", 80, True),
]

class RouteOptimizer:
    def __init__(self):
        self.nodes = STADIUM_NODES
        self.edges = STADIUM_EDGES

    def _calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        # Standard Haversine distance
        R = 6371000  # radius of Earth in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lng2 - lng1)
        a = math.sin(delta_phi/2)**2 + math.cos(phi1)*math.cos(phi2) * math.sin(delta_lambda/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def get_closest_node(self, lat: float, lng: float) -> str:
        closest_node = None
        min_dist = float('inf')
        for node, coord in self.nodes.items():
            dist = self._calculate_distance(lat, lng, coord["lat"], coord["lng"])
            if dist < min_dist:
                min_dist = dist
                closest_node = node
        return closest_node

    def find_path(
        self, 
        start_lat: float, 
        start_lng: float, 
        end_lat: float, 
        end_lng: float, 
        require_accessible: bool = False,
        node_congestion: Dict[str, float] = None
    ) -> Dict[str, Any]:
        """Dijkstra's Pathfinding implementation dynamically factoring in congestion and accessibility constraints."""
        start_node = self.get_closest_node(start_lat, start_lng)
        end_node = self.get_closest_node(end_lat, end_lng)
        
        if not start_node or not end_node:
            return {"path": [], "distance_meters": 0.0, "estimated_minutes": 0.0, "accessibility_flag": False}

        # Build adjacency graph
        graph = {node: [] for node in self.nodes}
        for u, v, weight, is_acc in self.edges:
            # Skip inaccessible edges if access requires it
            if require_accessible and not is_acc:
                continue
            # Also double check nodes accessibility
            if require_accessible and (not self.nodes[u]["accessible"] or not self.nodes[v]["accessible"]):
                continue
                
            # Congestion weight modifier
            weight_modifier = 1.0
            if node_congestion:
                # Add penalty if endpoints are congested
                u_cong = node_congestion.get(u, 0)
                v_cong = node_congestion.get(v, 0)
                # Congestion ranges from 0-100. Add penalty up to double the weight
                weight_modifier += (u_cong + v_cong) / 100.0

            graph[u].append((v, weight * weight_modifier))
            graph[v].append((u, weight * weight_modifier))

        # Dijkstra algorithm
        distances = {node: float('inf') for node in self.nodes}
        distances[start_node] = 0
        predecessors = {node: None for node in self.nodes}
        pq = [(0, start_node)]

        while pq:
            curr_dist, curr_node = heapq.heappop(pq)
            
            if curr_node == end_node:
                break
                
            if curr_dist > distances[curr_node]:
                continue
                
            for neighbor, edge_weight in graph[curr_node]:
                new_dist = curr_dist + edge_weight
                if new_dist < distances[neighbor]:
                    distances[neighbor] = new_dist
                    predecessors[neighbor] = curr_node
                    heapq.heappush(pq, (new_dist, neighbor))

        # Backtrack path
        path_nodes = []
        curr = end_node
        while curr:
            path_nodes.insert(0, curr)
            curr = predecessors[curr]

        if not path_nodes or path_nodes[0] != start_node:
            # Re-try without accessibility constraint if path not found
            if require_accessible:
                return self.find_path(start_lat, start_lng, end_lat, end_lng, require_accessible=False, node_congestion=node_congestion)
            return {"path": [], "distance_meters": 0.0, "estimated_minutes": 0.0, "accessibility_flag": False}

        # Calculate exact metrics
        total_distance = 0.0
        coords_path = []
        for i in range(len(path_nodes)):
            node_name = path_nodes[i]
            node_data = self.nodes[node_name]
            coords_path.append({
                "lat": node_data["lat"],
                "lng": node_data["lng"],
                "name": node_name
            })
            if i > 0:
                prev_node = path_nodes[i-1]
                # find real edge weight
                base_dist = 50.0 # fallback
                for u, v, w, _ in self.edges:
                    if (u == prev_node and v == node_name) or (v == prev_node and u == node_name):
                        base_dist = w
                        break
                total_distance += base_dist

        # Standard walking speed: ~1.2 meters per second
        walking_speed = 1.2
        estimated_seconds = total_distance / walking_speed
        
        # Add latency for congested nodes
        if node_congestion:
            for node_name in path_nodes:
                cong = node_congestion.get(node_name, 0)
                if cong > 75:
                    estimated_seconds += 120 # 2 mins queue wait
                elif cong > 50:
                    estimated_seconds += 60 # 1 min queue wait

        estimated_minutes = round(estimated_seconds / 60, 1)

        # Generate safety/accessibility advisories
        advisory = None
        if any(not self.nodes[n]["accessible"] for n in path_nodes):
            advisory = "Caution: This path contains stairs/stairs-only zones. Not suitable for wheelchairs."
        elif node_congestion and any(node_congestion.get(n, 0) > 75 for n in path_nodes):
            advisory = "Advisory: Routing traverses high-density crowd sections. Expect minor queues."

        return {
            "path": coords_path,
            "distance_meters": round(total_distance, 1),
            "estimated_minutes": estimated_minutes,
            "accessibility_flag": require_accessible,
            "safety_advisory": advisory
        }

route_optimizer = RouteOptimizer()
