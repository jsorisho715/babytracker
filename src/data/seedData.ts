import type { Task, ShoppingItem, Goal } from '../types';

export const seedTasks: Task[] = [
  // Nursery
  { id: 't1', category: 'Nursery', task: 'Remove bed and desks from nursery', priority: 'High', timing: 'ASAP', status: 'pending', points: 50 },
  { id: 't2', category: 'Nursery', task: 'Order dresser', priority: 'High', timing: 'ASAP', status: 'done', points: 25 },
  { id: 't3', category: 'Nursery', task: 'Order rocker/recliner', priority: 'High', timing: 'ASAP', status: 'done', points: 25 },
  { id: 't4', category: 'Nursery', task: 'Rearrange master bedroom for bassinet + bedside cart', priority: 'High', timing: 'ASAP', status: 'pending', points: 100 },
  { id: 't5', category: 'Nursery', task: 'Set up bassinet', priority: 'High', timing: 'ASAP', status: 'pending', points: 25 },
  { id: 't6', category: 'Nursery', task: 'Set up downstairs safe sleep space (pack n play - bassinet ready)', priority: 'High', timing: 'ASAP', status: 'pending', points: 50 },
  { id: 't7', category: 'Nursery', task: 'Get items from parents garage', priority: 'High', timing: 'ASAP', status: 'pending', points: 25 },
  { id: 't8', category: 'Nursery', task: 'Bring items into house and organize', priority: 'High', timing: 'ASAP', status: 'pending', points: 25 },
  { id: 't9', category: 'Nursery', task: 'Paint nursery', priority: 'Low', timing: 'If energy allows', status: 'pending', points: 50 },
  { id: 't10', category: 'Nursery', task: 'Order nursery name sign', priority: 'Low', timing: 'Week 35', status: 'pending', points: 10 },
  { id: 't11', category: 'Nursery', task: 'Order nursery bear prints', priority: 'Low', timing: 'Week 36', status: 'pending', points: 10 },
  { id: 't12', category: 'Nursery', task: 'Set up baby swing', priority: 'Medium', timing: 'Week 35', status: 'pending', points: 25 },

  // Baby Clothing
  { id: 't13', category: 'Baby Clothing', task: 'Wash baby clothes', priority: 'High', timing: 'ASAP', status: 'pending', points: 25 },
  { id: 't14', category: 'Baby Clothing', task: 'Sort baby clothes by size', priority: 'High', timing: 'ASAP', status: 'done', points: 25 },
  { id: 't15', category: 'Baby Clothing', task: 'Put baby clothes away', priority: 'High', timing: 'ASAP', status: 'pending', points: 25 },
  { id: 't16', category: 'Baby Clothing', task: 'Set up baby clothes storage system', priority: 'Medium', timing: 'ASAP', status: 'pending', points: 25 },

  // Feeding / Bottle Area
  { id: 't17', category: 'Feeding / Bottle Area', task: 'Set up bottle washing station', priority: 'High', timing: 'ASAP', status: 'pending', points: 25 },
  { id: 't18', category: 'Feeding / Bottle Area', task: 'Take down wine rack', priority: 'Medium', timing: 'ASAP', status: 'pending', points: 10 },
  { id: 't19', category: 'Feeding / Bottle Area', task: 'Organize cabinets under bottle station', priority: 'Medium', timing: 'ASAP', status: 'pending', points: 10 },

  // Diapering
  { id: 't20', category: 'Diapering', task: 'Order newborn diapers (200+)', priority: 'High', timing: 'ASAP', status: 'pending', points: 25 },
  { id: 't21', category: 'Diapering', task: 'Set up diaper stations', priority: 'High', timing: 'ASAP', status: 'pending', points: 50 },
  { id: 't22', category: 'Diapering', task: 'Create diaper caddies', priority: 'Medium', timing: 'ASAP', status: 'pending', points: 10 },
  { id: 't23', category: 'Diapering', task: 'Organize diapers and wipes', priority: 'Medium', timing: 'Week 35', status: 'pending', points: 10 },

  // Postpartum Recovery
  { id: 't24', category: 'Postpartum Recovery', task: 'Set up postpartum bathroom upstairs', priority: 'High', timing: 'ASAP', status: 'pending', points: 50 },
  { id: 't25', category: 'Postpartum Recovery', task: 'Set up postpartum bathroom downstairs', priority: 'High', timing: 'ASAP', status: 'pending', points: 50 },
  { id: 't26', category: 'Postpartum Recovery', task: 'Postpartum recovery supplies ready', priority: 'High', timing: 'ASAP', status: 'pending', points: 25 },

  // Medical / Birth
  { id: 't27', category: 'Medical / Birth', task: 'Register at hospital', priority: 'High', timing: 'ASAP', status: 'pending', points: 50 },
  { id: 't28', category: 'Medical / Birth', task: 'Secure pediatrician', priority: 'High', timing: 'ASAP', status: 'pending', points: 50, notes: 'Camelback will not see us, will ask Naya for her contact info. Also look into cost details for concierge pediatrician that comes to you.' },
  { id: 't29', category: 'Medical / Birth', task: 'Call 3 doulas', priority: 'High', timing: 'ASAP', status: 'pending', points: 25 },
  { id: 't30', category: 'Medical / Birth', task: 'Choose and secure doula', priority: 'High', timing: 'Week 35', status: 'pending', points: 100 },
  { id: 't31', category: 'Medical / Birth', task: 'Finalize birth plan (review at 36 week appt)', priority: 'High', timing: 'Week 35', status: 'pending', points: 100 },
  { id: 't32', category: 'Medical / Birth', task: 'Order TENS machine', priority: 'High', timing: 'Week 35', status: 'pending', points: 25 },
  { id: 't33', category: 'Medical / Birth', task: 'Order birth comb', priority: 'Medium', timing: 'Week 35', status: 'pending', points: 10 },
  { id: 't34', category: 'Medical / Birth', task: 'Sign up for hypnobirthing class', priority: 'High', timing: 'ASAP', status: 'pending', points: 50 },
  { id: 't35', category: 'Medical / Birth', task: 'Complete hypnobirthing class', priority: 'High', timing: 'Before birth', status: 'pending', points: 100 },
  { id: 't36', category: 'Medical / Birth', task: 'Practice breathing and relaxation daily', priority: 'Medium', timing: 'Daily', status: 'pending', points: 10, isDaily: true },
  { id: 't37', category: 'Medical / Birth', task: 'Learn partner counter pressure techniques', priority: 'Medium', timing: 'Week 35', status: 'pending', points: 25 },
  { id: 't38', category: 'Medical / Birth', task: 'Buy heating/cooling pads for labor support', priority: 'Low', timing: 'Week 35', status: 'pending', points: 10 },
  { id: 't39', category: 'Medical / Birth', task: 'Get rebozo or scarf for hip support', priority: 'Low', timing: 'Week 35', status: 'pending', points: 10 },
  { id: 't40', category: 'Medical / Birth', task: 'Get massage oil or roller', priority: 'Low', timing: 'Week 35', status: 'pending', points: 5 },

  // Car / Leaving Hospital
  { id: 't41', category: 'Car / Leaving Hospital', task: 'Install car seat', priority: 'High', timing: 'ASAP', status: 'pending', points: 50 },
  { id: 't42', category: 'Car / Leaving Hospital', task: 'Install car camera/mirror', priority: 'Medium', timing: 'Week 35', status: 'pending', points: 10 },
  { id: 't43', category: 'Car / Leaving Hospital', task: 'Clean out & detail car', priority: 'Medium', timing: 'Week 35', status: 'pending', points: 25 },

  // Hospital Prep
  { id: 't44', category: 'Hospital Prep', task: 'Pack hospital bag for mom', priority: 'High', timing: 'Week 35', status: 'pending', points: 25 },
  { id: 't45', category: 'Hospital Prep', task: 'Pack hospital bag for baby', priority: 'High', timing: 'Week 35', status: 'pending', points: 25 },
  { id: 't46', category: 'Hospital Prep', task: 'Pack hospital bag for dad', priority: 'Medium', timing: 'Week 35', status: 'pending', points: 25 },
  { id: 't47', category: 'Hospital Prep', task: 'Order blue supplies for nurse baskets', priority: 'Low', timing: 'Week 36', status: 'pending', points: 10 },
  { id: 't48', category: 'Hospital Prep', task: 'Nurse thank you baskets', priority: 'Low', timing: 'Week 37', status: 'pending', points: 10 },
  { id: 't49', category: 'Hospital Prep', task: 'Print birth plan', priority: 'Low', timing: 'Week 35', status: 'pending', points: 5 },
  { id: 't50', category: 'Hospital Prep', task: 'Add electrolytes to hospital bag', priority: 'Low', timing: 'Week 36', status: 'pending', points: 5 },
  { id: 't51', category: 'Hospital Prep', task: 'Pack cozy socks and robe', priority: 'Low', timing: 'Week 36', status: 'pending', points: 5 },
  { id: 't52', category: 'Hospital Prep', task: 'Add lip balm to hospital bag', priority: 'Low', timing: 'Week 36', status: 'pending', points: 5 },
  { id: 't53', category: 'Hospital Prep', task: 'Create labor playlist', priority: 'Low', timing: 'Week 36', status: 'pending', points: 10 },

  // Admin / Orders
  { id: 't54', category: 'Admin / Orders', task: 'Order thank-you cards from shower', priority: 'Medium', timing: 'Week 35', status: 'pending', points: 10 },
  { id: 't55', category: 'Admin / Orders', task: 'Write thank-you cards', priority: 'Low', timing: 'Optional', status: 'pending', points: 10 },
  { id: 't56', category: 'Admin / Orders', task: 'Order custom going home outfit for Luca', priority: 'Medium', timing: 'Week 35', status: 'pending', points: 10 },

  // House / Organization
  { id: 't57', category: 'House / Organization', task: 'Move freezer outside', priority: 'Medium', timing: 'Before birth', status: 'pending', points: 25 },
  { id: 't58', category: 'House / Organization', task: 'Move desk to kitchen area', priority: 'Medium', timing: 'Before birth', status: 'pending', points: 25 },
  { id: 't59', category: 'House / Organization', task: 'Hang picture frames', priority: 'Low', timing: 'After birth ok', status: 'pending', points: 5 },

  // Body Prep
  { id: 't60', category: 'Body Prep', task: 'Start eating dates daily', priority: 'Medium', timing: 'Daily', status: 'pending', points: 10, isDaily: true },
  { id: 't61', category: 'Body Prep', task: 'Start raspberry leaf tea daily', priority: 'Medium', timing: 'Daily', status: 'pending', points: 10, isDaily: true },
  { id: 't62', category: 'Body Prep', task: 'Blow up yoga ball', priority: 'Low', timing: 'This week', status: 'pending', points: 5 },
  { id: 't63', category: 'Body Prep', task: 'Start yoga ball exercises daily', priority: 'Medium', timing: 'Daily gentle', status: 'pending', points: 10, isDaily: true },

  // Final Prep
  { id: 't64', category: 'Final Prep', task: 'Final grocery and household stock', priority: 'Medium', timing: 'Week 36', status: 'pending', points: 25 },
  { id: 't65', category: 'Final Prep', task: 'Install baby monitor', priority: 'Low', timing: 'Week 36', status: 'pending', points: 10 },
  { id: 't66', category: 'Final Prep', task: 'Prep stroller', priority: 'Low', timing: 'Week 36', status: 'pending', points: 10 },
  { id: 't67', category: 'Final Prep', task: 'Charge devices and camera', priority: 'Low', timing: 'Week 36', status: 'pending', points: 5 },
  { id: 't68', category: 'Final Prep', task: 'Rest and slow down', priority: 'High', timing: 'Week 36', status: 'pending', points: 25 },

  // After Baby
  { id: 't69', category: 'After Baby', task: 'Add baby to insurance', priority: 'Low', timing: 'After birth', status: 'pending', points: 50 },
  { id: 't70', category: 'After Baby', task: 'Pediatrician first visit', priority: 'Low', timing: 'After birth', status: 'pending', points: 25 },
  { id: 't71', category: 'After Baby', task: 'Order birth certificate copies', priority: 'Low', timing: 'After birth', status: 'pending', points: 10 },
  { id: 't72', category: 'After Baby', task: 'Finish thank-you cards if needed', priority: 'Low', timing: 'After birth', status: 'pending', points: 10 },
  { id: 't73', category: 'After Baby', task: 'Send birth announcements', priority: 'Low', timing: 'After birth', status: 'pending', points: 10 },
  { id: 't74', category: 'After Baby', task: 'Organize photos and memories', priority: 'Low', timing: 'After birth', status: 'pending', points: 10 },
];

export const seedShoppingItems: ShoppingItem[] = [
  { id: 's1', name: 'Crib', price: undefined, stock: undefined, status: 'Need to Purchase', points: 50 },
  { id: 's2', name: 'Diapers (newborn 200+)', price: undefined, stock: undefined, status: 'Need to Purchase', points: 25 },
  { id: 's3', name: 'Toys', price: undefined, stock: undefined, status: 'Need to Purchase', points: 10 },
  { id: 's4', name: 'Baby Bottles', price: undefined, stock: undefined, status: 'Need to Purchase', points: 25 },
  { id: 's5', name: 'Formula', price: undefined, stock: undefined, status: 'Need to Purchase', points: 10 },
  { id: 's6', name: 'Breast Pump', price: undefined, stock: undefined, status: 'Need to Purchase', points: 50 },
];

export const seedGoals: Goal[] = [
  { id: 'g1', name: 'Buy a house', completed: false },
  { id: 'g2', name: 'Budget', completed: false },
  { id: 'g3', name: 'Read more books on babies', completed: false },
  { id: 'g4', name: 'Find babysitters', completed: false },
  { id: 'g5', name: 'How we\'re telling people', completed: false },
  { id: 'g6', name: 'Time off work', completed: false },
];

export const TASK_CATEGORIES = [
  'Nursery',
  'Baby Clothing',
  'Feeding / Bottle Area',
  'Diapering',
  'Postpartum Recovery',
  'Medical / Birth',
  'Car / Leaving Hospital',
  'Hospital Prep',
  'Admin / Orders',
  'House / Organization',
  'Body Prep',
  'Final Prep',
  'After Baby',
] as const;

export const CATEGORY_EMOJIS: Record<string, string> = {
  'Nursery': '🛏️',
  'Baby Clothing': '👶',
  'Feeding / Bottle Area': '🍼',
  'Diapering': '🧷',
  'Postpartum Recovery': '💆',
  'Medical / Birth': '🏥',
  'Car / Leaving Hospital': '🚗',
  'Hospital Prep': '🎒',
  'Admin / Orders': '📦',
  'House / Organization': '🏠',
  'Body Prep': '🧘',
  'Final Prep': '✅',
  'After Baby': '🎉',
};

export const POINT_TIER_LABELS: Record<number, string> = {
  5: 'Quick Win',
  10: 'Easy',
  25: 'Medium',
  50: 'Hard',
  100: 'Boss Level',
};

export const MILESTONE_MESSAGES: Array<{ points: number; message: string }> = [
  { points: 100, message: '🎉 100 points! Team Luca is on a roll!' },
  { points: 250, message: '⭐ 250 points! You\'re amazing parents already!' },
  { points: 500, message: '🏆 500 points! Team Luca – Nursery ready!' },
  { points: 750, message: '🚀 750 points! Hospital bag heroes!' },
  { points: 1000, message: '👑 1000 points! Luca is so lucky to have you!' },
];
