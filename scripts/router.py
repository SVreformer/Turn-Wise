import json
import math
import heapq
from typing import List, Dict, Optional, Tuple, Set

class StationRouter:
    def __init__(self, data_dir: str = 'data'):
        with open(f'{data_dir}/station/nodes.json', 'r', encoding='utf-8') as f:
            self.nodes = json.load(f)
        with open(f'{data_dir}/station/edges.json', 'r', encoding='utf-8') as f:
            self.edges = json.load(f)
        with open(f'{data_dir}/accessibility/profiles.json', 'r', encoding='utf-8') as f:
            self.profiles = {p['id']: p for p in json.load(f)}
        with open(f'{data_dir}/accessibility/routingConfig.json', 'r', encoding='utf-8') as f:
            self.config = json.load(f)
        with open(f'{data_dir}/station/facilities.json', 'r', encoding='utf-8') as f:
            self.facilities = json.load(f)
        with open(f'{data_dir}/simulation/status.json', 'r', encoding='utf-8') as f:
            self.status = json.load(f)

        self.node_dict = {n['id']: n for n in self.nodes}
        self.adj = {}
        for n in self.nodes:
            self.adj[n['id']] = []
        for e in self.edges:
            self.adj[e['from']].append(e)

    def heuristic(self, node_a: str, node_b: str) -> float:
        """Euclidean distance heuristic in meters."""
        na = self.node_dict[node_a]['coordinates']
        nb = self.node_dict[node_b]['coordinates']
        dx = na['x'] - nb['x']
        dy = na['y'] - nb['y']
        return math.sqrt(dx*dx + dy*dy) * 0.25

    def compute_edge_cost(self, edge: dict, profile_id: str, prev_edge: Optional[dict] = None) -> float:
        """Dynamic cost based on distance, profile weights, turn penalty, and vertical transition."""
        prof = self.profiles.get(profile_id, self.profiles['first_time'])
        weights = prof['weights']
        path_type = edge.get('pathType', 'WALKWAY').lower()

        # Wheelchair strict prohibitions
        if weights.get('stairAvoidance') and (not edge.get('wheelchairAccessible', True) or path_type == 'stairs' or path_type == 'escalator'):
            return float('inf')

        # Type multiplier
        multiplier = 1.0
        if path_type in ('ramp',):
            multiplier = weights.get('ramp', 1.0)
        elif path_type in ('lift',):
            multiplier = weights.get('lift', 1.0)
        elif path_type in ('stairs',):
            multiplier = weights.get('stairs', 1.5)
        elif path_type in ('escalator',):
            multiplier = weights.get('escalator', 1.5)
        elif path_type in ('fob', 'subway'):
            multiplier = weights.get('walkway', 1.0)
        else:
            multiplier = weights.get('walkway', 1.0)

        cost = edge['distance'] * multiplier

        # Turn penalty
        if prev_edge:
            p_from = self.node_dict[prev_edge['from']]['coordinates']
            p_to = self.node_dict[prev_edge['to']]['coordinates']
            c_to = self.node_dict[edge['to']]['coordinates']
            v1 = (p_to['x'] - p_from['x'], p_to['y'] - p_from['y'])
            v2 = (c_to['x'] - p_to['x'], c_to['y'] - p_to['y'])
            mag1 = math.sqrt(v1[0]**2 + v1[1]**2)
            mag2 = math.sqrt(v2[0]**2 + v2[1]**2)
            if mag1 > 0 and mag2 > 0:
                dot = (v1[0]*v2[0] + v1[1]*v2[1]) / (mag1 * mag2)
                dot = max(-1.0, min(1.0, dot))
                angle_deg = math.degrees(math.acos(dot))
                if angle_deg > self.config.get('turnAngleThresholdDegrees', 30.0):
                    cost += weights.get('turnPenalty', 5.0)

        return cost

    def find_route(self, start_id: str, dest_id: str, profile_id: str = 'first_time', blocked_ids: Optional[Set[str]] = None) -> Optional[dict]:
        """A* routing engine with Dijkstra fallback."""
        if start_id not in self.node_dict or dest_id not in self.node_dict:
            return None

        blocked = set(blocked_ids or [])
        # Also check status map for blocked facilities
        for k, v in self.status.items():
            if v == 'BLOCKED':
                blocked.add(k)

        # Priority queue: (f_score, g_score, current_node, path_edges)
        pq = [(0.0, 0.0, start_id, [])]
        best_g = {start_id: 0.0}
        visited = set()

        while pq:
            f, g, curr, path_edges = heapq.heappop(pq)
            if curr == dest_id:
                return self._build_route_result(start_id, dest_id, profile_id, path_edges)

            if curr in visited and g > best_g.get(curr, float('inf')):
                continue
            visited.add(curr)

            prev_edge = path_edges[-1] if path_edges else None
            for edge in self.adj[curr]:
                edge_id = edge['id']
                nxt = edge['to']

                # Check if edge or related facility is blocked
                if edge_id in blocked or f"{edge_id}_rev" in blocked:
                    continue
                # Check if edge pathType or associated node is blocked
                if edge.get('status') == 'BLOCKED':
                    continue

                cost = self.compute_edge_cost(edge, profile_id, prev_edge)
                if math.isinf(cost):
                    continue

                new_g = g + cost
                if new_g < best_g.get(nxt, float('inf')):
                    best_g[nxt] = new_g
                    h = self.heuristic(nxt, dest_id)
                    heapq.heappush(pq, (new_g + h, new_g, nxt, path_edges + [edge]))

        return None

    def _build_route_result(self, start_id: str, dest_id: str, profile_id: str, path_edges: List[dict]) -> dict:
        total_dist = sum(e['distance'] for e in path_edges)
        total_time = sum(e['estimatedTimeSeconds'] for e in path_edges)
        
        node_sequence = [start_id] + [e['to'] for e in path_edges]
        steps = []
        path_geometry = []
        
        lifts_used = []
        ramps_used = []
        stairs_used = []

        for idx, edge in enumerate(path_edges):
            u_node = self.node_dict[edge['from']]
            v_node = self.node_dict[edge['to']]
            pt = edge.get('pathType', 'WALKWAY')

            if pt == 'LIFT': lifts_used.append(v_node['name'])
            elif pt == 'RAMP': ramps_used.append(v_node['name'])
            elif pt == 'STAIRS': stairs_used.append(v_node['name'])

            # Generate step instruction
            instruction, voice = self._generate_instruction(idx + 1, u_node, v_node, edge, profile_id)
            steps.append({
                "stepNumber": idx + 1,
                "fromNode": u_node['name'],
                "toNode": v_node['name'],
                "instruction": instruction,
                "voiceText": voice,
                "distance": edge['distance'],
                "pathType": pt,
                "landmark": v_node.get('visualLandmark', '')
            })

            # Geometry accumulation
            geom = edge.get('geometry', [u_node['coordinates'], v_node['coordinates']])
            if idx == 0:
                path_geometry.extend(geom)
            else:
                path_geometry.extend(geom[1:])

        # Accessibility summary
        prof = self.profiles.get(profile_id, {})
        warnings = []
        if profile_id == 'mobility_disabled' and len(stairs_used) == 0:
            pass
        if len(stairs_used) > 0 and prof.get('weights', {}).get('stairAvoidance'):
            warnings.append("Route contains stairs; not recommended for wheelchairs.")

        return {
            "start": self.node_dict[start_id],
            "destination": self.node_dict[dest_id],
            "profile": profile_id,
            "totalDistanceMeters": round(total_dist, 1),
            "estimatedTimeMinutes": max(1, round(total_time / 60)),
            "nodeSequence": node_sequence,
            "steps": steps,
            "pathGeometry": path_geometry,
            "accessibility": {
                "wheelchairAccessible": len(stairs_used) == 0,
                "stepFree": len(stairs_used) == 0,
                "liftsUsed": lifts_used,
                "rampsUsed": ramps_used,
                "stairsUsed": stairs_used
            },
            "warnings": warnings
        }

    def _generate_instruction(self, step_num: int, u: dict, v: dict, edge: dict, profile_id: str) -> Tuple[str, str]:
        pt = edge.get('pathType', 'WALKWAY')
        dist = int(edge['distance'])
        landmark = v.get('visualLandmark', v['name'])

        if profile_id == 'child':
            if pt == 'LIFT':
                return f"Take the big elevator to {v['name']}", f"Take the elevator to {v['name']}."
            elif pt == 'RAMP':
                return f"Walk up the ramp towards {landmark}", f"Walk up the ramp towards {landmark}."
            return f"Walk straight for {dist} meters towards {landmark}", f"Walk forward towards {landmark}."

        if profile_id == 'visually_impaired':
            if pt == 'LIFT':
                return f"Enter the elevator on your side. Take it to {v['name']}", f"Elevator ahead. Enter and proceed to {v['name']}."
            elif pt == 'RAMP':
                return f"Begin ascending ramp for {dist} meters towards {landmark}", f"Ramp ahead. Continue forward on the ramp for {dist} meters."
            return f"Walk forward {dist} meters along tactile path towards {landmark}", f"Walk forward {dist} meters towards {landmark}."

        if pt == 'LIFT':
            return f"Take Lift to {v['name']} ({v.get('level', 0) >= 1 and 'Footover Bridge' or 'Platform Level'})", f"Take the lift to {v['name']}."
        elif pt == 'RAMP':
            return f"Proceed up the accessible ramp ({dist}m) towards {v['name']}", f"Follow the ramp for {dist} meters towards {v['name']}."
        elif pt == 'STAIRS':
            return f"Take the staircase ({dist}m) up to {v['name']}", f"Take stairs to {v['name']}."
        elif pt == 'FOB':
            return f"Continue along Footover Bridge for {dist} meters towards {v['name']}", f"Continue along the footover bridge for {dist} meters."

        return f"Walk {dist} meters towards {landmark}", f"Walk {dist} meters towards {landmark}."

if __name__ == '__main__':
    router = StationRouter()
    print("Testing Router on all 5 Profiles from Terminal 1 Main Entrance to Platform 8:")
    for pid in ['first_time', 'elderly', 'child', 'visually_impaired', 'mobility_disabled']:
        res = router.find_route('node_entry_t1_main_east', 'node_pf8_center', profile_id=pid)
        print(f"\n[PROFILE: {pid.upper()}]")
        print(f"  Distance: {res['totalDistanceMeters']}m | Time: {res['estimatedTimeMinutes']} min | Wheelchair: {res['accessibility']['wheelchairAccessible']}")
        print(f"  Lifts: {res['accessibility']['liftsUsed']} | Ramps: {res['accessibility']['rampsUsed']} | Stairs: {res['accessibility']['stairsUsed']}")
        print(f"  First step: {res['steps'][0]['instruction']}")
        print(f"  Last step: {res['steps'][-1]['instruction']}")
