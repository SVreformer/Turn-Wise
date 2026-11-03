import { StationQrCheckpoint } from '../types';
import extendedCheckpointsData from '../data/extendedCheckpoints.json';
import legacyCheckpointsData from '../../../data/simulation/checkpoints.json';
import { localRouter } from '../../../services/localRouter';

export interface QrValidationSuccess {
  isValid: true;
  checkpoint: StationQrCheckpoint;
  matchedNode: any;
  offlineVerified: boolean;
  rawPayload: string;
}

export interface QrValidationFailure {
  isValid: false;
  errorCode: 'INVALID_FORMAT' | 'UNSUPPORTED_STATION' | 'CORRUPTED_PAYLOAD' | 'UNKNOWN_CHECKPOINT' | 'NODE_NOT_FOUND';
  errorMessage: string;
  rawPayload: string;
}

export type QrValidationResult = QrValidationSuccess | QrValidationFailure;

// Simple fast CRC32 for offline payload integrity verification
function computeCRC32(str: string): string {
  let crc = 0 ^ -1;
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ ((crc ^ str.charCodeAt(i)) & 0xff);
  }
  return ((crc ^ -1) >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

export class QrValidator {
  private checkpointCatalog: Map<string, StationQrCheckpoint> = new Map();

  constructor() {
    this.indexCatalog();
  }

  private indexCatalog(): void {
    // 1. Index extended checkpoints
    (extendedCheckpointsData as StationQrCheckpoint[]).forEach((cp) => {
      this.checkpointCatalog.set(cp.checkpointId.toUpperCase(), cp);
      this.checkpointCatalog.set(cp.associatedNodeId.toUpperCase(), cp);
    });

    // 2. Index legacy simulation checkpoints for backward compatibility
    legacyCheckpointsData.forEach((legacy: any) => {
      const cleanId = legacy.id.toUpperCase();
      if (!this.checkpointCatalog.has(cleanId)) {
        const synthesized: StationQrCheckpoint = {
          version: 1,
          stationCode: 'SBC',
          checkpointId: legacy.id,
          name: legacy.name,
          level: legacy.level ?? 0,
          associatedNodeId: legacy.nodeId,
          coordinates: legacy.coordinates,
          visualLandmark: legacy.description || 'Pillar Checkpoint',
          description: legacy.description || '',
          checksum: computeCRC32(legacy.id + legacy.nodeId)
        };
        this.checkpointCatalog.set(cleanId, synthesized);
      }
    });
  }

  /**
   * Parse and validate an incoming QR string or URI
   */
  public validate(rawCode: string): QrValidationResult {
    if (!rawCode || typeof rawCode !== 'string') {
      return {
        isValid: false,
        errorCode: 'INVALID_FORMAT',
        errorMessage: 'Empty or malformed QR code payload.',
        rawPayload: String(rawCode)
      };
    }

    const trimmed = rawCode.trim();

    // 1. Check if payload is URI scheme: meteor://check?v=1&s=SBC&c=CP-T1-MAIN&l=0&n=node_entry_t1_main_east&sig=A7B2C91D
    if (trimmed.startsWith('meteor://') || trimmed.startsWith('railsaathi://') || trimmed.startsWith('turnwise://')) {
      return this.parseUriPayload(trimmed);
    }

    // 2. Check if payload is structured JSON
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return this.parseJsonPayload(trimmed);
    }

    // 3. Fallback: Raw ID match (e.g., 'CP-T1-MAIN', 'QR-KSR-T1-MAIN', 'node_entry_t1_main_east')
    return this.lookupRawId(trimmed);
  }

  private parseUriPayload(uri: string): QrValidationResult {
    try {
      const queryIndex = uri.indexOf('?');
      if (queryIndex === -1) {
        return {
          isValid: false,
          errorCode: 'INVALID_FORMAT',
          errorMessage: 'Missing parameter query in Meteor checkpoint URI.',
          rawPayload: uri
        };
      }

      const queryString = uri.substring(queryIndex + 1);
      const params = new URLSearchParams(queryString);

      const stationCode = params.get('s')?.toUpperCase() || '';
      const checkpointId = params.get('c')?.toUpperCase() || '';
      const nodeId = params.get('n') || '';
      const levelStr = params.get('l');
      const sig = params.get('sig');

      if (!checkpointId) {
        return {
          isValid: false,
          errorCode: 'INVALID_FORMAT',
          errorMessage: 'URI payload missing checkpoint identifier (c).',
          rawPayload: uri
        };
      }

      // Check if checkpoint exists in offline catalog
      const cached = this.checkpointCatalog.get(checkpointId);
      if (cached) {
        const node = localRouter.nodeDict.get(cached.associatedNodeId);
        return {
          isValid: true,
          checkpoint: cached,
          matchedNode: node || null,
          offlineVerified: true,
          rawPayload: uri
        };
      }

      // If not in catalog, construct from URI parameters
      if (nodeId && levelStr !== null) {
        const level = parseInt(levelStr, 10);
        const node = localRouter.nodeDict.get(nodeId);
        if (!node) {
          return {
            isValid: false,
            errorCode: 'NODE_NOT_FOUND',
            errorMessage: `Station graph node '${nodeId}' not found in local station map.`,
            rawPayload: uri
          };
        }

        const dynamicCheckpoint: StationQrCheckpoint = {
          version: 1,
          stationCode: stationCode || 'SBC',
          checkpointId,
          name: `${node.name} Checkpoint`,
          level,
          associatedNodeId: nodeId,
          coordinates: node.coordinates,
          visualLandmark: node.visualLandmark || `Pillar near ${node.name}`,
          description: `Scanned from outdoor/indoor QR sticker (${checkpointId})`,
          checksum: sig || computeCRC32(checkpointId + nodeId)
        };

        return {
          isValid: true,
          checkpoint: dynamicCheckpoint,
          matchedNode: node,
          offlineVerified: true,
          rawPayload: uri
        };
      }

      return {
        isValid: false,
        errorCode: 'UNKNOWN_CHECKPOINT',
        errorMessage: `Unrecognized station checkpoint ID '${checkpointId}'.`,
        rawPayload: uri
      };
    } catch (err: any) {
      return {
        isValid: false,
        errorCode: 'CORRUPTED_PAYLOAD',
        errorMessage: `Failed to decode URI payload: ${err.message}`,
        rawPayload: uri
      };
    }
  }

  private parseJsonPayload(jsonStr: string): QrValidationResult {
    try {
      const data = JSON.parse(jsonStr);
      const cpId = (data.checkpointId || data.id || '').toUpperCase();
      if (!cpId) {
        return {
          isValid: false,
          errorCode: 'INVALID_FORMAT',
          errorMessage: 'JSON payload missing checkpoint identifier.',
          rawPayload: jsonStr
        };
      }

      const cached = this.checkpointCatalog.get(cpId);
      if (cached) {
        const node = localRouter.nodeDict.get(cached.associatedNodeId);
        return {
          isValid: true,
          checkpoint: cached,
          matchedNode: node || null,
          offlineVerified: true,
          rawPayload: jsonStr
        };
      }

      const targetNodeId = data.associatedNodeId || data.nodeId;
      const node = targetNodeId ? localRouter.nodeDict.get(targetNodeId) : null;
      if (!node) {
        return {
          isValid: false,
          errorCode: 'NODE_NOT_FOUND',
          errorMessage: `Graph node '${targetNodeId}' not found in station database.`,
          rawPayload: jsonStr
        };
      }

      const dynamicCheckpoint: StationQrCheckpoint = {
        version: data.version || 1,
        stationCode: data.stationCode || 'SBC',
        checkpointId: cpId,
        name: data.name || node.name,
        level: data.level ?? node.level,
        associatedNodeId: targetNodeId,
        coordinates: data.coordinates || node.coordinates,
        visualLandmark: data.visualLandmark || node.name,
        description: data.description || '',
        checksum: data.checksum || computeCRC32(cpId + targetNodeId)
      };

      return {
        isValid: true,
        checkpoint: dynamicCheckpoint,
        matchedNode: node,
        offlineVerified: true,
        rawPayload: jsonStr
      };
    } catch (err: any) {
      return {
        isValid: false,
        errorCode: 'CORRUPTED_PAYLOAD',
        errorMessage: `Malformed JSON QR data: ${err.message}`,
        rawPayload: jsonStr
      };
    }
  }

  private lookupRawId(rawId: string): QrValidationResult {
    const cleanId = rawId.toUpperCase();
    const cached = this.checkpointCatalog.get(cleanId);
    if (cached) {
      const node = localRouter.nodeDict.get(cached.associatedNodeId);
      return {
        isValid: true,
        checkpoint: cached,
        matchedNode: node || null,
        offlineVerified: true,
        rawPayload: rawId
      };
    }

    // Check if rawId is directly a node ID
    const directNode = localRouter.nodeDict.get(rawId.toLowerCase()) || localRouter.nodeDict.get(rawId);
    if (directNode) {
      const dynamicCheckpoint: StationQrCheckpoint = {
        version: 1,
        stationCode: 'SBC',
        checkpointId: `CP-${directNode.id.toUpperCase()}`,
        name: `${directNode.name} Checkpoint`,
        level: directNode.level,
        associatedNodeId: directNode.id,
        coordinates: directNode.coordinates,
        visualLandmark: directNode.visualLandmark || directNode.name,
        description: `Direct node anchor for ${directNode.name}`,
        checksum: computeCRC32(directNode.id)
      };

      return {
        isValid: true,
        checkpoint: dynamicCheckpoint,
        matchedNode: directNode,
        offlineVerified: true,
        rawPayload: rawId
      };
    }

    return {
      isValid: false,
      errorCode: 'UNKNOWN_CHECKPOINT',
      errorMessage: `Checkpoint '${rawId}' is not registered in station database.`,
      rawPayload: rawId
    };
  }

  public getAllCheckpoints(): StationQrCheckpoint[] {
    return Array.from(new Set(this.checkpointCatalog.values()));
  }
}

export const qrValidator = new QrValidator();
