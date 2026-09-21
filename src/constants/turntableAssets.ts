import { ASSET_DIRECTORIES } from './assets';
import { assetUrl } from '../utils/assetUrl';
import {
  VINYL_PLAYER_BODY,
  VINYL_PLAYER_CANVAS,
  VINYL_PLAYER_DECK_BOUNDS,
  VINYL_PLAYER_DISC_IN_IMAGE,
  VINYL_PLAYER_PLATTER,
  VINYL_PLAYER_TONEARM_PIVOT,
  VINYL_PLAYER_TONEARM_REST_DEG,
} from './vinylPlayerGeometry';

const TURNTABLE_DIRECTORY = `${ASSET_DIRECTORIES.images}/turntable`;

/**
 * Слои VinylPlayer (PNG на холсте 1408×768).
 * Имена TURNTABLE_* сохранены для cssVariables / desk / intro.
 */
export const TURNTABLE_IMAGES = {
  'player-body': assetUrl(`${TURNTABLE_DIRECTORY}/player-body.png`),
  vinyl: assetUrl(`${TURNTABLE_DIRECTORY}/vinyl.png`),
  tonearm: assetUrl(`${TURNTABLE_DIRECTORY}/tonearm.png`),
} as const;

export const TURNTABLE_CANVAS = VINYL_PLAYER_CANVAS;
export const TURNTABLE_BODY_RECT = VINYL_PLAYER_BODY;
export const TURNTABLE_VINYL_PLACEMENT = VINYL_PLAYER_PLATTER;
export const VINYL_IMAGE_DISC = VINYL_PLAYER_DISC_IN_IMAGE;
export const TONEARM_PIVOT = VINYL_PLAYER_TONEARM_PIVOT;
export const TONEARM_REST_ANGLE_DEG = VINYL_PLAYER_TONEARM_REST_DEG;
export const TURNTABLE_DECK_BOUNDS = VINYL_PLAYER_DECK_BOUNDS;
