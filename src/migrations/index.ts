import * as migration_20260423_134230 from './20260423_134230';
import * as migration_20260425_083636 from './20260425_083636';

export const migrations = [
  {
    up: migration_20260423_134230.up,
    down: migration_20260423_134230.down,
    name: '20260423_134230',
  },
  {
    up: migration_20260425_083636.up,
    down: migration_20260425_083636.down,
    name: '20260425_083636'
  },
];
