import json
import os
import math
import re

print("=== BUILDING REAL KSR BENGALURU STATION DATA MODEL ===")

os.makedirs('data/station', exist_ok=True)
os.makedirs('data/accessibility', exist_ok=True)
os.makedirs('data/simulation', exist_ok=True)
os.makedirs('data/processed', exist_ok=True)

# 1. PLATFORM DATABASE (Platforms 1 to 10)
# Verified exact coordinates from SVG badges and layout:
# Platform 10: Y ~ 214.6
# Platform 9:  Y ~ 278.9
# Platform 8:  Y ~ 375.9
# Platform 7:  Y ~ 450.6
# Platform 6:  Y ~ 548.5
# Platform 5:  Y ~ 600.7 (east badge 660.8, 715.0)
# Platform 4:  Y ~ 725.7
# Platform 3:  Y ~ 832.7
# Platform 2:  Y ~ 889.8
# Platform 1:  Y ~ 980.9

platforms_data = [
    {
        "id": "platform_1",
        "name": "Platform 1",
        "number": 1,
        "level": 0,
        "center": {"x": 1520.0, "y": 980.9},
        "badgeLeft": {"x": 862.3, "y": 980.9},
        "badgeRight": {"x": 2172.6, "y": 971.2},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[450.0, 945.0], [2750.0, 945.0], [2750.0, 1015.0], [450.0, 1015.0]]
        },
        "description": "Main primary platform directly adjacent to Terminal 1 Concourse. Direct level access without vertical transition.",
        "nearestPathways": ["pathway_t1_concourse", "pathway_pf1_central"],
        "nearestEntrances": ["entry_t1_main_east", "entry_t1_main_west"],
        "nearestFobConnections": ["fob1_pf1", "fob2_pf1", "metro_fob_pf1"],
        "nearestLifts": ["lift_3", "lift_2"],
        "nearestStairs": ["stair_pf1_fob1", "stair_pf1_fob2", "stair_pf1_subway"],
        "nearestRamps": ["ramp_3", "ramp_5", "ramp_t1_subway"],
        "nearestToilets": ["toilet_pf1_west", "toilet_t1_main"],
        "accessibility": {
            "wheelchairAccessible": True,
            "stepFreeAccess": True,
            "tactilePaving": True,
            "notes": "Direct ground level access from Terminal 1; Ramps and Lift 3 connect to FOB 2."
        }
    },
    {
        "id": "platform_2",
        "name": "Platform 2",
        "number": 2,
        "level": 0,
        "center": {"x": 1500.0, "y": 889.8},
        "badgeLeft": {"x": 862.3, "y": 889.8},
        "badgeRight": {"x": 2444.7, "y": 889.3},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[420.0, 865.0], [2600.0, 865.0], [2600.0, 915.0], [420.0, 915.0]]
        },
        "description": "Island platform sharing concourse with Platform 3.",
        "nearestPathways": ["pathway_pf2_3_central"],
        "nearestEntrances": ["entry_t1_main_east", "entry_t1_main_west"],
        "nearestFobConnections": ["fob1_pf2_3", "fob2_pf2_3", "metro_fob_pf2"],
        "nearestLifts": ["lift_3"],
        "nearestStairs": ["stair_pf2_3_fob1", "stair_pf2_3_fob2"],
        "nearestRamps": ["ramp_3", "ramp_5"],
        "nearestToilets": ["toilet_pf2_3"],
        "accessibility": {
            "wheelchairAccessible": True,
            "stepFreeAccess": True,
            "tactilePaving": True,
            "notes": "Accessible via Ramp 3/5 on FOB 2 and Majestic Subway Ramp."
        }
    },
    {
        "id": "platform_3",
        "name": "Platform 3",
        "number": 3,
        "level": 0,
        "center": {"x": 1500.0, "y": 832.7},
        "badgeLeft": {"x": 862.3, "y": 832.7},
        "badgeRight": {"x": 2440.1, "y": 830.4},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[420.0, 810.0], [2600.0, 810.0], [2600.0, 860.0], [420.0, 860.0]]
        },
        "description": "Island platform sharing concourse with Platform 2.",
        "nearestPathways": ["pathway_pf2_3_central"],
        "nearestEntrances": ["entry_t1_main_east", "entry_t1_main_west"],
        "nearestFobConnections": ["fob1_pf2_3", "fob2_pf2_3", "metro_fob_pf3"],
        "nearestLifts": ["lift_3"],
        "nearestStairs": ["stair_pf2_3_fob1", "stair_pf2_3_fob2"],
        "nearestRamps": ["ramp_3", "ramp_5"],
        "nearestToilets": ["toilet_pf2_3"],
        "accessibility": {
            "wheelchairAccessible": True,
            "stepFreeAccess": True,
            "tactilePaving": True,
            "notes": "Accessible via Ramp 3/5 on FOB 2 and Majestic Subway Ramp."
        }
    },
    {
        "id": "platform_4",
        "name": "Platform 4",
        "number": 4,
        "level": 0,
        "center": {"x": 1400.0, "y": 725.7},
        "badgeLeft": {"x": 862.3, "y": 725.7},
        "badgeRight": {"x": 1961.9, "y": 725.1},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[420.0, 705.0], [2200.0, 705.0], [2200.0, 755.0], [420.0, 755.0]]
        },
        "description": "Central through platform with express train connectivity.",
        "nearestPathways": ["pathway_pf4_central"],
        "nearestEntrances": ["entry_t1_main_west"],
        "nearestFobConnections": ["fob1_pf4", "fob2_pf4_5", "metro_fob_pf4"],
        "nearestLifts": ["lift_1"],
        "nearestStairs": ["stair_pf4_fob1", "stair_pf4_fob2"],
        "nearestRamps": ["ramp_2", "ramp_6"],
        "nearestToilets": ["toilet_pf4"],
        "accessibility": {
            "wheelchairAccessible": True,
            "stepFreeAccess": True,
            "tactilePaving": True,
            "notes": "Accessible via Ramp 2/6 to FOB 2 and Subway."
        }
    },
    {
        "id": "platform_5",
        "name": "Platform 5",
        "number": 5,
        "level": 0,
        "center": {"x": 1500.0, "y": 600.7},
        "badgeLeft": {"x": 862.3, "y": 600.7},
        "badgeRight": {"x": 2438.5, "y": 715.0},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[420.0, 580.0], [2600.0, 580.0], [2600.0, 630.0], [420.0, 630.0]]
        },
        "description": "Island platform sharing island with Platform 6.",
        "nearestPathways": ["pathway_pf5_6_central"],
        "nearestEntrances": ["entry_t2_east"],
        "nearestFobConnections": ["fob1_pf5_6", "fob2_pf4_5", "metro_fob_pf5"],
        "nearestLifts": ["lift_1"],
        "nearestStairs": ["stair_pf5_6_fob1", "stair_pf5_6_fob2"],
        "nearestRamps": ["ramp_2", "ramp_6"],
        "nearestToilets": ["toilet_pf5_6"],
        "accessibility": {
            "wheelchairAccessible": True,
            "stepFreeAccess": True,
            "tactilePaving": True,
            "notes": "Accessible via Ramp 2/6 to FOB 2."
        }
    },
    {
        "id": "platform_6",
        "name": "Platform 6",
        "number": 6,
        "level": 0,
        "center": {"x": 1500.0, "y": 548.5},
        "badgeLeft": {"x": 862.3, "y": 548.5},
        "badgeRight": {"x": 2437.4, "y": 660.8},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[420.0, 530.0], [2600.0, 530.0], [2600.0, 575.0], [420.0, 575.0]]
        },
        "description": "Island platform sharing island with Platform 5.",
        "nearestPathways": ["pathway_pf5_6_central"],
        "nearestEntrances": ["entry_t2_east"],
        "nearestFobConnections": ["fob1_pf5_6", "fob2_pf4_5", "metro_fob_pf6"],
        "nearestLifts": ["lift_1"],
        "nearestStairs": ["stair_pf5_6_fob1", "stair_pf5_6_fob2"],
        "nearestRamps": ["ramp_2", "ramp_6"],
        "nearestToilets": ["toilet_pf5_6"],
        "accessibility": {
            "wheelchairAccessible": True,
            "stepFreeAccess": True,
            "tactilePaving": True,
            "notes": "Accessible via Ramp 2/6 to FOB 2."
        }
    },
    {
        "id": "platform_7",
        "name": "Platform 7",
        "number": 7,
        "level": 0,
        "center": {"x": 1450.0, "y": 450.6},
        "badgeLeft": {"x": 862.3, "y": 450.6},
        "badgeRight": {"x": 2295.5, "y": 464.6},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[420.0, 430.0], [2500.0, 430.0], [2500.0, 475.0], [420.0, 475.0]]
        },
        "description": "Island platform paired with Platform 8. Direct connection to Lift 1 and Ramp 1/7 on FOB 2.",
        "nearestPathways": ["pathway_pf7_8_central"],
        "nearestEntrances": ["entry_t2_east"],
        "nearestFobConnections": ["fob1_pf7_8", "fob2_pf7_8", "metro_fob_pf7"],
        "nearestLifts": ["lift_1"],
        "nearestStairs": ["stair_pf7_8_fob1", "stair_pf7_8_fob2"],
        "nearestRamps": ["ramp_1", "ramp_7"],
        "nearestToilets": ["toilet_pf7_8"],
        "accessibility": {
            "wheelchairAccessible": True,
            "stepFreeAccess": True,
            "tactilePaving": True,
            "notes": "Fully wheelchair accessible via Lift 1 and Ramp 1/7 to FOB 2."
        }
    },
    {
        "id": "platform_8",
        "name": "Platform 8",
        "number": 8,
        "level": 0,
        "center": {"x": 1450.0, "y": 375.9},
        "badgeLeft": {"x": 862.3, "y": 375.9},
        "badgeRight": {"x": 2295.5, "y": 376.1},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[420.0, 355.0], [2500.0, 355.0], [2500.0, 400.0], [420.0, 400.0]]
        },
        "description": "High-priority long-distance passenger platform. Paired with Platform 7. Equipped with Lift 1 at eastern FOB 2 junction.",
        "nearestPathways": ["pathway_pf7_8_central"],
        "nearestEntrances": ["entry_t2_east", "entry_t1_main_east"],
        "nearestFobConnections": ["fob1_pf7_8", "fob2_pf7_8", "metro_fob_pf8"],
        "nearestLifts": ["lift_1"],
        "nearestStairs": ["stair_pf7_8_fob1", "stair_pf7_8_fob2"],
        "nearestRamps": ["ramp_1", "ramp_7"],
        "nearestToilets": ["toilet_pf7_8"],
        "accessibility": {
            "wheelchairAccessible": True,
            "stepFreeAccess": True,
            "tactilePaving": True,
            "notes": "Primary accessible destination. Directly served by Lift 1 (X: 2586.7, Y: 434.2) and Ramp 1/7."
        }
    },
    {
        "id": "platform_9",
        "name": "Platform 9",
        "number": 9,
        "level": 0,
        "center": {"x": 1400.0, "y": 278.9},
        "badgeLeft": {"x": 862.3, "y": 278.9},
        "badgeRight": {"x": 2294.4, "y": 278.9},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[420.0, 255.0], [2450.0, 255.0], [2450.0, 305.0], [420.0, 305.0]]
        },
        "description": "Island platform paired with Platform 10. Northern section of station.",
        "nearestPathways": ["pathway_pf9_10_central"],
        "nearestEntrances": ["entry_t2_okklapura"],
        "nearestFobConnections": ["fob1_pf9_10", "fob2_pf9_10", "metro_fob_pf9"],
        "nearestLifts": ["lift_1"],
        "nearestStairs": ["stair_pf9_10_fob1", "stair_pf9_10_fob2"],
        "nearestRamps": ["ramp_1"],
        "nearestToilets": ["toilet_pf9_10_east"],
        "accessibility": {
            "wheelchairAccessible": True,
            "stepFreeAccess": True,
            "tactilePaving": True,
            "notes": "Connected to FOB 1 and FOB 2."
        }
    },
    {
        "id": "platform_10",
        "name": "Platform 10",
        "number": 10,
        "level": 0,
        "center": {"x": 1400.0, "y": 214.6},
        "badgeLeft": {"x": 862.3, "y": 214.6},
        "badgeRight": {"x": 2294.4, "y": 214.7},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[420.0, 190.0], [2450.0, 190.0], [2450.0, 245.0], [420.0, 245.0]]
        },
        "description": "Northernmost passenger platform with direct western FOB connection to Metro.",
        "nearestPathways": ["pathway_pf9_10_central"],
        "nearestEntrances": ["entry_t2_okklapura"],
        "nearestFobConnections": ["fob1_pf9_10", "fob2_pf9_10", "metro_fob_pf10"],
        "nearestLifts": ["lift_1"],
        "nearestStairs": ["stair_pf9_10_fob1", "stair_pf9_10_fob2"],
        "nearestRamps": ["ramp_1"],
        "nearestToilets": ["toilet_pf9_10_east"],
        "accessibility": {
            "wheelchairAccessible": True,
            "stepFreeAccess": True,
            "tactilePaving": True,
            "notes": "Direct access to Mysuru End FOB and Metro bridge."
        }
    }
]

with open('data/station/platforms.json', 'w', encoding='utf-8') as f:
    json.dump(platforms_data, f, indent=2)
print("-> data/station/platforms.json created (10 platforms)")

# 2. FACILITIES DATABASE
facilities_data = [
    # Lifts
    {
        "id": "lift_1",
        "name": "Lift 1 (Platform 7/8)",
        "type": "LIFT",
        "coordinates": {"x": 2586.7, "y": 434.2},
        "layer": "LIFT",
        "level": 0,
        "connectsLevels": [0, 1],
        "accessibility": {"wheelchairAccessible": True, "brailleBrailleButtons": True, "audioAnnouncement": True},
        "status": "OPEN",
        "description": "Connects Platform 7/8 directly to Okkalpuram Footover Bridge (FOB 2)."
    },
    {
        "id": "lift_2",
        "name": "Lift 2 (Terminal 1 Concourse)",
        "type": "LIFT",
        "coordinates": {"x": 1661.7, "y": 1110.6},
        "layer": "_x31__lift_2_",
        "level": 0,
        "connectsLevels": [0, -1],
        "accessibility": {"wheelchairAccessible": True, "brailleBrailleButtons": True, "audioAnnouncement": True},
        "status": "OPEN",
        "description": "Connects Terminal 1 Main Concourse to Majestic Underground Subway."
    },
    {
        "id": "lift_3",
        "name": "Lift 3 (Platform 1 East)",
        "type": "LIFT",
        "coordinates": {"x": 2659.2, "y": 973.8},
        "layer": "_x31__lift_3_",
        "level": 0,
        "connectsLevels": [0, 1],
        "accessibility": {"wheelchairAccessible": True, "brailleBrailleButtons": True, "audioAnnouncement": True},
        "status": "OPEN",
        "description": "Connects Platform 1 East concourse to FOB 2 and Terminal 2 walkway."
    },
    # Ramps
    {
        "id": "ramp_1",
        "name": "Ramp 1 / Ramp 7 (Platform 7/8)",
        "type": "RAMP",
        "coordinates": {"x": 2702.1, "y": 465.4},
        "layer": "Ramp_1_",
        "level": 0,
        "connectsLevels": [0, 1],
        "accessibility": {"wheelchairAccessible": True, "slopeGradient": "1:12", "handrails": True},
        "status": "OPEN",
        "description": "Gentle slope accessible ramp from Platform 7/8 up to FOB 2."
    },
    {
        "id": "ramp_2",
        "name": "Ramp 2 / Ramp 6 (Platform 4/5)",
        "type": "RAMP",
        "coordinates": {"x": 2550.0, "y": 725.0},
        "layer": "Ramp_2_",
        "level": 0,
        "connectsLevels": [0, 1],
        "accessibility": {"wheelchairAccessible": True, "slopeGradient": "1:12", "handrails": True},
        "status": "OPEN",
        "description": "Accessible ramp connecting Platform 4 and 5 to FOB 2."
    },
    {
        "id": "ramp_3",
        "name": "Ramp 3 / Ramp 5 (Platform 1/2)",
        "type": "RAMP",
        "coordinates": {"x": 2586.0, "y": 1000.0},
        "layer": "Ramp_3_",
        "level": 0,
        "connectsLevels": [0, 1],
        "accessibility": {"wheelchairAccessible": True, "slopeGradient": "1:12", "handrails": True},
        "status": "OPEN",
        "description": "Accessible ramp connecting Platform 1 and 2 to FOB 2."
    },
    {
        "id": "ramp_t1_subway",
        "name": "Subway Access Ramp (Terminal 1)",
        "type": "RAMP",
        "coordinates": {"x": 1547.2, "y": 1175.7},
        "layer": "_x31__RAMP_2_",
        "level": 0,
        "connectsLevels": [0, -1],
        "accessibility": {"wheelchairAccessible": True, "slopeGradient": "1:12", "handrails": True},
        "status": "OPEN",
        "description": "Main entrance accessible ramp descending into Majestic Subway."
    },
    # Toilets
    {
        "id": "toilet_pf7_8",
        "name": "Restroom Platform 7/8",
        "type": "TOILET",
        "coordinates": {"x": 1480.0, "y": 378.6},
        "layer": "_x38__TOILET_2_",
        "level": 0,
        "accessibility": {"wheelchairAccessible": True, "genderSegregated": True, "waterAvailable": True},
        "status": "OPEN",
        "description": "Restrooms located on Platform 7/8 island."
    },
    {
        "id": "toilet_pf5_6",
        "name": "Restroom Platform 5/6",
        "type": "TOILET",
        "coordinates": {"x": 1368.2, "y": 582.2},
        "layer": "_x39__TOILET_1_",
        "level": 0,
        "accessibility": {"wheelchairAccessible": True, "genderSegregated": True, "waterAvailable": True},
        "status": "OPEN",
        "description": "Public restrooms on Platform 5/6."
    },
    {
        "id": "toilet_pf4",
        "name": "Restroom Platform 4",
        "type": "TOILET",
        "coordinates": {"x": 1271.1, "y": 735.7},
        "layer": "_x39__TOILET_3_",
        "level": 0,
        "accessibility": {"wheelchairAccessible": False, "genderSegregated": True, "waterAvailable": True},
        "status": "OPEN",
        "description": "Central platform restroom near waiting area."
    },
    {
        "id": "toilet_pf2_3",
        "name": "Restroom Platform 2/3",
        "type": "TOILET",
        "coordinates": {"x": 1575.0, "y": 865.3},
        "layer": "_x38__TOILET_1_",
        "level": 0,
        "accessibility": {"wheelchairAccessible": True, "genderSegregated": True, "waterAvailable": True},
        "status": "OPEN",
        "description": "Restrooms located on Platform 2/3."
    },
    {
        "id": "toilet_pf1_west",
        "name": "Restroom Platform 1 West",
        "type": "TOILET",
        "coordinates": {"x": 1372.5, "y": 1053.2},
        "layer": "_x39__TOILET_4_",
        "level": 0,
        "accessibility": {"wheelchairAccessible": True, "genderSegregated": True, "waterAvailable": True},
        "status": "OPEN",
        "description": "Spacious accessible restroom near Terminal 1 entrance."
    },
    {
        "id": "toilet_pf9_10_east",
        "name": "Restroom Platform 9/10 East",
        "type": "TOILET",
        "coordinates": {"x": 2630.0, "y": 262.4},
        "layer": "_x39__TOILET_2_",
        "level": 0,
        "accessibility": {"wheelchairAccessible": False, "genderSegregated": True, "waterAvailable": True},
        "status": "OPEN",
        "description": "Eastern restroom on Platform 9/10."
    },
    {
        "id": "toilet_t1_main",
        "name": "Terminal 1 Concourse Restroom",
        "type": "TOILET",
        "coordinates": {"x": 1762.4, "y": 1280.0},
        "layer": "TOILET",
        "level": 0,
        "accessibility": {"wheelchairAccessible": True, "genderSegregated": True, "waterAvailable": True},
        "status": "OPEN",
        "description": "Terminal 1 main waiting hall accessible restroom."
    },
    {
        "id": "toilet_t2",
        "name": "Terminal 2 Restroom",
        "type": "TOILET",
        "coordinates": {"x": 2957.8, "y": 611.2},
        "layer": "Toilet_2_",
        "level": 0,
        "accessibility": {"wheelchairAccessible": True, "genderSegregated": True, "waterAvailable": True},
        "status": "OPEN",
        "description": "Terminal 2 entrance public toilet."
    },
    # Entrances & Booking
    {
        "id": "entry_t1_main_east",
        "name": "Terminal 1 Main Entrance (East Gate)",
        "type": "ENTRANCE",
        "coordinates": {"x": 1811.0, "y": 1163.0},
        "layer": "Entry",
        "level": 0,
        "accessibility": {"wheelchairAccessible": True, "stepFreeAccess": True},
        "status": "OPEN",
        "description": "Primary public entrance facing Gubbi Thotadappa Road."
    },
    {
        "id": "entry_t1_main_west",
        "name": "Terminal 1 Main Entrance (West Gate)",
        "type": "ENTRANCE",
        "coordinates": {"x": 1573.2, "y": 1138.3},
        "layer": "Entry_2_",
        "level": 0,
        "accessibility": {"wheelchairAccessible": True, "stepFreeAccess": True},
        "status": "OPEN",
        "description": "Terminal 1 west gate near auto stand and parking."
    },
    {
        "id": "entry_t1_center",
        "name": "Terminal 1 Concourse Center Gate",
        "type": "ENTRANCE",
        "coordinates": {"x": 1710.5, "y": 1080.9},
        "layer": "Entry_3_",
        "level": 0,
        "accessibility": {"wheelchairAccessible": True, "stepFreeAccess": True},
        "status": "OPEN",
        "description": "Direct archway into Terminal 1 passenger concourse."
    },
    {
        "id": "entry_t2_east",
        "name": "Terminal 2 East Entrance",
        "type": "ENTRANCE",
        "coordinates": {"x": 2973.4, "y": 554.7},
        "layer": "Entry_1_",
        "level": 0,
        "accessibility": {"wheelchairAccessible": True, "stepFreeAccess": True},
        "status": "OPEN",
        "description": "Terminal 2 pedestrian access gate."
    },
    {
        "id": "entry_t2_okklapura",
        "name": "Terminal 2 Okkalpuram Gate",
        "type": "ENTRANCE",
        "coordinates": {"x": 3163.6, "y": 719.4},
        "layer": "Entry_4_",
        "level": 0,
        "accessibility": {"wheelchairAccessible": True, "stepFreeAccess": True},
        "status": "OPEN",
        "description": "Okkalpuram vehicular drop-off entrance."
    },
    {
        "id": "entry_t3_metro",
        "name": "Terminal 3 Metro Entrance",
        "type": "METRO",
        "coordinates": {"x": 745.0, "y": 1280.0},
        "layer": "Metro_FOB",
        "level": 0,
        "accessibility": {"wheelchairAccessible": True, "stepFreeAccess": True},
        "status": "OPEN",
        "description": "Direct covered walkway to Namma Metro KSR City Railway Station."
    },
    {
        "id": "booking_t2",
        "name": "Terminal 2 Booking Office",
        "type": "TICKET_COUNTER",
        "coordinates": {"x": 2862.8, "y": 552.9},
        "layer": "T2_Booking",
        "level": 0,
        "accessibility": {"wheelchairAccessible": True, "lowCounters": True},
        "status": "OPEN",
        "description": "Unreserved & reserved ticket booking counters at Terminal 2."
    },
    {
        "id": "booking_t1",
        "name": "Terminal 1 Main Ticket Counter",
        "type": "TICKET_COUNTER",
        "coordinates": {"x": 1680.0, "y": 1180.0},
        "layer": "Terminals",
        "level": 0,
        "accessibility": {"wheelchairAccessible": True, "lowCounters": True},
        "status": "OPEN",
        "description": "Main reservation and unreserved ticketing hall in Terminal 1."
    },
    # Footover Bridges
    {
        "id": "fob_metro",
        "name": "Metro Footover Bridge (West)",
        "type": "FOB",
        "coordinates": {"x": 750.0, "y": 600.0},
        "layer": "Metro_FOB",
        "level": 1,
        "accessibility": {"wheelchairAccessible": True, "rampsAvailable": True},
        "status": "OPEN",
        "description": "High-capacity footbridge directly connecting Metro station to all platforms."
    },
    {
        "id": "fob_mysuru_1",
        "name": "Footover Bridge 1 (Mysuru End)",
        "type": "FOB",
        "coordinates": {"x": 1390.0, "y": 550.0},
        "layer": "FOB_1",
        "level": 1,
        "accessibility": {"wheelchairAccessible": False, "stairsOnly": True},
        "status": "OPEN",
        "description": "Central passenger footbridge spanning Platforms 1 to 10."
    },
    {
        "id": "fob_okklapura_2",
        "name": "Footover Bridge 2 (Okkalpuram / Dharmavaram End)",
        "type": "FOB",
        "coordinates": {"x": 2618.0, "y": 650.0},
        "layer": "FOB_2",
        "level": 1,
        "accessibility": {"wheelchairAccessible": True, "liftEquipped": True, "rampEquipped": True},
        "status": "OPEN",
        "description": "Fully accessible bridge equipped with Lift 1 (PF 7/8), Lift 3 (PF 1), and Ramps 1–7."
    },
    # Subway
    {
        "id": "subway_majestic",
        "name": "Subway to Majestic",
        "type": "SUBWAY",
        "coordinates": {"x": 1450.0, "y": 1050.0},
        "layer": "Floor_n_subwy",
        "level": -1,
        "accessibility": {"wheelchairAccessible": True, "rampEquipped": True},
        "status": "OPEN",
        "description": "Underground passenger subway connecting Terminal 1 concourse and platforms."
    }
]

with open('data/station/facilities.json', 'w', encoding='utf-8') as f:
    json.dump(facilities_data, f, indent=2)
print(f"-> data/station/facilities.json created ({len(facilities_data)} facilities)")

# 3. VERTICAL CONNECTIONS DATABASE
vertical_connections = [
    {
        "id": "vc_lift_1",
        "name": "Lift 1 (PF 7/8 ↔ FOB 2)",
        "type": "LIFT",
        "coordinates": {"x": 2586.7, "y": 434.2},
        "fromLevel": 0,
        "toLevel": 1,
        "fromNode": "node_pf8_lift1",
        "toNode": "node_fob2_pf7_8",
        "accessible": True,
        "status": "OPEN"
    },
    {
        "id": "vc_lift_2",
        "name": "Lift 2 (T1 Concourse ↔ Subway)",
        "type": "LIFT",
        "coordinates": {"x": 1661.7, "y": 1110.6},
        "fromLevel": 0,
        "toLevel": -1,
        "fromNode": "node_t1_lift2_l0",
        "toNode": "node_subway_lift2_l_minus_1",
        "accessible": True,
        "status": "OPEN"
    },
    {
        "id": "vc_lift_3",
        "name": "Lift 3 (PF 1 East ↔ FOB 2)",
        "type": "LIFT",
        "coordinates": {"x": 2659.2, "y": 973.8},
        "fromLevel": 0,
        "toLevel": 1,
        "fromNode": "node_pf1_lift3",
        "toNode": "node_fob2_pf1",
        "accessible": True,
        "status": "OPEN"
    },
    {
        "id": "vc_ramp_1",
        "name": "Ramp 1 (PF 7/8 ↔ FOB 2)",
        "type": "RAMP",
        "coordinates": {"x": 2702.1, "y": 465.4},
        "fromLevel": 0,
        "toLevel": 1,
        "fromNode": "node_pf8_ramp1",
        "toNode": "node_fob2_pf7_8",
        "accessible": True,
        "status": "OPEN"
    },
    {
        "id": "vc_ramp_2",
        "name": "Ramp 2 (PF 4/5 ↔ FOB 2)",
        "type": "RAMP",
        "coordinates": {"x": 2550.0, "y": 725.0},
        "fromLevel": 0,
        "toLevel": 1,
        "fromNode": "node_pf4_5_ramp2",
        "toNode": "node_fob2_pf4_5",
        "accessible": True,
        "status": "OPEN"
    },
    {
        "id": "vc_ramp_3",
        "name": "Ramp 3 (PF 1/2 ↔ FOB 2)",
        "type": "RAMP",
        "coordinates": {"x": 2586.0, "y": 1000.0},
        "fromLevel": 0,
        "toLevel": 1,
        "fromNode": "node_pf1_2_ramp3",
        "toNode": "node_fob2_pf1",
        "accessible": True,
        "status": "OPEN"
    },
    {
        "id": "vc_ramp_t1_subway",
        "name": "Subway Ramp (T1 Concourse ↔ Subway)",
        "type": "RAMP",
        "coordinates": {"x": 1547.2, "y": 1175.7},
        "fromLevel": 0,
        "toLevel": -1,
        "fromNode": "node_t1_ramp_subway_l0",
        "toNode": "node_subway_t1_l_minus_1",
        "accessible": True,
        "status": "OPEN"
    },
    {
        "id": "vc_stair_pf7_8_fob2",
        "name": "Stair (PF 7/8 ↔ FOB 2)",
        "type": "STAIR",
        "coordinates": {"x": 2603.0, "y": 440.0},
        "fromLevel": 0,
        "toLevel": 1,
        "fromNode": "node_pf8_stair_fob2",
        "toNode": "node_fob2_pf7_8",
        "accessible": False,
        "status": "OPEN"
    },
    {
        "id": "vc_stair_pf1_fob2",
        "name": "Stair (PF 1 ↔ FOB 2)",
        "type": "STAIR",
        "coordinates": {"x": 2620.0, "y": 960.0},
        "fromLevel": 0,
        "toLevel": 1,
        "fromNode": "node_pf1_stair_fob2",
        "toNode": "node_fob2_pf1",
        "accessible": False,
        "status": "OPEN"
    },
    {
        "id": "vc_stair_t1_subway",
        "name": "Stair (T1 ↔ Subway)",
        "type": "STAIR",
        "coordinates": {"x": 1354.5, "y": 1144.1},
        "fromLevel": 0,
        "toLevel": -1,
        "fromNode": "node_t1_stair_subway_l0",
        "toNode": "node_subway_t1_l_minus_1",
        "accessible": False,
        "status": "OPEN"
    }
]

with open('data/station/verticalConnections.json', 'w', encoding='utf-8') as f:
    json.dump(vertical_connections, f, indent=2)
print("-> data/station/verticalConnections.json created")

# 4. QR CHECKPOINTS
checkpoints_data = [
    {
        "id": "QR-KSR-T1-MAIN",
        "name": "Terminal 1 Main Entrance Checkpoint",
        "nodeId": "node_entry_t1_main_east",
        "coordinates": {"x": 1811.0, "y": 1163.0},
        "level": 0,
        "description": "Scanned at Terminal 1 East Entrance foyer beside security."
    },
    {
        "id": "QR-KSR-T1-TICKET",
        "name": "Terminal 1 Ticket Concourse Checkpoint",
        "nodeId": "node_t1_ticket",
        "coordinates": {"x": 1680.0, "y": 1180.0},
        "level": 0,
        "description": "Scanned at Ticket Counters column #4."
    },
    {
        "id": "QR-KSR-T1-LIFT2",
        "name": "Terminal 1 Concourse Lift Checkpoint",
        "nodeId": "node_t1_lift2_l0",
        "coordinates": {"x": 1661.7, "y": 1110.6},
        "level": 0,
        "description": "Scanned in front of Lift 2 doors."
    },
    {
        "id": "QR-KSR-PF1-CENTER",
        "name": "Platform 1 Central Checkpoint",
        "nodeId": "node_pf1_center",
        "coordinates": {"x": 1520.0, "y": 980.9},
        "level": 0,
        "description": "Scanned at Platform 1 coach indicator #8."
    },
    {
        "id": "QR-KSR-FOB2-PF1",
        "name": "FOB 2 Platform 1 Junction Checkpoint",
        "nodeId": "node_fob2_pf1",
        "coordinates": {"x": 2618.0, "y": 973.8},
        "level": 1,
        "description": "Scanned on FOB 2 above Platform 1, beside Lift 3."
    },
    {
        "id": "QR-KSR-FOB2-PF8",
        "name": "FOB 2 Platform 7/8 Junction Checkpoint",
        "nodeId": "node_fob2_pf7_8",
        "coordinates": {"x": 2618.0, "y": 434.2},
        "level": 1,
        "description": "Scanned on FOB 2 above Platform 8, beside Lift 1."
    },
    {
        "id": "QR-KSR-PF8-LIFT1",
        "name": "Platform 8 Lift 1 Checkpoint",
        "nodeId": "node_pf8_lift1",
        "coordinates": {"x": 2586.7, "y": 434.2},
        "level": 0,
        "description": "Scanned at Platform 8 ground level at Lift 1 entry."
    },
    {
        "id": "QR-KSR-PF8-CENTER",
        "name": "Platform 8 Boarding Checkpoint",
        "nodeId": "node_pf8_center",
        "coordinates": {"x": 1450.0, "y": 375.9},
        "level": 0,
        "description": "Scanned at Platform 8 central waiting bench."
    },
    {
        "id": "QR-KSR-T2-ENTRY",
        "name": "Terminal 2 Entrance Checkpoint",
        "nodeId": "node_entry_t2_east",
        "coordinates": {"x": 2973.4, "y": 554.7},
        "level": 0,
        "description": "Scanned at Terminal 2 east entrance porch."
    },
    {
        "id": "QR-KSR-METRO-T3",
        "name": "Metro Bridge Terminal 3 Checkpoint",
        "nodeId": "node_entry_t3_metro",
        "coordinates": {"x": 745.0, "y": 1280.0},
        "level": 0,
        "description": "Scanned at Metro concourse entry gantry."
    }
]

with open('data/simulation/checkpoints.json', 'w', encoding='utf-8') as f:
    json.dump(checkpoints_data, f, indent=2)
print("-> data/simulation/checkpoints.json created (10 QR checkpoints)")

# 5. INITIAL STATUS (Dynamic / Blockage engine)
status_data = {
    "lift_1": "OPEN",
    "lift_2": "OPEN",
    "lift_3": "OPEN",
    "ramp_1": "OPEN",
    "ramp_2": "OPEN",
    "ramp_3": "OPEN",
    "ramp_t1_subway": "OPEN",
    "vc_stair_pf7_8_fob2": "OPEN",
    "vc_stair_pf1_fob2": "OPEN",
    "fob_okklapura_2": "OPEN",
    "fob_mysuru_1": "OPEN",
    "fob_metro": "OPEN",
    "subway_majestic": "OPEN"
}

with open('data/simulation/status.json', 'w', encoding='utf-8') as f:
    json.dump(status_data, f, indent=2)
print("-> data/simulation/status.json created")

# 6. ROUTING CONFIGURATION & PROFILES
profiles_data = [
    {
        "id": "first_time",
        "name": "First-Time Traveller",
        "tagline": "Simple routes with clear landmarks & fewer turns",
        "icon": "compass-outline",
        "description": "Prioritizes high-visibility landmarks (Ticket Counter, Main Concourse, FOB), minimal turns, and easy straightforward corridors.",
        "weights": {
            "walkway": 1.0,
            "ramp": 1.1,
            "lift": 1.1,
            "stairs": 1.4,
            "escalator": 1.2,
            "turnPenalty": 15.0,
            "stairAvoidance": False
        }
    },
    {
        "id": "elderly",
        "name": "Elderly Person",
        "tagline": "Minimal walking, avoid stairs, prefer lifts & ramps",
        "icon": "walk-outline",
        "description": "Minimizes walking distance, heavily penalizes stairs (+5x cost), and favors smooth lifts and ramps with ample resting areas.",
        "weights": {
            "walkway": 1.3,
            "ramp": 1.0,
            "lift": 0.8,
            "stairs": 5.0,
            "escalator": 2.0,
            "turnPenalty": 10.0,
            "stairAvoidance": False
        }
    },
    {
        "id": "child",
        "name": "Child / Kid",
        "tagline": "Safe, simple paths with high visibility",
        "icon": "happy-outline",
        "description": "Avoids isolated or complex corridors; keeps instructions clear, short, and landmark-driven.",
        "weights": {
            "walkway": 1.0,
            "ramp": 1.1,
            "lift": 1.2,
            "stairs": 2.0,
            "escalator": 2.5,
            "turnPenalty": 12.0,
            "stairAvoidance": False
        }
    },
    {
        "id": "visually_impaired",
        "name": "Visually Impaired",
        "tagline": "Voice guidance, tactile landmarks, fewest turns",
        "icon": "ear-outline",
        "description": "Optimized for continuous audio feedback, tactile pathways, and long straight passages with predictable junctions.",
        "weights": {
            "walkway": 1.1,
            "ramp": 1.2,
            "lift": 1.2,
            "stairs": 2.5,
            "escalator": 3.0,
            "turnPenalty": 20.0,
            "stairAvoidance": False
        }
    },
    {
        "id": "mobility_disabled",
        "name": "Mobility Disability",
        "tagline": "100% Wheelchair accessible, stairs strictly prohibited",
        "icon": "wheelchair-outline",
        "description": "Mandatory step-free routing. Stairs and non-wheelchair escalators are strictly prohibited (infinite cost). Prefers accessible Lifts and 1:12 Ramps.",
        "weights": {
            "walkway": 1.0,
            "ramp": 0.8,
            "lift": 0.7,
            "stairs": 999999,
            "escalator": 999999,
            "turnPenalty": 8.0,
            "stairAvoidance": True
        }
    }
]

with open('data/accessibility/profiles.json', 'w', encoding='utf-8') as f:
    json.dump(profiles_data, f, indent=2)
print("-> data/accessibility/profiles.json created")

routing_config = {
    "version": "1.0.0",
    "walkingSpeedMetersPerSecond": 1.2,
    "svgCoordinateToMetersRatio": 0.25, # 1 SVG unit ~ 0.25 meters
    "turnAngleThresholdDegrees": 30.0,
    "defaultTurnPenaltyMeters": 5.0,
    "levelTransitionPenaltySeconds": 45,
    "profiles": {p["id"]: p["weights"] for p in profiles_data}
}

with open('data/accessibility/routingConfig.json', 'w', encoding='utf-8') as f:
    json.dump(routing_config, f, indent=2)
print("-> data/accessibility/routingConfig.json created")
