import json
import math
import os

print("=== GENERATING NAVIGATION GRAPH (NODES & EDGES) ===")

nodes = []
edges = []

def add_node(node_id, name, n_type, x, y, level, accessible=True, wheelchair=True, elderly=True, landmark="", layer="PATHWAY", qr_id=""):
    nodes.append({
        "id": node_id,
        "name": name,
        "type": n_type,
        "coordinates": {"x": round(float(x), 1), "y": round(float(y), 1)},
        "level": level,
        "layer": layer,
        "accessible": accessible,
        "wheelchairAccessible": wheelchair,
        "elderlyFriendly": elderly,
        "visualLandmark": landmark or name,
        "qrCheckpointId": qr_id,
        "status": "OPEN"
    })

def add_edge(edge_id, from_id, to_id, path_type, level, accessible=True, wheelchair=True, elderly=True, geom=None, status="OPEN"):
    n_from = next((n for n in nodes if n["id"] == from_id), None)
    n_to = next((n for n in nodes if n["id"] == to_id), None)
    if not n_from or not n_to:
        raise ValueError(f"Edge {edge_id}: invalid nodes {from_id} -> {to_id}")
    
    # Euclidean distance in SVG coordinates
    dx = n_to["coordinates"]["x"] - n_from["coordinates"]["x"]
    dy = n_to["coordinates"]["y"] - n_from["coordinates"]["y"]
    pixel_dist = math.sqrt(dx*dx + dy*dy)
    
    # SVG to meters factor: ~0.25m per pixel
    distance_meters = max(round(pixel_dist * 0.25, 1), 2.0)
    # Walking speed 1.2 m/s plus vertical transition time
    est_time = round(distance_meters / 1.2)
    if path_type in ("LIFT", "STAIRS", "RAMP", "ESCALATOR") and n_from["level"] != n_to["level"]:
        est_time += 30 # elevator wait or stair climb time
    
    geometry = geom or [n_from["coordinates"], n_to["coordinates"]]

    # Forward edge
    edges.append({
        "id": edge_id,
        "from": from_id,
        "to": to_id,
        "distance": distance_meters,
        "estimatedTimeSeconds": est_time,
        "pathType": path_type,
        "level": level,
        "accessible": accessible,
        "wheelchairAccessible": wheelchair,
        "elderlyFriendly": elderly,
        "visualGuidanceAvailable": True,
        "status": status,
        "geometry": geometry
    })
    
    # Reverse edge (bi-directional graph)
    edges.append({
        "id": f"{edge_id}_rev",
        "from": to_id,
        "to": from_id,
        "distance": distance_meters,
        "estimatedTimeSeconds": est_time,
        "pathType": path_type,
        "level": level,
        "accessible": accessible,
        "wheelchairAccessible": wheelchair,
        "elderlyFriendly": elderly,
        "visualGuidanceAvailable": True,
        "status": status,
        "geometry": list(reversed(geometry))
    })

# 1. ENTRANCES (Level 0)
add_node("node_entry_t1_main_east", "Terminal 1 Main Entrance (East)", "ENTRANCE", 1811.0, 1163.0, 0, True, True, True, "Main Entrance East Porch", "Entry", "QR-KSR-T1-MAIN")
add_node("node_entry_t1_main_west", "Terminal 1 Main Entrance (West)", "ENTRANCE", 1573.2, 1138.3, 0, True, True, True, "West Entrance near Auto Stand", "Entry_2_")
add_node("node_entry_t1_center", "Terminal 1 Concourse Center Gate", "ENTRANCE", 1710.5, 1080.9, 0, True, True, True, "Center Entry Archway", "Entry_3_")
add_node("node_entry_t2_east", "Terminal 2 East Entrance", "ENTRANCE", 2973.4, 554.7, 0, True, True, True, "Terminal 2 Entry Porch", "Entry_1_", "QR-KSR-T2-ENTRY")
add_node("node_entry_t2_okklapura", "Terminal 2 Okkalpuram Gate", "ENTRANCE", 3163.6, 719.4, 0, True, True, True, "Okkalpuram Drop-Off Gate", "Entry_4_")
add_node("node_entry_t3_metro", "Terminal 3 Metro Entrance", "METRO", 745.0, 1280.0, 0, True, True, True, "Metro Link Archway", "Metro_FOB", "QR-KSR-METRO-T3")

# 2. TERMINAL 1 MAIN HALL & CONCOURSE (Level 0)
add_node("node_t1_main_concourse", "Terminal 1 Central Concourse", "JUNCTION", 1720.0, 1140.0, 0, True, True, True, "Central Passenger Hall under High Ceiling")
add_node("node_t1_ticket", "Terminal 1 Ticket Counters", "TICKET_COUNTER", 1680.0, 1180.0, 0, True, True, True, "Ticketing Counters 1-12", "Terminals", "QR-KSR-T1-TICKET")
add_node("node_t1_toilet", "Terminal 1 Restroom", "TOILET", 1762.4, 1280.0, 0, True, True, True, "Main Concourse Restrooms", "TOILET")
add_node("node_t1_lift2_l0", "Lift 2 (Terminal 1 Concourse)", "LIFT", 1661.7, 1110.6, 0, True, True, True, "Glass Lift 2 Tower in Concourse", "_x31__lift_2_", "QR-KSR-T1-LIFT2")
add_node("node_t1_ramp_subway_l0", "Subway Ramp Entrance (T1)", "RAMP", 1547.2, 1175.7, 0, True, True, True, "Wide Sloped Subway Ramp", "_x31__RAMP_2_")
add_node("node_t1_stair_subway_l0", "Subway Stair Entrance (T1)", "STAIRS", 1354.5, 1144.1, 0, False, False, False, "Main Subway Stairway", "Stair")
add_node("node_t1_east_corridor", "Terminal 1 East Corridor", "JUNCTION", 2100.0, 1080.0, 0, True, True, True, "East Corridor leading to FOB 2 walkway")
add_node("node_t1_west_corridor", "Terminal 1 West Corridor", "JUNCTION", 1350.0, 1080.0, 0, True, True, True, "West Corridor leading to Platform 1 & Metro")

# Connect Terminal 1 concourse
add_edge("e_t1_entry_e_to_conc", "node_entry_t1_main_east", "node_t1_main_concourse", "WALKWAY", 0)
add_edge("e_t1_entry_w_to_conc", "node_entry_t1_main_west", "node_t1_main_concourse", "WALKWAY", 0)
add_edge("e_t1_entry_c_to_conc", "node_entry_t1_center", "node_t1_main_concourse", "WALKWAY", 0)
add_edge("e_t1_conc_to_ticket", "node_t1_main_concourse", "node_t1_ticket", "WALKWAY", 0)
add_edge("e_t1_conc_to_toilet", "node_t1_main_concourse", "node_t1_toilet", "WALKWAY", 0)
add_edge("e_t1_conc_to_lift2", "node_t1_main_concourse", "node_t1_lift2_l0", "WALKWAY", 0)
add_edge("e_t1_conc_to_ramp_sub", "node_t1_main_concourse", "node_t1_ramp_subway_l0", "WALKWAY", 0)
add_edge("e_t1_conc_to_stair_sub", "node_t1_main_concourse", "node_t1_stair_subway_l0", "WALKWAY", 0)
add_edge("e_t1_conc_to_east_corr", "node_t1_main_concourse", "node_t1_east_corridor", "WALKWAY", 0)
add_edge("e_t1_conc_to_west_corr", "node_t1_main_concourse", "node_t1_west_corridor", "WALKWAY", 0)

# 3. TERMINAL 2 (Level 0)
add_node("node_t2_booking", "Terminal 2 Booking Office", "TICKET_COUNTER", 2862.8, 552.9, 0, True, True, True, "Terminal 2 Ticket Counters", "T2_Booking")
add_node("node_t2_foyer", "Terminal 2 Foyer", "JUNCTION", 2950.0, 580.0, 0, True, True, True, "Terminal 2 Main Waiting Lobby")
add_node("node_t2_toilet", "Terminal 2 Restroom", "TOILET", 2957.8, 611.2, 0, True, True, True, "Terminal 2 Restrooms", "Toilet_2_")
add_node("node_t2_pf1_walkway", "Terminal 2 to PF 1 Pathway", "WALKWAY", 2750.0, 750.0, 0, True, True, True, "Covered Pathway connecting Terminal 2 to Platform 1", "PATHWAY")

add_edge("e_t2_entry_e_to_foyer", "node_entry_t2_east", "node_t2_foyer", "WALKWAY", 0)
add_edge("e_t2_entry_okk_to_foyer", "node_entry_t2_okklapura", "node_t2_foyer", "WALKWAY", 0)
add_edge("e_t2_foyer_to_booking", "node_t2_foyer", "node_t2_booking", "WALKWAY", 0)
add_edge("e_t2_foyer_to_toilet", "node_t2_foyer", "node_t2_toilet", "WALKWAY", 0)
add_edge("e_t2_foyer_to_pf1_walk", "node_t2_foyer", "node_t2_pf1_walkway", "WALKWAY", 0)

# 4. TERMINAL 3 / METRO (Level 0)
add_node("node_t3_concourse", "Terminal 3 Concourse", "JUNCTION", 745.0, 1150.0, 0, True, True, True, "Terminal 3 Circulation Area")
add_node("node_t3_metro_bridge_ramp", "Metro Bridge Entrance Ramp", "RAMP", 745.0, 1050.0, 0, True, True, True, "Sloped Ramp leading to Metro FOB")

add_edge("e_t3_entry_to_conc", "node_entry_t3_metro", "node_t3_concourse", "WALKWAY", 0)
add_edge("e_t3_conc_to_ramp", "node_t3_concourse", "node_t3_metro_bridge_ramp", "WALKWAY", 0)
add_edge("e_t3_conc_to_t1_west", "node_t3_concourse", "node_t1_west_corridor", "WALKWAY", 0)

# 5. PLATFORM LEVEL NODES (Level 0)
# Platform 1
add_node("node_pf1_west", "Platform 1 (West / Metro End)", "PLATFORM", 745.0, 980.9, 0, True, True, True, "Platform 1 Western End near Metro bridge", "Platform")
add_node("node_pf1_center", "Platform 1 Center", "PLATFORM", 1520.0, 980.9, 0, True, True, True, "Platform 1 Main Boarding Zone", "Platform", "QR-KSR-PF1-CENTER")
add_node("node_pf1_east", "Platform 1 (East / FOB 2 End)", "PLATFORM", 2200.0, 980.9, 0, True, True, True, "Platform 1 Eastern Boarding Zone", "Platform")
add_node("node_pf1_toilet", "Restroom Platform 1 West", "TOILET", 1372.5, 1053.2, 0, True, True, True, "Platform 1 West Restroom", "_x39__TOILET_4_")
add_node("node_pf1_lift3", "Lift 3 (Platform 1 East)", "LIFT", 2659.2, 973.8, 0, True, True, True, "Lift 3 Tower on Platform 1 East", "_x31__lift_3_")
add_node("node_pf1_stair_fob2", "Stair PF 1 to FOB 2", "STAIRS", 2620.0, 960.0, 0, False, False, False, "Stairs to FOB 2 on Platform 1", "Stair")
add_node("node_pf1_2_ramp3", "Ramp 3 / Ramp 5 (PF 1/2)", "RAMP", 2586.0, 1000.0, 0, True, True, True, "Accessible Ramp 3 to FOB 2", "Ramp_3_")

# Direct ground connections from T1 concourse to Platform 1
add_edge("e_t1_west_to_pf1_center", "node_t1_west_corridor", "node_pf1_center", "WALKWAY", 0)
add_edge("e_t1_east_to_pf1_east", "node_t1_east_corridor", "node_pf1_east", "WALKWAY", 0)
add_edge("e_pf1_w_to_c", "node_pf1_west", "node_pf1_center", "WALKWAY", 0)
add_edge("e_pf1_c_to_e", "node_pf1_center", "node_pf1_east", "WALKWAY", 0)
add_edge("e_pf1_c_to_toilet", "node_pf1_center", "node_pf1_toilet", "WALKWAY", 0)
add_edge("e_pf1_e_to_lift3", "node_pf1_east", "node_pf1_lift3", "WALKWAY", 0)
add_edge("e_pf1_e_to_stair_fob2", "node_pf1_east", "node_pf1_stair_fob2", "WALKWAY", 0)
add_edge("e_pf1_e_to_ramp3", "node_pf1_east", "node_pf1_2_ramp3", "WALKWAY", 0)
add_edge("e_pf1_e_to_t2_walkway", "node_pf1_east", "node_t2_pf1_walkway", "WALKWAY", 0)

# Platforms 2 & 3
add_node("node_pf2_center", "Platform 2 Center", "PLATFORM", 1500.0, 889.8, 0, True, True, True, "Platform 2 Boarding Area", "Platform")
add_node("node_pf3_center", "Platform 3 Center", "PLATFORM", 1500.0, 832.7, 0, True, True, True, "Platform 3 Boarding Area", "Platform")
add_node("node_pf2_3_east", "Platform 2/3 East FOB Access", "JUNCTION", 2440.0, 860.0, 0, True, True, True, "Platform 2/3 East Access to FOB 2", "Platform")
add_node("node_pf2_3_west", "Platform 2/3 West Metro Access", "JUNCTION", 745.0, 860.0, 0, True, True, True, "Platform 2/3 West Access to Metro FOB", "Platform")
add_node("node_pf2_3_toilet", "Restroom Platform 2/3", "TOILET", 1575.0, 865.3, 0, True, True, True, "Platform 2/3 Restroom", "_x38__TOILET_1_")

add_edge("e_pf2_to_pf3", "node_pf2_center", "node_pf3_center", "WALKWAY", 0)
add_edge("e_pf2_to_east", "node_pf2_center", "node_pf2_3_east", "WALKWAY", 0)
add_edge("e_pf3_to_east", "node_pf3_center", "node_pf2_3_east", "WALKWAY", 0)
add_edge("e_pf2_to_west", "node_pf2_center", "node_pf2_3_west", "WALKWAY", 0)
add_edge("e_pf3_to_west", "node_pf3_center", "node_pf2_3_west", "WALKWAY", 0)
add_edge("e_pf2_3_to_toilet", "node_pf2_center", "node_pf2_3_toilet", "WALKWAY", 0)

# Platforms 4 & 5
add_node("node_pf4_center", "Platform 4 Center", "PLATFORM", 1400.0, 725.7, 0, True, True, True, "Platform 4 Boarding Area", "Platform")
add_node("node_pf5_center", "Platform 5 Center", "PLATFORM", 1500.0, 600.7, 0, True, True, True, "Platform 5 Boarding Area", "Platform")
add_node("node_pf4_5_ramp2", "Ramp 2 / Ramp 6 (PF 4/5)", "RAMP", 2550.0, 725.0, 0, True, True, True, "Accessible Ramp 2 to FOB 2", "Ramp_2_")
add_node("node_pf4_5_stair_fob2", "Stair PF 4/5 to FOB 2", "STAIRS", 2560.0, 690.0, 0, False, False, False, "Staircase to FOB 2", "Stair")
add_node("node_pf4_toilet", "Restroom Platform 4", "TOILET", 1271.1, 735.7, 0, False, False, True, "Platform 4 Restroom", "_x39__TOILET_3_")
add_node("node_pf4_west", "Platform 4 West Metro Access", "JUNCTION", 745.0, 725.7, 0, True, True, True, "Platform 4 West End", "Platform")
add_node("node_pf5_west", "Platform 5 West Metro Access", "JUNCTION", 745.0, 600.7, 0, True, True, True, "Platform 5 West End", "Platform")

add_edge("e_pf4_to_ramp2", "node_pf4_center", "node_pf4_5_ramp2", "WALKWAY", 0)
add_edge("e_pf5_to_ramp2", "node_pf5_center", "node_pf4_5_ramp2", "WALKWAY", 0)
add_edge("e_pf4_to_stair", "node_pf4_center", "node_pf4_5_stair_fob2", "WALKWAY", 0)
add_edge("e_pf5_to_stair", "node_pf5_center", "node_pf4_5_stair_fob2", "WALKWAY", 0)
add_edge("e_pf4_to_toilet", "node_pf4_center", "node_pf4_toilet", "WALKWAY", 0)
add_edge("e_pf4_to_west", "node_pf4_center", "node_pf4_west", "WALKWAY", 0)
add_edge("e_pf5_to_west", "node_pf5_center", "node_pf5_west", "WALKWAY", 0)

# Platform 6
add_node("node_pf6_center", "Platform 6 Center", "PLATFORM", 1500.0, 548.5, 0, True, True, True, "Platform 6 Boarding Area", "Platform")
add_node("node_pf5_6_toilet", "Restroom Platform 5/6", "TOILET", 1368.2, 582.2, 0, True, True, True, "Platform 5/6 Restroom", "_x39__TOILET_1_")
add_node("node_pf6_west", "Platform 6 West Metro Access", "JUNCTION", 745.0, 548.5, 0, True, True, True, "Platform 6 West End", "Platform")

add_edge("e_pf5_to_pf6", "node_pf5_center", "node_pf6_center", "WALKWAY", 0)
add_edge("e_pf6_to_ramp2", "node_pf6_center", "node_pf4_5_ramp2", "WALKWAY", 0)
add_edge("e_pf6_to_toilet", "node_pf6_center", "node_pf5_6_toilet", "WALKWAY", 0)
add_edge("e_pf6_to_west", "node_pf6_center", "node_pf6_west", "WALKWAY", 0)

# Platforms 7 & 8 (CRITICAL DESTINATION PLATFORM 8)
add_node("node_pf7_center", "Platform 7 Center", "PLATFORM", 1450.0, 450.6, 0, True, True, True, "Platform 7 Boarding Area", "Platform")
add_node("node_pf8_center", "Platform 8 Center", "PLATFORM", 1450.0, 375.9, 0, True, True, True, "Platform 8 Main Passenger Boarding Zone", "Platform", "QR-KSR-PF8-CENTER")
add_node("node_pf8_lift1", "Lift 1 (Platform 7/8)", "LIFT", 2586.7, 434.2, 0, True, True, True, "Lift 1 Tower beside FOB 2 East Stairs", "LIFT", "QR-KSR-PF8-LIFT1")
add_node("node_pf8_ramp1", "Ramp 1 / Ramp 7 (Platform 7/8)", "RAMP", 2702.1, 465.4, 0, True, True, True, "Wide Sloped Ramp to FOB 2", "Ramp_1_")
add_node("node_pf8_stair_fob2", "Stair PF 7/8 to FOB 2", "STAIRS", 2603.0, 440.0, 0, False, False, False, "Concrete Staircase to FOB 2", "Stair")
add_node("node_pf7_8_toilet", "Restroom Platform 7/8", "TOILET", 1480.0, 378.6, 0, True, True, True, "Platform 7/8 Restroom", "_x38__TOILET_2_")
add_node("node_pf7_west", "Platform 7 West Metro Access", "JUNCTION", 745.0, 450.6, 0, True, True, True, "Platform 7 West End", "Platform")
add_node("node_pf8_west", "Platform 8 West Metro Access", "JUNCTION", 745.0, 375.9, 0, True, True, True, "Platform 8 West End", "Platform")

add_edge("e_pf7_to_pf8", "node_pf7_center", "node_pf8_center", "WALKWAY", 0)
add_edge("e_pf8_to_lift1", "node_pf8_center", "node_pf8_lift1", "WALKWAY", 0)
add_edge("e_pf8_to_ramp1", "node_pf8_center", "node_pf8_ramp1", "WALKWAY", 0)
add_edge("e_pf8_to_stair_fob2", "node_pf8_center", "node_pf8_stair_fob2", "WALKWAY", 0)
add_edge("e_pf7_to_lift1", "node_pf7_center", "node_pf8_lift1", "WALKWAY", 0)
add_edge("e_pf7_to_ramp1", "node_pf7_center", "node_pf8_ramp1", "WALKWAY", 0)
add_edge("e_pf8_to_toilet", "node_pf8_center", "node_pf7_8_toilet", "WALKWAY", 0)
add_edge("e_pf7_to_west", "node_pf7_center", "node_pf7_west", "WALKWAY", 0)
add_edge("e_pf8_to_west", "node_pf8_center", "node_pf8_west", "WALKWAY", 0)

# Platforms 9 & 10
add_node("node_pf9_center", "Platform 9 Center", "PLATFORM", 1400.0, 278.9, 0, True, True, True, "Platform 9 Boarding Area", "Platform")
add_node("node_pf10_center", "Platform 10 Center", "PLATFORM", 1400.0, 214.6, 0, True, True, True, "Platform 10 Boarding Area", "Platform")
add_node("node_pf9_10_east", "Platform 9/10 East FOB Access", "JUNCTION", 2450.0, 245.0, 0, True, True, True, "Platform 9/10 East FOB Access", "Platform")
add_node("node_pf9_10_toilet", "Restroom Platform 9/10 East", "TOILET", 2630.0, 262.4, 0, False, False, True, "Platform 9/10 East Restroom", "_x39__TOILET_2_")
add_node("node_pf9_west", "Platform 9 West Metro Access", "JUNCTION", 745.0, 278.9, 0, True, True, True, "Platform 9 West End", "Platform")
add_node("node_pf10_west", "Platform 10 West Metro Access", "JUNCTION", 745.0, 214.6, 0, True, True, True, "Platform 10 West End", "Platform")

add_edge("e_pf9_to_pf10", "node_pf9_center", "node_pf10_center", "WALKWAY", 0)
add_edge("e_pf9_to_east", "node_pf9_center", "node_pf9_10_east", "WALKWAY", 0)
add_edge("e_pf10_to_east", "node_pf10_center", "node_pf9_10_east", "WALKWAY", 0)
add_edge("e_pf9_10_to_toilet", "node_pf9_10_east", "node_pf9_10_toilet", "WALKWAY", 0)
add_edge("e_pf9_to_west", "node_pf9_center", "node_pf9_west", "WALKWAY", 0)
add_edge("e_pf10_to_west", "node_pf10_center", "node_pf10_west", "WALKWAY", 0)

# 6. FOB 2 (OKKALPURAM / DHARMAVARAM END) - LEVEL 1 (+1)
add_node("node_fob2_pf1", "FOB 2 above Platform 1", "JUNCTION", 2618.0, 973.8, 1, True, True, True, "Footover Bridge 2 Concourse over PF 1", "FOB_2", "QR-KSR-FOB2-PF1")
add_node("node_fob2_pf2_3", "FOB 2 above Platform 2/3", "JUNCTION", 2618.0, 860.0, 1, True, True, True, "Footover Bridge 2 Concourse over PF 2/3", "FOB_2")
add_node("node_fob2_pf4_5", "FOB 2 above Platform 4/5", "JUNCTION", 2618.0, 720.0, 1, True, True, True, "Footover Bridge 2 Concourse over PF 4/5", "FOB_2")
add_node("node_fob2_pf6", "FOB 2 above Platform 6", "JUNCTION", 2618.0, 580.0, 1, True, True, True, "Footover Bridge 2 Concourse over PF 6", "FOB_2")
add_node("node_fob2_pf7_8", "FOB 2 above Platform 7/8", "JUNCTION", 2618.0, 434.2, 1, True, True, True, "Footover Bridge 2 Concourse over PF 7/8", "FOB_2", "QR-KSR-FOB2-PF8")
add_node("node_fob2_pf9_10", "FOB 2 above Platform 9/10", "JUNCTION", 2618.0, 245.0, 1, True, True, True, "Footover Bridge 2 Concourse over PF 9/10", "FOB_2")

# Bridge spine along FOB 2
add_edge("e_fob2_1_to_23", "node_fob2_pf1", "node_fob2_pf2_3", "FOB", 1)
add_edge("e_fob2_23_to_45", "node_fob2_pf2_3", "node_fob2_pf4_5", "FOB", 1)
add_edge("e_fob2_45_to_6", "node_fob2_pf4_5", "node_fob2_pf6", "FOB", 1)
add_edge("e_fob2_6_to_78", "node_fob2_pf6", "node_fob2_pf7_8", "FOB", 1)
add_edge("e_fob2_78_to_910", "node_fob2_pf7_8", "node_fob2_pf9_10", "FOB", 1)

# VERTICAL TRANSITIONS ON FOB 2 (LIFTS, RAMPS, STAIRS)
# Lift 1 (Level 0 <-> Level 1)
add_edge("vc_edge_lift1", "node_pf8_lift1", "node_fob2_pf7_8", "LIFT", 0, True, True, True)
# Ramp 1 (Level 0 <-> Level 1)
add_edge("vc_edge_ramp1", "node_pf8_ramp1", "node_fob2_pf7_8", "RAMP", 0, True, True, True)
# Stair PF 7/8 (Level 0 <-> Level 1)
add_edge("vc_edge_stair_pf8", "node_pf8_stair_fob2", "node_fob2_pf7_8", "STAIRS", 0, False, False, False)

# Lift 3 (Level 0 <-> Level 1)
add_edge("vc_edge_lift3", "node_pf1_lift3", "node_fob2_pf1", "LIFT", 0, True, True, True)
# Ramp 3 (Level 0 <-> Level 1)
add_edge("vc_edge_ramp3", "node_pf1_2_ramp3", "node_fob2_pf1", "RAMP", 0, True, True, True)
# Stair PF 1 (Level 0 <-> Level 1)
add_edge("vc_edge_stair_pf1", "node_pf1_stair_fob2", "node_fob2_pf1", "STAIRS", 0, False, False, False)

# Ramp 2 (Level 0 <-> Level 1)
add_edge("vc_edge_ramp2", "node_pf4_5_ramp2", "node_fob2_pf4_5", "RAMP", 0, True, True, True)
# Stair PF 4/5 (Level 0 <-> Level 1)
add_edge("vc_edge_stair_pf4_5", "node_pf4_5_stair_fob2", "node_fob2_pf4_5", "STAIRS", 0, False, False, False)

# FOB 2 to PF 2/3 & PF 9/10 stairs
add_edge("vc_edge_stair_pf2_3", "node_pf2_3_east", "node_fob2_pf2_3", "STAIRS", 0, False, False, False)
add_edge("vc_edge_stair_pf9_10", "node_pf9_10_east", "node_fob2_pf9_10", "STAIRS", 0, False, False, False)

# 7. METRO FOB (WEST END) - LEVEL 1 (+1)
add_node("node_metro_fob_t3", "Metro Bridge over Terminal 3", "JUNCTION", 745.0, 1050.0, 1, True, True, True, "Elevated Metro Concourse Entrance", "Metro_FOB")
add_node("node_metro_fob_pf1", "Metro Bridge over Platform 1", "JUNCTION", 745.0, 980.9, 1, True, True, True, "Elevated Bridge over PF 1", "Metro_FOB")
add_node("node_metro_fob_pf2_3", "Metro Bridge over Platform 2/3", "JUNCTION", 745.0, 860.0, 1, True, True, True, "Elevated Bridge over PF 2/3", "Metro_FOB")
add_node("node_metro_fob_pf4", "Metro Bridge over Platform 4", "JUNCTION", 745.0, 725.7, 1, True, True, True, "Elevated Bridge over PF 4", "Metro_FOB")
add_node("node_metro_fob_pf5_6", "Metro Bridge over Platform 5/6", "JUNCTION", 745.0, 575.0, 1, True, True, True, "Elevated Bridge over PF 5/6", "Metro_FOB")
add_node("node_metro_fob_pf7_8", "Metro Bridge over Platform 7/8", "JUNCTION", 745.0, 410.0, 1, True, True, True, "Elevated Bridge over PF 7/8", "Metro_FOB")
add_node("node_metro_fob_pf9_10", "Metro Bridge over Platform 9/10", "JUNCTION", 745.0, 245.0, 1, True, True, True, "Elevated Bridge over PF 9/10", "Metro_FOB")

# Metro FOB spine
add_edge("e_metro_fob_t3_to_1", "node_metro_fob_t3", "node_metro_fob_pf1", "FOB", 1)
add_edge("e_metro_fob_1_to_23", "node_metro_fob_pf1", "node_metro_fob_pf2_3", "FOB", 1)
add_edge("e_metro_fob_23_to_4", "node_metro_fob_pf2_3", "node_metro_fob_pf4", "FOB", 1)
add_edge("e_metro_fob_4_to_56", "node_metro_fob_pf4", "node_metro_fob_pf5_6", "FOB", 1)
add_edge("e_metro_fob_56_to_78", "node_metro_fob_pf5_6", "node_metro_fob_pf7_8", "FOB", 1)
add_edge("e_metro_fob_78_to_910", "node_metro_fob_pf7_8", "node_metro_fob_pf9_10", "FOB", 1)

# Metro FOB ramps/stairs to platforms
add_edge("vc_edge_metro_ramp_t3", "node_t3_metro_bridge_ramp", "node_metro_fob_t3", "RAMP", 0, True, True, True)
add_edge("vc_edge_metro_to_pf1", "node_pf1_west", "node_metro_fob_pf1", "RAMP", 0, True, True, True)
add_edge("vc_edge_metro_to_pf2_3", "node_pf2_3_west", "node_metro_fob_pf2_3", "RAMP", 0, True, True, True)
add_edge("vc_edge_metro_to_pf4", "node_pf4_west", "node_metro_fob_pf4", "RAMP", 0, True, True, True)
add_edge("vc_edge_metro_to_pf5_6", "node_pf5_west", "node_metro_fob_pf5_6", "RAMP", 0, True, True, True)
add_edge("vc_edge_metro_to_pf7_8", "node_pf7_west", "node_metro_fob_pf7_8", "RAMP", 0, True, True, True)
add_edge("vc_edge_metro_to_pf9_10", "node_pf9_west", "node_metro_fob_pf9_10", "RAMP", 0, True, True, True)

# 8. MAJESTIC SUBWAY (LEVEL -1)
add_node("node_subway_t1_l_minus_1", "Subway Central Hall (Level -1)", "SUBWAY", 1547.2, 1175.7, -1, True, True, True, "Underground Subway Concourse", "Floor_n_subwy")
add_node("node_subway_lift2_l_minus_1", "Lift 2 Subway Landing (Level -1)", "LIFT", 1661.7, 1110.6, -1, True, True, True, "Lift 2 Lower Landing in Subway", "Floor_n_subwy")
add_node("node_subway_pf1", "Subway Platform 1 Portal", "SUBWAY", 1450.0, 980.9, -1, True, True, True, "Subway Access to Platform 1", "Floor_n_subwy")
add_node("node_subway_pf2_3", "Subway Platform 2/3 Portal", "SUBWAY", 1450.0, 860.0, -1, True, True, True, "Subway Access to Platform 2/3", "Floor_n_subwy")
add_node("node_subway_pf4", "Subway Platform 4 Portal", "SUBWAY", 1450.0, 725.7, -1, True, True, True, "Subway Access to Platform 4", "Floor_n_subwy")
add_node("node_subway_pf7_8", "Subway Platform 7/8 Portal", "SUBWAY", 1450.0, 410.0, -1, True, True, True, "Subway Access to Platform 7/8", "Floor_n_subwy")

# Subway spine
add_edge("e_subway_t1_to_lift2", "node_subway_t1_l_minus_1", "node_subway_lift2_l_minus_1", "WALKWAY", -1)
add_edge("e_subway_t1_to_pf1", "node_subway_t1_l_minus_1", "node_subway_pf1", "WALKWAY", -1)
add_edge("e_subway_pf1_to_pf23", "node_subway_pf1", "node_subway_pf2_3", "WALKWAY", -1)
add_edge("e_subway_pf23_to_pf4", "node_subway_pf2_3", "node_subway_pf4", "WALKWAY", -1)
add_edge("e_subway_pf4_to_pf78", "node_subway_pf4", "node_subway_pf7_8", "WALKWAY", -1)

# Vertical transitions into subway
# Lift 2 (Level 0 <-> Level -1)
add_edge("vc_edge_lift2", "node_t1_lift2_l0", "node_subway_lift2_l_minus_1", "LIFT", 0, True, True, True)
# Subway Ramp from T1 (Level 0 <-> Level -1)
add_edge("vc_edge_ramp_subway", "node_t1_ramp_subway_l0", "node_subway_t1_l_minus_1", "RAMP", 0, True, True, True)
# Subway Stairs from T1 (Level 0 <-> Level -1)
add_edge("vc_edge_stair_subway", "node_t1_stair_subway_l0", "node_subway_t1_l_minus_1", "STAIRS", 0, False, False, False)

# Portal stairs to platforms from subway
add_edge("vc_edge_sub_to_pf1", "node_subway_pf1", "node_pf1_center", "STAIRS", -1, False, False, False)
add_edge("vc_edge_sub_to_pf23", "node_subway_pf2_3", "node_pf2_center", "STAIRS", -1, False, False, False)
add_edge("vc_edge_sub_to_pf4", "node_subway_pf4", "node_pf4_center", "STAIRS", -1, False, False, False)
add_edge("vc_edge_sub_to_pf78", "node_subway_pf7_8", "node_pf8_center", "STAIRS", -1, False, False, False)

# Save nodes and edges
with open('data/station/nodes.json', 'w', encoding='utf-8') as f:
    json.dump(nodes, f, indent=2)

with open('data/station/edges.json', 'w', encoding='utf-8') as f:
    json.dump(edges, f, indent=2)

print(f"Generated {len(nodes)} nodes and {len(edges)} directed edges!")
