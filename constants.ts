import { Area, CheckpointName } from './types';

export const SECTIONS = ['BISCUIT', 'PC', 'COMMON', 'UTILITY'] as const;

export const CHECKPOINTS: { name: CheckpointName; weightage: number }[] = [
  { name: 'Manpower Skill', weightage: 0.15 },
  { name: 'Cleaning Schedule Followed', weightage: 0.30 },
  { name: 'Equipment Status', weightage: 0.15 },
  { name: 'Cobweb / Floor Cleaning & Hygiene', weightage: 0.15 },
  { name: 'Spillage', weightage: 0.15 },
  { name: 'GMP / GHP Compliance', weightage: 0.10 },
];

export const AREAS: Area[] = [
  // BISCUIT Section
  { id: 'biscuit_maida', name: 'Maida Sampling Room', weightage: 2, section: 'BISCUIT' },
  { id: 'biscuit_bulk', name: 'Bulk Handling Unit', weightage: 10, section: 'BISCUIT' },
  { id: 'biscuit_blackjac', name: 'Black Jac Preparation & Storage', weightage: 3, section: 'BISCUIT' },
  { id: 'biscuit_premix', name: 'Premixing Area', weightage: 5, section: 'BISCUIT' },
  { id: 'biscuit_molding', name: 'Moulding Area', weightage: 10, section: 'BISCUIT' },
  { id: 'biscuit_oven', name: 'Oven Area', weightage: 2, section: 'BISCUIT' },
  { id: 'biscuit_cooling', name: 'Cooling Tunnel Area', weightage: 10, section: 'BISCUIT' },
  { id: 'biscuit_lean', name: 'Biscuit Lean Area', weightage: 3, section: 'BISCUIT' },
  { id: 'biscuit_precream', name: 'Precreaming & Weighing', weightage: 5, section: 'BISCUIT' },
  { id: 'biscuit_flavour_prep', name: 'Flavour Preparation Room', weightage: 5, section: 'BISCUIT' },
  { id: 'biscuit_flavour_stor', name: 'Flavour Storage Room', weightage: 2, section: 'BISCUIT' },
  { id: 'biscuit_sandwich', name: 'Sandwich Room', weightage: 10, section: 'BISCUIT' },
  { id: 'biscuit_cream_prep', name: 'Cream Preparation Room', weightage: 5, section: 'BISCUIT' },
  { id: 'biscuit_cream_wash', name: 'Cream Utensils Wash Area', weightage: 5, section: 'BISCUIT' },
  { id: 'biscuit_sugar', name: 'Sugar Grinding Room', weightage: 3, section: 'BISCUIT' },
  { id: 'biscuit_packaging', name: 'Packaging Hall', weightage: 10, section: 'BISCUIT' },
  { id: 'biscuit_fg', name: 'FG Warehouse', weightage: 5, section: 'BISCUIT' },
  { id: 'biscuit_scrap', name: 'Scrap Room', weightage: 5, section: 'BISCUIT' },
  
  // PC Section
  { id: 'pc_unloading', name: 'Unloading Area', weightage: 5, section: 'PC' },
  { id: 'pc_cold_storage', name: 'Cold Storage', weightage: 5, section: 'PC' },
  { id: 'pc_starch_room', name: 'Starch Room', weightage: 5, section: 'PC' },
  { id: 'pc_scrap_room', name: 'Scrap Room', weightage: 10, section: 'PC' },
  { id: 'pc_dumper', name: 'Dumper', weightage: 5, section: 'PC' },
  { id: 'pc_fat_trap', name: 'Fat Trap Area', weightage: 10, section: 'PC' },
  { id: 'pc_peeler', name: 'Peeler and Trim n Pare', weightage: 5, section: 'PC' },
  { id: 'pc_slicer', name: 'Slicer', weightage: 5, section: 'PC' },
  { id: 'pc_blancher', name: 'Blancher', weightage: 5, section: 'PC' },
  { id: 'pc_fryer', name: 'Fryer', weightage: 5, section: 'PC' },
  { id: 'pc_optyx', name: 'Optyx', weightage: 10, section: 'PC' },
  { id: 'pc_seasoning', name: 'Seasoning', weightage: 5, section: 'PC' },
  { id: 'pc_packing', name: 'Packing', weightage: 10, section: 'PC' },
  { id: 'pc_taping', name: 'Taping', weightage: 5, section: 'PC' },
  { id: 'pc_ods_seasoning', name: 'ODS + Seasoning Storage', weightage: 5, section: 'PC' },
  { id: 'pc_pm_area', name: 'PM Area', weightage: 5, section: 'PC' },
  { id: 'common_corridor', name: 'Main Corridor', weightage: 5, section: 'COMMON' },
  { id: 'utility_boiler', name: 'Boiler Room', weightage: 8, section: 'UTILITY' },
];
