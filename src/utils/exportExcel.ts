import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { Task, ShoppingItem, Goal, Player, PlayerScore } from '../types';

interface ExportData {
  tasks: Task[];
  shopping: ShoppingItem[];
  goals: Goal[];
  scores: Record<Player, PlayerScore>;
  settings: { babyName: string; dueDate?: string };
}

const SAGE = 'FF8BA88B';
const SAGE_LIGHT = 'FFE8F0E8';
const ROSE = 'FFD4918E';
const ROSE_LIGHT = 'FFFCE8E7';
const CREAM = 'FFFAF6F0';
const WARM_GRAY = 'FF9B9082';
const DARK_TEXT = 'FF2D2D2D';
const WHITE = 'FFFFFFFF';

function headerFill(color: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
}

function headerFont(color = WHITE): ExcelJS.Font {
  return { bold: true, size: 12, color: { argb: color } };
}

function applyHeaderRow(row: ExcelJS.Row, fill: ExcelJS.Fill, font: ExcelJS.Font, colCount: number) {
  row.font = font;
  row.fill = fill;
  row.alignment = { vertical: 'middle', horizontal: 'left' };
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.border = {
      bottom: { style: 'thin', color: { argb: WARM_GRAY } },
    };
  }
}

function addSectionTitle(ws: ExcelJS.Worksheet, title: string, colSpan: number, fillColor: string) {
  const row = ws.addRow([title]);
  ws.mergeCells(row.number, 1, row.number, colSpan);
  row.font = { bold: true, size: 13, color: { argb: WHITE } };
  row.fill = headerFill(fillColor);
  row.alignment = { vertical: 'middle', horizontal: 'left' };
  row.height = 28;
}

function addStatRow(ws: ExcelJS.Worksheet, label: string, value: string | number, bgColor?: string) {
  const row = ws.addRow([label, value]);
  row.font = { size: 11, color: { argb: DARK_TEXT } };
  row.getCell(1).font = { bold: true, size: 11, color: { argb: DARK_TEXT } };
  if (bgColor) {
    row.getCell(1).fill = headerFill(bgColor);
    row.getCell(2).fill = headerFill(bgColor);
  }
}

function buildSummarySheet(wb: ExcelJS.Workbook, data: ExportData) {
  const ws = wb.addWorksheet('Summary');
  ws.columns = [
    { width: 32 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
  ];

  // Title
  const titleRow = ws.addRow([`${data.settings.babyName} Tracker — Summary`]);
  ws.mergeCells(titleRow.number, 1, titleRow.number, 4);
  titleRow.font = { bold: true, size: 16, color: { argb: DARK_TEXT } };
  titleRow.height = 30;
  titleRow.alignment = { vertical: 'middle' };

  const dateRow = ws.addRow([`Exported ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`]);
  ws.mergeCells(dateRow.number, 1, dateRow.number, 4);
  dateRow.font = { italic: true, size: 10, color: { argb: WARM_GRAY } };
  ws.addRow([]);

  // --- Team Progress ---
  const nonDailyTasks = data.tasks.filter(t => !t.isDaily);
  const totalDone = nonDailyTasks.filter(t => t.status === 'done').length
    + data.shopping.filter(s => s.status === 'Purchased').length
    + data.goals.filter(g => g.completed).length;
  const totalItems = nonDailyTasks.length + data.shopping.length + data.goals.length;
  const johnPts = data.scores.johnathan?.totalPoints ?? 0;
  const jordynPts = data.scores.jordyn?.totalPoints ?? 0;
  const totalPoints = johnPts + jordynPts;
  const overallPct = totalItems ? Math.round((totalDone / totalItems) * 100) : 0;

  addSectionTitle(ws, 'Team Progress', 4, SAGE);
  addStatRow(ws, 'Combined Points', totalPoints, CREAM);
  addStatRow(ws, 'Items Completed', `${totalDone} of ${totalItems} (${overallPct}%)`);
  addStatRow(ws, 'Overall Completion', `${overallPct}%`, CREAM);
  ws.addRow([]);

  // --- Player Breakdown ---
  addSectionTitle(ws, 'Player Breakdown', 4, SAGE);
  const playerHeader = ws.addRow(['', data.scores.johnathan?.displayName ?? 'Johnathan', data.scores.jordyn?.displayName ?? 'Jordyn', 'Total']);
  applyHeaderRow(playerHeader, headerFill(SAGE_LIGHT), { bold: true, size: 11, color: { argb: DARK_TEXT } }, 4);

  const johnDone = data.tasks.filter(t => t.completedBy === 'johnathan' && t.status === 'done').length
    + data.shopping.filter(s => s.purchasedBy === 'johnathan' && s.status === 'Purchased').length
    + data.goals.filter(g => g.completedBy === 'johnathan' && g.completed).length;
  const jordynDone = data.tasks.filter(t => t.completedBy === 'jordyn' && t.status === 'done').length
    + data.shopping.filter(s => s.purchasedBy === 'jordyn' && s.status === 'Purchased').length
    + data.goals.filter(g => g.completedBy === 'jordyn' && g.completed).length;

  addStatRow(ws, 'Points', `${johnPts}`);
  ws.getRow(ws.rowCount).getCell(3).value = jordynPts;
  ws.getRow(ws.rowCount).getCell(4).value = totalPoints;

  addStatRow(ws, 'Items Completed', johnDone, CREAM);
  ws.getRow(ws.rowCount).getCell(3).value = jordynDone;
  ws.getRow(ws.rowCount).getCell(4).value = johnDone + jordynDone;

  addStatRow(ws, 'Streak Days', data.scores.johnathan?.streakDays ?? 0);
  ws.getRow(ws.rowCount).getCell(3).value = data.scores.jordyn?.streakDays ?? 0;

  addStatRow(ws, 'Badges Earned', data.scores.johnathan?.badges?.length ?? 0, CREAM);
  ws.getRow(ws.rowCount).getCell(3).value = data.scores.jordyn?.badges?.length ?? 0;
  ws.addRow([]);

  // --- Task Stats ---
  addSectionTitle(ws, 'Tasks', 4, SAGE);
  const pendingTasks = data.tasks.filter(t => t.status === 'pending' && !t.isDaily).length;
  const claimedTasks = data.tasks.filter(t => t.status === 'claimed').length;
  const doneTasks = data.tasks.filter(t => t.status === 'done').length;
  const dailyTasks = data.tasks.filter(t => t.isDaily).length;

  addStatRow(ws, 'Total Tasks (excl. daily)', nonDailyTasks.length, CREAM);
  addStatRow(ws, 'Pending', pendingTasks);
  addStatRow(ws, 'Claimed / In Progress', claimedTasks, CREAM);
  addStatRow(ws, 'Done', doneTasks);
  addStatRow(ws, 'Daily Tasks', dailyTasks, CREAM);
  ws.addRow([]);

  // --- Category Progress ---
  addSectionTitle(ws, 'Category Progress', 4, SAGE);
  const catHeader = ws.addRow(['Category', 'Done', 'Total', 'Completion %']);
  applyHeaderRow(catHeader, headerFill(SAGE_LIGHT), { bold: true, size: 11, color: { argb: DARK_TEXT } }, 4);

  const categories = [...new Set(nonDailyTasks.map(t => t.category))].sort();
  categories.forEach((cat, i) => {
    const catTasks = nonDailyTasks.filter(t => t.category === cat);
    const catDone = catTasks.filter(t => t.status === 'done').length;
    const pct = catTasks.length ? Math.round((catDone / catTasks.length) * 100) : 0;
    const row = ws.addRow([cat, catDone, catTasks.length, `${pct}%`]);
    if (i % 2 === 0) {
      row.getCell(1).fill = headerFill(CREAM);
      row.getCell(2).fill = headerFill(CREAM);
      row.getCell(3).fill = headerFill(CREAM);
      row.getCell(4).fill = headerFill(CREAM);
    }
  });
  ws.addRow([]);

  // --- Shopping Stats ---
  addSectionTitle(ws, 'Shopping', 4, ROSE);
  const purchased = data.shopping.filter(s => s.status === 'Purchased').length;
  const needToPurchase = data.shopping.filter(s => s.status === 'Need to Purchase').length;
  const inStock = data.shopping.filter(s => s.status === 'In Stock').length;

  addStatRow(ws, 'Total Items', data.shopping.length, ROSE_LIGHT);
  addStatRow(ws, 'Purchased', purchased);
  addStatRow(ws, 'Need to Purchase', needToPurchase, ROSE_LIGHT);
  addStatRow(ws, 'In Stock', inStock);
  ws.addRow([]);

  // --- Goals Stats ---
  addSectionTitle(ws, 'Goals', 4, ROSE);
  const completedGoals = data.goals.filter(g => g.completed).length;
  addStatRow(ws, 'Total Goals', data.goals.length, ROSE_LIGHT);
  addStatRow(ws, 'Completed', completedGoals);
  addStatRow(ws, 'Pending', data.goals.length - completedGoals, ROSE_LIGHT);
}

function buildDataSheet(wb: ExcelJS.Workbook, data: ExportData) {
  const ws = wb.addWorksheet('Full Data');

  // --- Tasks ---
  const taskCols = ['ID', 'Category', 'Task', 'Priority', 'Timing', 'Status', 'Points', 'Claimed By', 'Completed By', 'Completed At', 'Assigned By', 'Daily?', 'Assigned Both?', 'Due Date', 'Notes'];
  addSectionTitle(ws, 'Tasks', taskCols.length, SAGE);
  const taskHeaderRow = ws.addRow(taskCols);
  applyHeaderRow(taskHeaderRow, headerFill(SAGE_LIGHT), { bold: true, size: 11, color: { argb: DARK_TEXT } }, taskCols.length);

  data.tasks.forEach(t => {
    ws.addRow([t.id, t.category, t.task, t.priority, t.timing, t.status, t.points, t.claimedBy ?? '', t.completedBy ?? '', t.completedAt ?? '', t.assignedBy ?? '', t.isDaily ? 'Yes' : 'No', t.assignedToBoth ? 'Yes' : 'No', t.dueDate ?? '', t.notes ?? '']);
  });
  ws.addRow([]);

  // --- Shopping ---
  const shopCols = ['ID', 'Name', 'Price', 'Stock', 'Status', 'Points', 'Purchased By', 'Purchased At', 'Notes'];
  addSectionTitle(ws, 'Shopping Items', shopCols.length, ROSE);
  const shopHeaderRow = ws.addRow(shopCols);
  applyHeaderRow(shopHeaderRow, headerFill(ROSE_LIGHT), { bold: true, size: 11, color: { argb: DARK_TEXT } }, shopCols.length);

  data.shopping.forEach(s => {
    ws.addRow([s.id, s.name, s.price ?? '', s.stock ?? '', s.status, s.points, s.purchasedBy ?? '', s.purchasedAt ?? '', s.notes ?? '']);
  });
  ws.addRow([]);

  // --- Goals ---
  const goalCols = ['ID', 'Name', 'Start Date', 'End Date', 'Completed?', 'Completed By', 'Completed At', 'Points', 'Claimed By', 'Assigned By', 'Assigned Both?', 'Notes'];
  addSectionTitle(ws, 'Goals', goalCols.length, SAGE);
  const goalHeaderRow = ws.addRow(goalCols);
  applyHeaderRow(goalHeaderRow, headerFill(SAGE_LIGHT), { bold: true, size: 11, color: { argb: DARK_TEXT } }, goalCols.length);

  data.goals.forEach(g => {
    ws.addRow([g.id, g.name, g.startDate ?? '', g.endDate ?? '', g.completed ? 'Yes' : 'No', g.completedBy ?? '', g.completedAt ?? '', g.points, g.claimedBy ?? '', g.assignedBy ?? '', g.assignedToBoth ? 'Yes' : 'No', g.notes ?? '']);
  });

  // Auto-fit columns by setting reasonable widths
  ws.columns?.forEach(col => {
    col.width = 18;
  });
  if (ws.columns?.[0]) ws.columns[0].width = 10;  // ID
  if (ws.columns?.[2]) ws.columns[2].width = 40;   // Task name / Name
}

export async function exportToExcel(data: ExportData) {
  const wb = new ExcelJS.Workbook();
  wb.creator = `${data.settings.babyName} Tracker`;
  wb.created = new Date();

  buildSummarySheet(wb, data);
  buildDataSheet(wb, data);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const dateStr = new Date().toISOString().slice(0, 10);
  saveAs(blob, `${data.settings.babyName}-tracker-export-${dateStr}.xlsx`);
}
