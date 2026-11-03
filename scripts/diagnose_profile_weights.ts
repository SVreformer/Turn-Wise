const { localRouter } = require('../mobile/src/services/localRouter');

const startNode = 'node_entry_t1_main_east';
const destNode = 'node_pf4_center';

console.log('Testing start:', startNode, '-> dest:', destNode);

// Look at subway path vs FOB path
const subwayEdges = [
  'node_entry_t1_main_east -> node_t1_main_concourse',
  'node_t1_main_concourse -> node_t1_ramp_subway_l0',
  'node_t1_ramp_subway_l0 -> node_subway_t1_l_minus_1',
  'node_subway_t1_l_minus_1 -> node_subway_pf1',
  'node_subway_pf1 -> node_subway_pf2_3',
  'node_subway_pf2_3 -> node_subway_pf4',
  'node_subway_pf4 -> node_pf4_center'
];

console.log('\nSubway Path Edges:');
let totalDist = 0;
subwayEdges.forEach(eStr => {
  const [from, to] = eStr.split(' -> ');
  const edge = localRouter.edges.find((e: any) => e.from === from && e.to === to);
  if (edge) {
    totalDist += edge.distance;
    console.log(`  ${from} -> ${to} | type: ${edge.pathType} | dist: ${edge.distance}m | wheelchair: ${edge.wheelchairAccessible}`);
  } else {
    console.log(`  MISSING: ${from} -> ${to}`);
  }
});
console.log('Total subway distance:', totalDist);
