import trainersJson from '@/data/json/trainers.json';
import { EntrenadoresArraySchema } from '@/data/schemas/trainer.schema';
import { ESPECIES } from '@/data/loaders/loadCreatures';

export interface EquipoEntrenador {
  especieId: string;
  nivel: number;
}

export interface DatosEntrenador {
  id: string;
  nombre: string;
  tileX: number;
  tileY: number;
  direccion: 'up' | 'down' | 'left' | 'right';
  visionTiles: number;
  equipo: EquipoEntrenador[];
  esJefeFinal?: boolean;
  spriteKey?: string;
  flagDerrota?: string;
  dialogoPreBatalla?: string;
  dialogoPostDerrota?: string;
  modoActivacion: 'vision' | 'dialogo';
}

function loadTrainers(): DatosEntrenador[] {
  let parsed;
  try {
    parsed = EntrenadoresArraySchema.parse(trainersJson);
  } catch (err) {
    console.error('Error parsing trainers.json:', err);
    throw new Error('Failed to load trainers data. Check trainers.json structure.');
  }

  for (const t of parsed) {
    for (const m of t.equipo) {
      if (!ESPECIES[m.especieId]) {
        throw new Error(`Trainer ${t.id} references unknown species: ${m.especieId}`);
      }
    }
  }

  return parsed.map((t) => ({
    ...t,
    esJefeFinal: t.esJefeFinal || undefined,
    spriteKey: t.spriteKey,
    flagDerrota: t.flagDerrota,
    dialogoPreBatalla: t.dialogoPreBatalla,
    dialogoPostDerrota: t.dialogoPostDerrota,
    modoActivacion: t.modoActivacion,
  }));
}

export const DATOS_ENTRENADORES: DatosEntrenador[] = loadTrainers();
