import { describe, it, expect } from 'vitest';
import { DATOS_ENTRENADORES } from '@/data/trainers';
import { EntrenadorJSONSchema, EntrenadoresArraySchema } from '@/data/schemas/trainer.schema';
import trainersJson from '@/data/json/trainers.json';

function findTrainer(id: string) {
  return DATOS_ENTRENADORES.find((t) => t.id === id);
}

describe('Entrenadores — cantidad y existencia', () => {
  it('existen exactamente 9 entrenadores', () => {
    expect(DATOS_ENTRENADORES).toHaveLength(9);
  });

  it('todos tienen id, nombre, posición y equipo', () => {
    for (const t of DATOS_ENTRENADORES) {
      expect(t.id).toBeTruthy();
      expect(t.nombre).toBeTruthy();
      expect(typeof t.tileX).toBe('number');
      expect(typeof t.tileY).toBe('number');
      expect(t.equipo.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe.skip('Entrenadores — posiciones nuevas', () => {
  it('peón en (12, 15)', () => {
    const t = findTrainer('peon')!;
    expect(t.tileX).toBe(12);
    expect(t.tileY).toBe(15);
  });

  it('almacenero en (20, 14)', () => {
    const t = findTrainer('almacenero')!;
    expect(t.tileX).toBe(20);
    expect(t.tileY).toBe(14);
  });

  it('maestra en (22, 11)', () => {
    const t = findTrainer('maestra')!;
    expect(t.tileX).toBe(22);
    expect(t.tileY).toBe(11);
  });

  it('capataz en (54, 9) mirando sur', () => {
    const t = findTrainer('capataz')!;
    expect(t.tileX).toBe(54);
    expect(t.tileY).toBe(9);
    expect(t.direccion).toBe('down');
  });
});

describe('Cazadores nuevos', () => {
  it('Don Hilario existe con sabueso Lv10', () => {
    const t = findTrainer('cazador_1')!;
    expect(t).toBeDefined();
    expect(t.nombre).toBe('Don Hilario');
    expect(t.tileX).toBe(29);
    expect(t.tileY).toBe(10);
    expect(t.equipo).toHaveLength(1);
    expect(t.equipo[0].especieId).toBe('sabueso');
    expect(t.equipo[0].nivel).toBe(10);
  });

  it('Bartolo existe con sabueso Lv11 y jabalí Lv12', () => {
    const t = findTrainer('cazador_2')!;
    expect(t).toBeDefined();
    expect(t.nombre).toBe('Bartolo');
    expect(t.tileX).toBe(35);
    expect(t.tileY).toBe(17);
    expect(t.equipo).toHaveLength(2);
    expect(t.equipo[0].especieId).toBe('sabueso');
    expect(t.equipo[0].nivel).toBe(11);
    expect(t.equipo[1].especieId).toBe('jabali');
    expect(t.equipo[1].nivel).toBe(12);
  });
});

describe('Peones de la Estancia', () => {
  it('Eulogio existe en (53,12) mirando este con 2 criaturas', () => {
    const t = findTrainer('peon_eulogio')!;
    expect(t).toBeDefined();
    expect(t.nombre).toBe('Eulogio');
    expect(t.tileX).toBe(53);
    expect(t.tileY).toBe(12);
    expect(t.direccion).toBe('right');
    expect(t.visionTiles).toBe(1);
    expect(t.equipo).toHaveLength(2);
    expect(t.equipo[0].especieId).toBe('mara');
    expect(t.equipo[0].nivel).toBe(12);
    expect(t.equipo[1].especieId).toBe('vizcacha');
    expect(t.equipo[1].nivel).toBe(13);
    expect(t.flagDerrota).toBe('trainer.peon_eulogio_defeated');
    expect(t.dialogoPreBatalla).toBeTruthy();
    expect(t.dialogoPostDerrota).toBeTruthy();
  });

  it('Evaristo existe en (54,16) mirando oeste con 2 criaturas', () => {
    const t = findTrainer('peon_evaristo')!;
    expect(t).toBeDefined();
    expect(t.nombre).toBe('Evaristo');
    expect(t.tileX).toBe(54);
    expect(t.tileY).toBe(16);
    expect(t.direccion).toBe('left');
    expect(t.visionTiles).toBe(2);
    expect(t.equipo).toHaveLength(2);
    expect(t.equipo[0].especieId).toBe('hornero');
    expect(t.equipo[0].nivel).toBe(12);
    expect(t.equipo[1].especieId).toBe('nandu');
    expect(t.equipo[1].nivel).toBe(13);
    expect(t.flagDerrota).toBe('trainer.peon_evaristo_defeated');
    expect(t.dialogoPreBatalla).toBeTruthy();
    expect(t.dialogoPostDerrota).toBeTruthy();
  });
});

describe('modoActivacion — schema', () => {
  const baseTrainer = {
    id: 'test',
    nombre: 'Test',
    tileX: 0,
    tileY: 0,
    direccion: 'down' as const,
    visionTiles: 3,
    equipo: [{ especieId: 'hornero', nivel: 5 }],
    esJefeFinal: false,
  };

  it('sin modoActivacion defaultea a "vision"', () => {
    const result = EntrenadorJSONSchema.parse(baseTrainer);
    expect(result.modoActivacion).toBe('vision');
  });

  it('con modoActivacion "dialogo" carga OK', () => {
    const result = EntrenadorJSONSchema.parse({ ...baseTrainer, modoActivacion: 'dialogo' });
    expect(result.modoActivacion).toBe('dialogo');
  });

  it('con modoActivacion inválido falla validación', () => {
    expect(() => EntrenadorJSONSchema.parse({ ...baseTrainer, modoActivacion: 'invalido' })).toThrow();
  });
});

describe('modoActivacion — trainers.json', () => {
  it('trainers.json carga sin errores con los nuevos campos', () => {
    expect(() => EntrenadoresArraySchema.parse(trainersJson)).not.toThrow();
  });

  it('almacenero, maestra y capataz tienen modoActivacion "dialogo"', () => {
    for (const id of ['almacenero', 'maestra', 'capataz']) {
      const t = DATOS_ENTRENADORES.find((e) => e.id === id)!;
      expect(t, `entrenador ${id} no encontrado`).toBeDefined();
      expect(t.modoActivacion).toBe('dialogo');
    }
  });

  it('peon, cazador_1, cazador_2, peon_eulogio, peon_evaristo tienen modoActivacion "vision"', () => {
    for (const id of ['peon', 'cazador_1', 'cazador_2', 'peon_eulogio', 'peon_evaristo']) {
      const t = DATOS_ENTRENADORES.find((e) => e.id === id)!;
      expect(t, `entrenador ${id} no encontrado`).toBeDefined();
      expect(t.modoActivacion).toBe('vision');
    }
  });
});

describe('Capataz — niveles subidos', () => {
  it('Yarará Lv15, Peludo Lv16, Ñandú Lv17', () => {
    const t = findTrainer('capataz')!;
    expect(t.equipo).toHaveLength(3);
    const yarara = t.equipo.find((e) => e.especieId === 'yarara')!;
    const peludo = t.equipo.find((e) => e.especieId === 'peludo')!;
    const nandu = t.equipo.find((e) => e.especieId === 'nandu')!;
    expect(yarara.nivel).toBe(15);
    expect(peludo.nivel).toBe(16);
    expect(nandu.nivel).toBe(17);
  });

  it('capataz es jefe final', () => {
    const t = findTrainer('capataz')!;
    expect(t.esJefeFinal).toBe(true);
  });
});

describe('Juan — entrenador nuevo', () => {
  it('existe en (35, 5) con sabueso Lv15', () => {
    const t = findTrainer('trainer_1780193209975')!;
    expect(t).toBeDefined();
    expect(t.nombre).toBe('Juan');
    expect(t.tileX).toBe(35);
    expect(t.tileY).toBe(5);
    expect(t.modoActivacion).toBe('vision');
    expect(t.equipo).toHaveLength(1);
    expect(t.equipo[0].especieId).toBe('sabueso');
    expect(t.equipo[0].nivel).toBe(15);
    expect(t.flagDerrota).toBe('trainer.trainer_1780193209975_defeated');
  });
});
