export type EquipmentItem = {
  id: string;
  label: string;
  category: string;
  injuryNote?: string;
};

export const EQUIPMENT_LIST: EquipmentItem[] = [
  { id: "barbell", label: "Barbell", category: "Free Weights" },
  { id: "dumbbells", label: "Dumbbells", category: "Free Weights" },
  { id: "ez_bar", label: "EZ-Curl Bar", category: "Free Weights" },
  { id: "trap_bar", label: "Hex / Trap Bar", category: "Free Weights" },
  { id: "kettlebells", label: "Kettlebells", category: "Free Weights" },
  { id: "weight_plates", label: "Weight Plates", category: "Free Weights" },
  { id: "power_rack", label: "Power Rack / Squat Rack", category: "Racks & Benches" },
  { id: "smith_machine", label: "Smith Machine", category: "Racks & Benches" },
  { id: "flat_bench", label: "Flat Bench", category: "Racks & Benches" },
  { id: "incline_bench", label: "Incline Bench", category: "Racks & Benches" },
  { id: "decline_bench", label: "Decline Bench", category: "Racks & Benches" },
  { id: "preacher_curl", label: "Preacher Curl Station", category: "Racks & Benches" },
  { id: "landmine", label: "Landmine Attachment", category: "Racks & Benches" },
  { id: "cable_machine", label: "Cable Machine (High/Low Pulley)", category: "Cable Machines" },
  { id: "cable_crossover", label: "Cable Crossover", category: "Cable Machines" },
  { id: "functional_trainer", label: "Functional Trainer", category: "Cable Machines" },
  { id: "lat_pulldown", label: "Lat Pulldown Machine", category: "Upper Body Machines" },
  { id: "seated_cable_row", label: "Seated Cable Row", category: "Upper Body Machines" },
  { id: "tbar_row", label: "T-Bar Row Machine", category: "Upper Body Machines" },
  { id: "chest_press_machine", label: "Chest Press Machine", category: "Upper Body Machines" },
  { id: "pec_deck", label: "Pec Deck / Fly Machine", category: "Upper Body Machines" },
  { id: "shoulder_press_machine", label: "Shoulder Press Machine", category: "Upper Body Machines" },
  { id: "lateral_raise_machine", label: "Lateral Raise Machine", category: "Upper Body Machines" },
  { id: "rear_delt_machine", label: "Rear Delt / Reverse Fly Machine", category: "Upper Body Machines" },
  { id: "row_machine", label: "Chest Supported Row Machine", category: "Upper Body Machines" },
  { id: "pullover_machine", label: "Pullover Machine", category: "Upper Body Machines" },
  { id: "bicep_curl_machine", label: "Bicep Curl Machine", category: "Upper Body Machines" },
  { id: "tricep_pushdown_machine", label: "Tricep Extension Machine", category: "Upper Body Machines" },
  { id: "assisted_pullup", label: "Assisted Pull-Up / Dip Machine", category: "Upper Body Machines" },
  { id: "leg_press", label: "Leg Press Machine", category: "Lower Body Machines" },
  { id: "hack_squat", label: "Hack Squat Machine", category: "Lower Body Machines", injuryNote: "May load lumbar spine" },
  { id: "leg_extension", label: "Leg Extension Machine", category: "Lower Body Machines" },
  { id: "leg_curl_lying", label: "Lying Leg Curl Machine", category: "Lower Body Machines" },
  { id: "leg_curl_seated", label: "Seated Leg Curl Machine", category: "Lower Body Machines" },
  { id: "hip_thrust_machine", label: "Hip Thrust Machine / Glute Drive", category: "Lower Body Machines" },
  { id: "adductor_machine", label: "Adductor Machine (Inner Thigh)", category: "Lower Body Machines" },
  { id: "abductor_machine", label: "Abductor Machine (Outer Thigh)", category: "Lower Body Machines" },
  { id: "standing_calf_raise", label: "Standing Calf Raise Machine", category: "Lower Body Machines" },
  { id: "seated_calf_raise", label: "Seated Calf Raise Machine", category: "Lower Body Machines" },
  { id: "glute_ham", label: "GHD (Glute-Ham Developer)", category: "Lower Body Machines", injuryNote: "High lumbar load" },
  { id: "pullup_bar", label: "Pull-Up Bar", category: "Bodyweight" },
  { id: "dip_bars", label: "Dip Bars / Parallel Bars", category: "Bodyweight" },
  { id: "rings", label: "Gymnastic Rings", category: "Bodyweight" },
  { id: "ab_wheel", label: "Ab Wheel", category: "Bodyweight" },
  { id: "captain_chair", label: "Captain's Chair / Leg Raise Station", category: "Bodyweight" },
  { id: "treadmill", label: "Treadmill", category: "Cardio" },
  { id: "stationary_bike", label: "Stationary Bike", category: "Cardio" },
  { id: "rowing_machine", label: "Rowing Machine (Concept2)", category: "Cardio" },
  { id: "elliptical", label: "Elliptical", category: "Cardio" },
  { id: "stairmaster", label: "Stairmaster / Step Mill", category: "Cardio" },
  { id: "assault_bike", label: "Assault Bike / Air Bike", category: "Cardio" },
  { id: "ski_erg", label: "SkiErg", category: "Cardio" },
  { id: "resistance_bands", label: "Resistance Bands", category: "Accessories" },
  { id: "dip_belt", label: "Dip Belt (Weighted)", category: "Accessories" },
  { id: "belt", label: "Lifting Belt", category: "Accessories" },
  { id: "foam_roller", label: "Foam Roller", category: "Accessories" },
  { id: "cable_rope", label: "Cable Rope Attachment", category: "Accessories" },
  { id: "straight_bar_cable", label: "Straight Bar Cable Attachment", category: "Accessories" },
  { id: "v_bar_cable", label: "V-Bar / Close-Grip Attachment", category: "Accessories" },
  { id: "ankle_strap", label: "Ankle Strap (Cable Kickbacks etc.)", category: "Accessories" },
];

export function groupEquipment(): Record<string, EquipmentItem[]> {
  return EQUIPMENT_LIST.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, EquipmentItem[]>);
}

export function buildEquipmentContext(selectedIds: string[]): string {
  if (selectedIds.length === 0) return "No specific equipment constraints provided.";
  const selected = EQUIPMENT_LIST.filter((e) => selectedIds.includes(e.id));
  const byCategory = selected.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item.label);
    return acc;
  }, {} as Record<string, string[]>);
  return Object.entries(byCategory).map(([cat, items]) => `${cat}: ${items.join(", ")}`).join("\n");
}
