import { localRouter, StationEdge } from '../mobile/src/services/localRouter';

function computeCustomCost(edge: StationEdge, profileId: string, prevEdge?: StationEdge): number {
  const prof = localRouter.profiles.get(profileId) || localRouter.profiles.get('first_time');
  const weights = prof ? prof.weights : {
    walkway: 1.0, ramp: 1.0, lift: 1.0, stairs: 1.5, escalator: 1.5, turnPenalty: 5.0,
    stairAvoidance: false, accessibilityPenaltyFactor: 1.0, safetyPenaltyFactor: 1.0, uncertaintyPenaltyFactor: 1.0
  };

  const d = edge.distance;
  const pt = edge.pathType.toLowerCase();
  const aFactor = weights.accessibilityPenaltyFactor || 1.0;
  const sFactor = weights.safetyPenaltyFactor || 1.0;
  const uFactor = weights.uncertaintyPenaltyFactor || 1.0;

  // Strict Wheelchair Barrier
  if (weights.stairAvoidance && (!edge.wheelchairAccessible || pt === 'stairs' || pt === 'escalator')) {
    return Infinity;
  }

  let Pa = 0;
  if (pt === 'stairs') {
    let obstacleBase = 0;
    if (profileId === 'elderly') obstacleBase = 600;
    else if (profileId === 'luggage_heavy') obstacleBase = 700;
    else if (profileId === 'child') obstacleBase = 350;
    else if (profileId === 'visually_impaired') obstacleBase = 450;

    Pa = (d * (weights.stairs - 1.0) + obstacleBase) * aFactor;
  } else if (pt === 'escalator') {
    let obstacleBase = 0;
    if (profileId === 'luggage_heavy') obstacleBase = 300;
    else if (profileId === 'elderly') obstacleBase = 150;
    else if (profileId === 'visually_impaired') obstacleBase = 200;

    Pa = (d * (weights.escalator - 1.0) + obstacleBase) * aFactor;
  } else if (pt === 'lift') {
    const liftReward = (profileId === 'mobility_disabled' || profileId === 'elderly' || profileId === 'luggage_heavy') ? 80 : 20;
    Pa = -liftReward * aFactor;
  } else if (pt === 'ramp') {
    const rampReward = (profileId === 'mobility_disabled' || profileId === 'elderly' || profileId === 'luggage_heavy') ? 30 : 0;
    Pa = -rampReward * aFactor;
  }

  let Pu = 0;
  if (prevEdge) {
    Pu += (weights.turnPenalty || 5.0) * uFactor;
  }

  return Math.max(0.1, d + Pa + Pu);
}

function testDest(startId: string, destId: string) {
  console.log(`\n=== Testing ${startId} -> ${destId} ===`);
  const profiles = ['first_time', 'mobility_disabled', 'elderly', 'visually_impaired', 'child', 'luggage_heavy'];

  profiles.forEach(p => {
    const pq: Array<{ f: number; g: number; curr: string; pathEdges: StationEdge[] }> = [
      { f: 0, g: 0, curr: startId, pathEdges: [] }
    ];
    const bestG = new Map<string, number>();
    bestG.set(startId, 0);
    const visited = new Set<string>();

    while (pq.length > 0) {
      let minIdx = 0;
      for (let i = 1; i < pq.length; i++) {
        if (pq[i].f < pq[minIdx].f) minIdx = i;
      }
      const { g, curr, pathEdges } = pq.splice(minIdx, 1)[0];

      if (curr === destId) {
        const dist = pathEdges.reduce((sum, e) => sum + e.distance, 0);
        const stairs = pathEdges.filter(e => e.pathType === 'STAIRS').length;
        const ramps = pathEdges.filter(e => e.pathType === 'RAMP').length;
        const lifts = pathEdges.filter(e => e.pathType === 'LIFT').length;
        console.log(`[${p}] Dist: ${dist.toFixed(1)}m | Stairs: ${stairs} | Ramps: ${ramps} | Lifts: ${lifts}`);
        return;
      }

      if (visited.has(curr) && g > (bestG.get(curr) ?? Infinity)) continue;
      visited.add(curr);

      const prevEdge = pathEdges.length > 0 ? pathEdges[pathEdges.length - 1] : undefined;
      const neighbors = localRouter.adj.get(curr) || [];

      for (const edge of neighbors) {
        const cost = computeCustomCost(edge, p, prevEdge);
        if (!isFinite(cost)) continue;

        const nxt = edge.to;
        const newG = g + cost;
        if (newG < (bestG.get(nxt) ?? Infinity)) {
          bestG.set(nxt, newG);
          pq.push({
            f: newG,
            g: newG,
            curr: nxt,
            pathEdges: [...pathEdges, edge]
          });
        }
      }
    }
  });
}

testDest('node_entry_t1_main_east', 'node_pf1_center');
testDest('node_entry_t1_main_east', 'node_pf4_center');
testDest('node_entry_t1_main_east', 'node_pf8_center');
testDest('node_entry_t1_main_east', 'node_pf10_east');
