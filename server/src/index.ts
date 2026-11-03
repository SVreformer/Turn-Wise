import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { StationService } from './services/stationService';
import { AssistantService } from './tools/assistantService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize core services
const stationService = new StationService();
const assistantService = new AssistantService(stationService);

// 1. GET /api/station
app.get('/api/station', (req: Request, res: Response) => {
  res.json(stationService.getStationOverview());
});

// 2. GET /api/platforms
app.get('/api/platforms', (req: Request, res: Response) => {
  res.json(stationService.getPlatforms());
});

// 3. GET /api/facilities
app.get('/api/facilities', (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  const wheelchairOnly = req.query.wheelchair === 'true';
  res.json(stationService.getFacilities(category, wheelchairOnly));
});

// 4. GET /api/nodes
app.get('/api/nodes', (req: Request, res: Response) => {
  res.json(stationService.getNodes());
});

// 5. GET & POST /api/status (Accessibility Truth Engine)
app.get('/api/status', (req: Request, res: Response) => {
  res.json(stationService.getStatus());
});

app.post('/api/status', (req: Request, res: Response) => {
  const { facilityId, status } = req.body;
  if (!facilityId || !status) {
    return res.status(400).json({ error: 'facilityId and status are required' });
  }
  const updated = stationService.setStatus(facilityId, status);
  res.json({ success: true, status: updated });
});

// Incident Reports (Reporting UI & Automatic Weight Adjustments)
app.get('/api/incidents', (req: Request, res: Response) => {
  res.json(stationService.getIncidentReports());
});

app.post('/api/incidents', (req: Request, res: Response) => {
  const { facilityOrLocationId, type, reporterRole, verified, description } = req.body;
  if (!facilityOrLocationId || !type) {
    return res.status(400).json({ error: 'facilityOrLocationId and type are required' });
  }
  const newReport = {
    id: `inc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    facilityOrLocationId,
    type,
    reporterRole: reporterRole || 'PASSENGER',
    verified: verified ?? (reporterRole === 'STAFF'),
    timestamp: new Date().toISOString(),
    description
  };
  stationService.addIncidentReport(newReport);
  res.json({ success: true, report: newReport, currentStatus: stationService.getStatus() });
});

// 6. POST /api/route (Core graph routing with mathematical cost c(e) = d(e) + P_a(e) + P_s(e) + P_u(e))
app.post('/api/route', (req: Request, res: Response) => {
  const { startNodeId, destinationNodeId, profileId, blockedIds } = req.body;
  if (!startNodeId || !destinationNodeId) {
    return res.status(400).json({ error: 'startNodeId and destinationNodeId are required' });
  }
  const route = stationService.router.findRoute(
    startNodeId,
    destinationNodeId,
    profileId || 'first_time',
    blockedIds || []
  );
  if (!route) {
    return res.status(404).json({
      error: 'No accessible route found',
      message: 'No route available satisfying the specified constraints.'
    });
  }
  res.json(route);
});

// 7. POST /api/route/coach (SPECIFICATION 4: Train to Coach Navigation)
app.post('/api/route/coach', (req: Request, res: Response) => {
  const { startNodeId, trainNumber, coachNumber, profileId } = req.body;
  if (!startNodeId || !trainNumber || !coachNumber) {
    return res.status(400).json({ error: 'startNodeId, trainNumber, and coachNumber are required' });
  }
  const route = stationService.findRouteToCoach(
    startNodeId,
    trainNumber,
    coachNumber,
    profileId || 'first_time'
  );
  if (!route) {
    return res.status(404).json({
      error: 'Coach route not found',
      message: `Could not resolve route to Coach ${coachNumber} on Train ${trainNumber}.`
    });
  }
  res.json(route);
});

// 7.1 POST /api/boardingsure/calculate (Profile-Aware Missed-Train Risk Predictor)
app.post('/api/boardingsure/calculate', (req: Request, res: Response) => {
  const {
    trainNumber,
    coachNumber,
    startNodeId,
    profileId = 'first_time',
    availableMinutes,
    departureTime,
    currentTime,
    bufferMinutes = 3.0
  } = req.body;

  if (!trainNumber || !coachNumber || !startNodeId) {
    return res.status(400).json({ error: 'trainNumber, coachNumber, and startNodeId are required' });
  }

  const route = stationService.findRouteToCoach(
    startNodeId,
    trainNumber,
    coachNumber,
    profileId
  );

  if (!route) {
    return res.status(404).json({
      status: 'NO_ROUTE',
      error: 'No accessible route found',
      message: `Could not resolve route to Coach ${coachNumber} on Train ${trainNumber}.`
    });
  }

  const speedMap: Record<string, number> = {
    regular: 1.0,
    first_time: 0.8,
    elderly: 0.7,
    mobility_disabled: 0.6,
    child: 0.8,
    visually_impaired: 0.75,
    luggage_heavy: 0.7
  };
  const speed = speedMap[profileId] || 1.0;
  const d = route.totalDistanceMeters || 0;
  const tWalking = d / (speed * 60);

  let turns = 0;
  if (route.steps && route.steps.length > 1) {
    turns = Math.max(0, Math.floor(route.steps.length / 2));
  }
  const tTurns = (turns * 5) / 60;

  const lifts = route.accessibility?.liftsUsed?.length || 0;
  const ramps = route.accessibility?.rampsUsed?.length || 0;
  const stairs = profileId === 'mobility_disabled' ? 0 : (route.accessibility?.stairsUsed?.length || 0);
  const tLevel = (lifts * 30 + ramps * 15 + stairs * 20) / 60;

  const tBuffer = bufferMinutes;
  const tObstruction = (route.warnings?.length || 0) * 0.5;
  const tRequired = tWalking + tTurns + tLevel + tObstruction + tBuffer;

  let tAvailable = typeof availableMinutes === 'number' ? availableMinutes : 20.0;
  if (typeof availableMinutes !== 'number' && departureTime) {
    const now = currentTime ? new Date(currentTime) : new Date();
    const dep = new Date(departureTime);
    if (!isNaN(dep.getTime())) {
      tAvailable = Math.round(((dep.getTime() - now.getTime()) / 60000) * 10) / 10;
    }
  }

  const margin = Math.round((tAvailable - tRequired) * 10) / 10;
  const deficit = margin < 0 ? Math.abs(margin) : 0;
  let riskScore = 0;
  if (tRequired > 0) {
    riskScore = Math.max(0, Math.min(100, Math.round(((tRequired - tAvailable) / tRequired) * 1000) / 10));
  } else {
    riskScore = tAvailable < 0 ? 100 : 0;
  }

  const riskLevel = margin > 5 ? 'COMFORTABLE' : (margin >= 0 ? 'HURRY' : 'HIGH_RISK');

  res.json({
    status: 'SUCCESS',
    trainNumber,
    coachNumber,
    profileId,
    route,
    timeBreakdown: {
      distanceMeters: d,
      walkingSpeedMps: speed,
      tWalkingMinutes: Math.round(tWalking * 10) / 10,
      turnCount: turns,
      tTurnsMinutes: Math.round(tTurns * 10) / 10,
      liftCount: lifts,
      rampCount: ramps,
      stairsCount: stairs,
      tLevelChangesMinutes: Math.round(tLevel * 10) / 10,
      tBufferMinutes: tBuffer,
      tObstructionMinutes: tObstruction,
      tRequiredMinutes: Math.round(tRequired * 10) / 10,
      tAvailableMinutes: tAvailable,
      marginMinutes: margin,
      deficitMinutes: deficit,
      riskScore
    },
    riskLevel,
    riskScore,
    canMakeTrain: margin >= 0
  });
});

// 8. POST /api/rescue (SPECIFICATION 3: Lost Passenger Rescue Mode)
app.post('/api/rescue', (req: Request, res: Response) => {
  const { startNodeId, targetType, profileId } = req.body;
  if (!startNodeId) {
    return res.status(400).json({ error: 'startNodeId is required' });
  }
  const rescue = stationService.resolveLostPassengerRescue(
    startNodeId,
    targetType || 'HELP_DESK',
    profileId || 'first_time'
  );
  if (!rescue) {
    return res.status(404).json({ error: 'Rescue routing failed' });
  }
  res.json(rescue);
});

// 9. POST /api/reroute
app.post('/api/reroute', (req: Request, res: Response) => {
  const { startNodeId, destinationNodeId, profileId, blockedLocationId } = req.body;
  if (!startNodeId || !destinationNodeId || !blockedLocationId) {
    return res.status(400).json({ error: 'startNodeId, destinationNodeId, and blockedLocationId are required' });
  }
  const blocked = [blockedLocationId, `${blockedLocationId}_rev`];
  const route = stationService.router.findRoute(
    startNodeId,
    destinationNodeId,
    profileId || 'first_time',
    blocked
  );
  if (!route) {
    return res.status(404).json({
      error: 'No alternative route found',
      message: 'No accessible alternative route exists around the blocked location.'
    });
  }
  res.json({
    rerouted: true,
    blockedLocation: blockedLocationId,
    route
  });
});

// 10. POST /api/assistant (SPECIFICATION 5: Multilingual Voice & Text Assistant)
app.post('/api/assistant', async (req: Request, res: Response) => {
  const { message, currentNodeId, profileId, language, activeRoute } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }
  try {
    const response = await assistantService.processUserMessage(message, {
      currentNodeId,
      profileId,
      language,
      activeRoute
    });
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: 'Assistant processing error', details: err.message });
  }
});

// 11. POST /api/checkpoint
app.post('/api/checkpoint', (req: Request, res: Response) => {
  const { qrCode } = req.body;
  if (!qrCode) {
    return res.status(400).json({ error: 'qrCode is required' });
  }
  const resolved = stationService.resolveCheckpoint(qrCode);
  if (!resolved) {
    return res.status(404).json({ error: 'Invalid QR Checkpoint', message: 'Checkpoint code not recognized.' });
  }
  res.json(resolved);
});

// 12. GET /api/location/:id
app.get('/api/location/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const platform = stationService.getPlatformById(id);
  if (platform) return res.json({ type: 'PLATFORM', data: platform });

  const facility = stationService.getFacilityById(id);
  if (facility) return res.json({ type: 'FACILITY', data: facility });

  const node = stationService.router.nodeDict.get(id);
  if (node) return res.json({ type: 'NODE', data: node });

  res.status(404).json({ error: 'Location not found' });
});

// =========================================================================
// REAL-TIME RAILWAY DATA API (Cities, Stations, Platforms, Train Schedules)
// =========================================================================

// 13. GET /api/cities - List all major supported cities
app.get('/api/cities', (req: Request, res: Response) => {
  res.json(stationService.getCities());
});

// 14. GET /api/cities/:id - Get details of a specific city
app.get('/api/cities/:id', (req: Request, res: Response) => {
  const city = stationService.getCityById(req.params.id);
  if (!city) return res.status(404).json({ error: 'City not found' });
  res.json(city);
});

// 15. GET /api/stations - Search stations across India or filter by city
app.get('/api/stations', (req: Request, res: Response) => {
  const city = req.query.city as string | undefined;
  const search = req.query.search as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  res.json(stationService.getStations(city, search, limit));
});

// 16. GET /api/station/:code - Get single station profile
app.get('/api/station/:code', (req: Request, res: Response) => {
  const code = req.params.code;
  const station = stationService.getStationByCode(code);
  if (!station) return res.status(404).json({ error: 'Station not found' });
  res.json(station);
});

// 17. GET /api/station/:code/platforms - Get platform list and status
app.get('/api/station/:code/platforms', (req: Request, res: Response) => {
  const code = req.params.code;
  const platforms = stationService.getPlatformsForStation(code);
  res.json({
    stationCode: code.toUpperCase(),
    totalPlatforms: platforms.length,
    platforms
  });
});

// 18. GET /api/station/:code/trains - Get live train board & schedules
app.get('/api/station/:code/trains', (req: Request, res: Response) => {
  const code = req.params.code;
  const trains = stationService.getStationSchedules(code);
  res.json({
    stationCode: code.toUpperCase(),
    timestamp: new Date().toISOString(),
    totalTrains: trains.length,
    trains
  });
});

// 19. GET /api/trains - Search all trains across India
app.get('/api/trains', (req: Request, res: Response) => {
  const search = req.query.search as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  res.json(stationService.getTrains(search, limit));
});

// 20. GET /api/train/:trainNumber - Get train details & coach composition
app.get('/api/train/:trainNumber', (req: Request, res: Response) => {
  const trainNumber = req.params.trainNumber;
  const train = stationService.getTrainByNumber(trainNumber);
  if (!train) return res.status(404).json({ error: 'Train not found' });
  res.json(train);
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Turn Wise API', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚆 Turn Wise Backend Server running on port ${PORT}`);
  console.log(`====================================================`);
});
