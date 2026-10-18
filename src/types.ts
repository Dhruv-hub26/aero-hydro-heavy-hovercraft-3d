export type CamoType = 'slate' | 'arctic' | 'desert' | 'abyss';

export type SpeedMode = 0.5 | 1.0 | 2.0;

export type CameraPreset = 'orbit' | 'cockpit' | 'turbines' | 'top';

export interface TelemetryData {
  speedKnots: number;
  speedKmh: number;
  rpm: number;
  plenumPressureKPa: number;
  trimAngleDeg: number;
  waveHeightM: number;
  bearingDeg: number;
  trianglesCount: number;
  fanRps: number;
}

export interface CamoPreset {
  id: CamoType;
  label: string;
  color: string;
  hullColor: string;
  accentColor: string;
  roughness: number;
  metalness: number;
}
