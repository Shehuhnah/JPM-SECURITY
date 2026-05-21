import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { getAttendanceMinutesBreakdown } from './attendanceHours.js';

const buildCoverageDays = (startDate, endDate) => {
  if (!startDate || !endDate) return [];

  const dates = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

const splitCoverageDays = (coverageDays = []) => {
  if (coverageDays.length === 0) {
    return { topDays: [], bottomDays: [] };
  }

  const sameMonth = coverageDays.every(
    (date) =>
      date.getFullYear() === coverageDays[0].getFullYear() &&
      date.getMonth() === coverageDays[0].getMonth()
  );

  if (sameMonth) {
    const topDays = coverageDays.filter((date) => date.getDate() <= 15);
    const bottomDays = coverageDays.filter((date) => date.getDate() > 15);
    return { topDays, bottomDays };
  }

  return {
    topDays: coverageDays.slice(0, 15),
    bottomDays: coverageDays.slice(15),
  };
};

const toDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * Generate a grid-based timesheet PDF.
 * @param {Object} guard - The guard object, containing fullName and dutyStation.
 * @param {Array} attendanceRecords - An array of attendance records for the period.
 * @param {string} periodCover - A string describing the pay period (e.g., "November 1-15, 2025").
 * @returns {Promise<Buffer>} - A promise that resolves with the PDF buffer.
 */
export const generateWorkHoursPDF = (guard, attendanceRecords, periodCover, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const detachment = attendanceRecords[0]?.scheduleId?.client || 'N/A';
      const coverageDays = buildCoverageDays(options.startDate, options.endDate);
      const effectiveCoverageDays =
        coverageDays.length > 0
          ? coverageDays
          : Array.from({ length: 31 }, (_, index) => new Date(2026, 0, index + 1));
      const { topDays, bottomDays } = splitCoverageDays(effectiveCoverageDays);
      const headerColumnCount = Math.max(topDays.length, bottomDays.length, 1);
      const hasBottomHalf = bottomDays.length > 0;

      // Map day => hours
      const dayShiftHoursMap = new Map();
      const nightShiftHoursMap = new Map();
      let totalMinutes = 0;
      const workedDates = new Set();
      attendanceRecords.forEach(record => {
        const recordDate = new Date(record.timeIn);
        const dateKey = toDateKey(recordDate);
        const workMinutes = getAttendanceMinutesBreakdown(record).totalMinutes;
        if (workMinutes <= 0) return;

        const hours = workMinutes / 60;
        totalMinutes += workMinutes;
        workedDates.add(dateKey);

        if (record.scheduleId?.shiftType === 'Night Shift') {
          nightShiftHoursMap.set(dateKey, (nightShiftHoursMap.get(dateKey) || 0) + hours);
        } else {
          dayShiftHoursMap.set(dateKey, (dayShiftHoursMap.get(dateKey) || 0) + hours);
        }
      });

      const totalHours = (totalMinutes / 60).toFixed(1);
      const workDays = workedDates.size;

      // --- TABLE CONSTANTS ---
      const tableX = 40;
      const tableY = 90;
      const headerRowHeight = 20;
      const rowHeight = 25;
      const nameColWidth = 120;
      const ampmColWidth = 30;
      const totalColWidth = 70;
      const sigColWidth = 100;
      const dateAreaWidth = 842 - 60 - nameColWidth - ampmColWidth - totalColWidth - sigColWidth;
      const dateCellWidth = Math.floor(dateAreaWidth / headerColumnCount);
      const dataBlockHeight = hasBottomHalf ? rowHeight * 4 : rowHeight * 2;

      // --- HEADER ---
      doc.font('Helvetica-Bold').fontSize(11).text('Period Cover: ', 40, 40, { continued: true })
         .font('Helvetica').text(periodCover, { underline: true });
      doc.font('Helvetica-Bold').text('Detachment: ', 40, 60, { continued: true })
         .font('Helvetica').text(detachment, { underline: true });

      // --- DRAW TABLE HEADERS ---
      doc.font('Helvetica-Bold').fontSize(8);

      const nameX = tableX;
      doc.rect(nameX, tableY, nameColWidth, headerRowHeight * 2).stroke();
      doc.text('Name of Guard', nameX, tableY + 15, { width: nameColWidth, align: 'center' });

      const ampmX = nameX + nameColWidth;
      doc.rect(ampmX, tableY, ampmColWidth, headerRowHeight * 2).stroke();

      for (let index = 0; index < headerColumnCount; index++) {
        const x = ampmX + ampmColWidth + (dateCellWidth * index);
        doc.rect(x, tableY, dateCellWidth, headerRowHeight).stroke();
        doc.rect(x, tableY + headerRowHeight, dateCellWidth, headerRowHeight).stroke();

        if (topDays[index]) {
          doc.text(topDays[index].getDate(), x, tableY + 5, { width: dateCellWidth, align: 'center' });
        }

        if (bottomDays[index]) {
          doc.text(bottomDays[index].getDate(), x, tableY + headerRowHeight + 5, { width: dateCellWidth, align: 'center' });
        }
      }

      // Total and Signature columns
      const totalX = ampmX + ampmColWidth + (dateCellWidth * headerColumnCount);
      const sigX = totalX + totalColWidth;
      doc.rect(totalX, tableY, totalColWidth, headerRowHeight * 2).stroke();
      doc.text('TOTAL NO.', totalX, tableY + 15, { width: totalColWidth, align: 'center' });
      doc.rect(sigX, tableY, sigColWidth, headerRowHeight * 2).stroke();
      doc.text('Signature', sigX, tableY + 15, { width: sigColWidth, align: 'center' });

      // --- DATA ROW ---
      doc.font('Helvetica').fontSize(8);
      const row1Y = tableY + headerRowHeight * 2;
      const row2Y = row1Y + rowHeight;
      const row3Y = row2Y + rowHeight;
      const row4Y = row3Y + rowHeight;

      doc.rect(nameX, row1Y, nameColWidth, dataBlockHeight).stroke();
      doc.text(guard.fullName, nameX + 3, row1Y + (dataBlockHeight / 2) - 5, { width: nameColWidth - 6 });

      const drawShiftLabelPair = (startY) => {
        doc.rect(ampmX, startY, ampmColWidth, rowHeight).stroke();
        doc.text('AM', ampmX, startY + 9, { width: ampmColWidth, align: 'center' });
        doc.rect(ampmX, startY + rowHeight, ampmColWidth, rowHeight).stroke();
        doc.text('PM', ampmX, startY + rowHeight + 9, { width: ampmColWidth, align: 'center' });
      };

      drawShiftLabelPair(row1Y);
      if (hasBottomHalf) {
        drawShiftLabelPair(row3Y);
      }

      const drawDaySection = (days, startY) => {
        for (let index = 0; index < headerColumnCount; index++) {
          const x = ampmX + ampmColWidth + (dateCellWidth * index);
          const date = days[index];
          const dateKey = date ? toDateKey(date) : null;
          doc.rect(x, startY, dateCellWidth, rowHeight).stroke();
          doc.rect(x, startY + rowHeight, dateCellWidth, rowHeight).stroke();
          if (dateKey) {
            doc.text(dayShiftHoursMap.get(dateKey)?.toFixed(1) || '', x, startY + 9, { width: dateCellWidth, align: 'center' });
            doc.text(nightShiftHoursMap.get(dateKey)?.toFixed(1) || '', x, startY + rowHeight + 9, { width: dateCellWidth, align: 'center' });
          }
        }
      };

      drawDaySection(topDays, row1Y);
      if (hasBottomHalf) {
        drawDaySection(bottomDays, row3Y);
      }

      // Total row
      doc.rect(totalX, row1Y, totalColWidth, dataBlockHeight).stroke();
      doc.rect(totalX, row1Y, totalColWidth, dataBlockHeight / 2).stroke();
      doc.text('Days', totalX + 3, row1Y + (dataBlockHeight / 4) - 3);
      doc.text('Hours', totalX + 3, row1Y + (dataBlockHeight * 0.75) - 3);
      doc.font('Helvetica-Bold');
      doc.text(workDays.toString(), totalX + 35, row1Y + (dataBlockHeight / 4) - 3, { width: 30, align: 'right' });
      doc.text(totalHours, totalX + 35, row1Y + (dataBlockHeight * 0.75) - 3, { width: 30, align: 'right' });

      // Signature row
      doc.rect(sigX, row1Y, sigColWidth, dataBlockHeight).stroke();

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate a single-table, multi-page timesheet PDF for all guards of a specific client.
 * This version creates a professional, mostly blank template for manual entry.
 * @param {string} clientName - The name of the client/detachment.
 * @param {Map<Object, Array>} groupedAttendance - A map where keys are guard objects and values are their attendance records.
 * @param {string} periodCover - A string describing the pay period (e.g., "November 1-15, 2025").
 * @returns {Promise<Buffer>} - A promise that resolves with the PDF buffer.
 */


export const generateWorkHoursByClientPDF = (clientName, groupedAttendance, periodCover, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margins: { top: 30, bottom: 30, left: 30, right: 30 },
      });

      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const coverageDays = buildCoverageDays(options.startDate, options.endDate);
      const effectiveCoverageDays =
        coverageDays.length > 0
          ? coverageDays
          : Array.from({ length: 16 }, (_, index) => new Date(2026, 0, index + 1));
      const { topDays, bottomDays } = splitCoverageDays(effectiveCoverageDays);
      const headerColumnCount = Math.max(topDays.length, bottomDays.length, 1);
      const hasBottomHalf = bottomDays.length > 0;

      // --- 2. LAYOUT CONFIGURATION ---
      const pageW = doc.page.width;
      const pageH = doc.page.height;
      const margin = 30;
      const noColW = 30;
      const nameColW = 120;
      const ampmColW = 30;
      const daysColW = 40;
      const hoursColW = 55;
      const sigColW = 70;
      const contentW = pageW - margin * 2;
      const dateAreaW = contentW - (noColW + nameColW + ampmColW + daysColW + hoursColW + sigColW);
      const dateCellW = Math.floor(dateAreaW / headerColumnCount);
      const headerRowHeight = 18;
      const rowHeight = 18;
      const guardRowHeight = hasBottomHalf ? rowHeight * 4 : rowHeight * 2;
      const signatureBlockHeight = 90;
      const pmShadeColor = '#E8E8E8';

      let currentY = margin;

      const drawPageHeader = (isFirstPage) => {
        currentY = margin;
        if (isFirstPage) {
          const headerPath = path.join(process.cwd(), "backend", "assets", "headerpdf", "header.png");
          if (fs.existsSync(headerPath)) {
            const imageWidth = 450;
            doc.image(headerPath, (pageW - imageWidth) / 2, margin - 15, { width: imageWidth });
          }
          currentY += 60;
        } else {
          currentY += 75;
        }
        doc.font("Helvetica-Bold").fontSize(10);
        doc.text("Period Covered:", margin, currentY, { continued: true });
        doc.font("Helvetica-Bold").text(` ${periodCover}`, { underline: true });
        doc.font("Helvetica-Bold").text("Detachment:", margin, currentY + 12, { continued: true });
        doc.font("Helvetica-Bold").text(` ${clientName}`, { underline: true });
        currentY += 35;
      };

      // --- DRAW HEADERS (EXACT LEGACY FORMAT) ---
      const drawTableHeaders = () => {
        doc.font("Helvetica-Bold").fontSize(8);
        const headerY1 = currentY;
        const headerY2 = headerY1 + headerRowHeight;
        let currentX = margin;

        // Static Columns
        doc.rect(currentX, headerY1, noColW, headerRowHeight * 2).stroke();
        doc.text("No.", currentX, headerY1 + 10, { width: noColW, align: "center" });
        currentX += noColW;

        doc.rect(currentX, headerY1, nameColW, headerRowHeight * 2).stroke();
        doc.text("Name of Guard", currentX, headerY1 + 10, { width: nameColW, align: "center" });
        currentX += nameColW;

        doc.rect(currentX, headerY1, ampmColW, headerRowHeight * 2).stroke();
        currentX += ampmColW;

        const dateHeaderStartX = currentX;
        for (let index = 0; index < headerColumnCount; index++) {
          doc.rect(currentX, headerY1, dateCellW, headerRowHeight).stroke();
          doc.rect(currentX, headerY2, dateCellW, headerRowHeight).stroke();
          if (topDays[index]) {
            doc.text(String(topDays[index].getDate()), currentX, headerY1 + 6, { width: dateCellW, align: "center" });
          }
          if (bottomDays[index]) {
            doc.text(String(bottomDays[index].getDate()), currentX, headerY2 + 6, { width: dateCellW, align: "center" });
          }
          currentX += dateCellW;
        }

        currentX = dateHeaderStartX + dateCellW * headerColumnCount;
        doc.rect(currentX, headerY1, daysColW, headerRowHeight * 2).stroke();
        doc.text("Days", currentX, headerY1 + 10, { width: daysColW, align: "center" });
        currentX += daysColW;
        doc.rect(currentX, headerY1, hoursColW, headerRowHeight * 2).stroke();
        doc.text("Total No. Hours", currentX, headerY1 + 10, { width: hoursColW, align: "center" });
        currentX += hoursColW;
        doc.rect(currentX, headerY1, sigColW, headerRowHeight * 2).stroke();
        doc.text("Signature", currentX, headerY1 + 10, { width: sigColW, align: "center" });
        currentY += headerRowHeight * 2;
      };

      drawPageHeader(true);
      drawTableHeaders();

      const guards = Array.from(groupedAttendance.keys());

      for (let i = 0; i < guards.length; i++) {
        const guard = guards[i];
        const records = groupedAttendance.get(guard) || [];

        if (currentY + guardRowHeight > pageH - margin) {
          doc.addPage();
          drawPageHeader(false);
          drawTableHeaders();
        }

        const dayShiftHoursMap = new Map();
        const nightShiftHoursMap = new Map();
        let totalMinutes = 0;
        const workDays = new Set();

        records.forEach(rec => {
          if (rec.timeIn && rec.scheduleId) {
            const t1 = new Date(rec.timeIn);
            const breakdown = getAttendanceMinutesBreakdown(rec);
            const hours = breakdown.totalMinutes / 60;
            totalMinutes += breakdown.totalMinutes;

            const dateKey = toDateKey(t1);
            workDays.add(dateKey);

            if (rec.scheduleId.shiftType === 'Night Shift') {
                nightShiftHoursMap.set(dateKey, (nightShiftHoursMap.get(dateKey) || 0) + hours);
            } else {
                dayShiftHoursMap.set(dateKey, (dayShiftHoursMap.get(dateKey) || 0) + hours);
            }
          }
        });
        
        const totalHours = (totalMinutes / 60).toFixed(2);
        const totalDays = workDays.size;

        const rowY = currentY;
        let currentX = margin;
        
        // 1. No.
        doc.rect(currentX, rowY, noColW, guardRowHeight).stroke();
        doc.font("Helvetica").fontSize(9).text(String(i + 1), currentX, rowY + 12, { width: noColW, align: "center" });
        currentX += noColW;

        // 2. Name
        doc.rect(currentX, rowY, nameColW, guardRowHeight).stroke();
        doc.text(guard.fullName || "", currentX + 3, rowY + 12, { width: nameColW - 6, ellipsis: true });
        currentX += nameColW;

        // 3. AM/PM
        const drawShiftLabels = (startY) => {
          doc.rect(currentX, startY, ampmColW, rowHeight).stroke();
          doc.text("AM", currentX, startY + 6, { width: ampmColW, align: "center" });
          doc.rect(currentX, startY + rowHeight, ampmColW, rowHeight).fillAndStroke(pmShadeColor, 'black');
          doc.fillColor('black');
          doc.text("PM", currentX, startY + rowHeight + 6, { width: ampmColW, align: "center" });
        };

        drawShiftLabels(rowY);
        if (hasBottomHalf) {
          drawShiftLabels(rowY + rowHeight * 2);
        }
        currentX += ampmColW;

        const dateCellStartX = currentX;
        const drawDaySection = (days, startY) => {
          let sectionX = dateCellStartX;
          for (let index = 0; index < headerColumnCount; index++) {
            const date = days[index];
            const dateKey = date ? toDateKey(date) : null;
            doc.fillColor('black');
            doc.rect(sectionX, startY, dateCellW, rowHeight).stroke();
            if (dateKey) {
              const dayShiftHours = dayShiftHoursMap.get(dateKey);
              if (dayShiftHours) {
                doc.text(dayShiftHours.toFixed(1), sectionX, startY + 6, { width: dateCellW, align: 'center' });
              }
            }

            doc.rect(sectionX, startY + rowHeight, dateCellW, rowHeight).fillAndStroke(pmShadeColor, 'black');
            doc.fillColor('black');
            if (dateKey) {
              const nightShiftHours = nightShiftHoursMap.get(dateKey);
              if (nightShiftHours) {
                doc.text(nightShiftHours.toFixed(1), sectionX, startY + rowHeight + 6, { width: dateCellW, align: 'center' });
              }
            }
            sectionX += dateCellW;
          }
        };

        drawDaySection(topDays, rowY);
        if (hasBottomHalf) {
          drawDaySection(bottomDays, rowY + rowHeight * 2);
        }

        // Totals & Sig
        currentX = dateCellStartX + dateCellW * headerColumnCount;
        doc.rect(currentX, rowY, daysColW, guardRowHeight).stroke();
        doc.text(totalDays.toString(), currentX, rowY + (guardRowHeight / 2) - 6, { width: daysColW, align: "center" });
        currentX += daysColW;
        doc.rect(currentX, rowY, hoursColW, guardRowHeight).stroke();
        doc.text(totalHours, currentX, rowY + (guardRowHeight / 2) - 6, { width: hoursColW, align: 'center' });
        currentX += hoursColW;
        doc.rect(currentX, rowY, sigColW, guardRowHeight).stroke();
        currentY += guardRowHeight;
      }

      // Footer
      if (currentY + signatureBlockHeight > pageH - margin) {
        doc.addPage();
        currentY = margin + 20;
      }
      currentY = pageH - margin - signatureBlockHeight;
      doc.font("Helvetica-Bold").fontSize(9);
      const signatureY = pageH - margin - 80;
      const labelY = signatureY - 12;
      const lineY = signatureY + 2;
      const colWidth = contentW / 3;
      const col1X = margin;
      const col2X = margin + colWidth;
      const col3X = margin + colWidth * 2;
      const lineLength = colWidth - 80;

      doc.text("Prepared By:", col1X, labelY);
      doc.moveTo(col1X + 80, lineY).lineTo(col1X + lineLength, lineY).stroke();
      doc.text("Approved By (Client):", col2X, labelY);
      doc.moveTo(col2X + 110, lineY).lineTo(col2X + lineLength + 30, lineY).stroke();
      doc.text("Certified By (Agency):", col3X, labelY);
      doc.moveTo(col3X + 110, lineY).lineTo(col3X + lineLength + 30, lineY).stroke();
      const receivedY = pageH - margin - 65;
      doc.font("Helvetica-Bold").text("Received By", margin, receivedY );
      doc.font("Helvetica-Bold").text("Signature:", margin, receivedY + 15);
      doc.font("Helvetica").text("Name: ____________________", margin, receivedY + 30);
      doc.text("Date: ____________________", margin, receivedY + 45);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate an A4 Landscape Daily Time Record (DTR) PDF for an admin/staff member.
 * Features two side-by-side tables split by date range halves.
 * Columns: Day | Time In | Time Out | Undertime | Hours
 *
 * @param {Object} staff - The staff user object { name, position, role }
 * @param {Array}  attendanceRecords - Array of AdminAttendance records for the period
 * @param {string} periodCover - Human-readable period string e.g. "May 1-15, 2026"
 * @param {Object} options - { startDate: Date, endDate: Date }
 * @returns {Promise<Buffer>}
 */
export const generateStaffAttendancePDF = (staff, attendanceRecords, periodCover, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 28, bottom: 28, left: 28, right: 28 },
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // ─── Page dimensions ───────────────────────────────────────────────
      const pageW  = doc.page.width;   // 841.89
      const pageH  = doc.page.height;  // 595.28
      const margin = 28;
      const contentW = pageW - margin * 2; // ~785.89

      // ─── Build coverage days & split into two halves ───────────────────
      const coverageDays = buildCoverageDays(options.startDate, options.endDate);
      const effectiveDays =
        coverageDays.length > 0
          ? coverageDays
          : Array.from({ length: 15 }, (_, i) => {
              const d = new Date(); d.setDate(i + 1); return d;
            });

      // Determine split: same month → day≤15 vs day>15, else split in half
      const sameMonth =
        effectiveDays.length > 0 &&
        effectiveDays.every(
          d =>
            d.getFullYear() === effectiveDays[0].getFullYear() &&
            d.getMonth()    === effectiveDays[0].getMonth()
        );

      let leftDays, rightDays;
      if (sameMonth) {
        leftDays  = effectiveDays.filter(d => d.getDate() <= 15);
        rightDays = effectiveDays.filter(d => d.getDate() >  15);
      } else {
        const half = Math.ceil(effectiveDays.length / 2);
        leftDays  = effectiveDays.slice(0, half);
        rightDays = effectiveDays.slice(half);
      }

      // Maximum rows per side (at least 15 to keep the table tall)
      const tableRows = Math.max(leftDays.length, rightDays.length, 15);

      // ─── Build a map: dateKey → record ─────────────────────────────────
      const recordMap = new Map();
      attendanceRecords.forEach(rec => {
        const key = rec.dateKey ||
          (rec.timeIn ? toDateKey(new Date(rec.timeIn)) : null);
        if (key) recordMap.set(key, rec);
      });

      const fmt12h = (dateVal) => {
        if (!dateVal) return '';
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return '';
        let h = d.getHours();
        const m = String(d.getMinutes()).padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
      };

      const calcHours = (rec) => {
        if (!rec || !rec.timeIn) return null;
        if (!rec.timeOut) return null; // still on duty, don't show
        const accMin = Number.isFinite(rec.accumulatedWorkedMinutes)
          ? Math.max(0, rec.accumulatedWorkedMinutes)
          : 0;
        const segMs  = Math.max(0, new Date(rec.timeOut) - new Date(rec.timeIn));
        const totalMin = Math.min(accMin + Math.round(segMs / 60000), 24 * 60);
        return totalMin / 60; // fractional hours
      };

      const calcUndertime = (hoursWorked) => {
        if (hoursWorked === null) return null;
        return Math.max(0, 8 - hoursWorked);
      };

      const fmtHours = (h) => {
        if (h === null) return '';
        const hrs  = Math.floor(h);
        const mins = Math.round((h - hrs) * 60);
        return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
      };

      // ─── Layout constants ───────────────────────────────────────────────
      const headerH   = 16;  // column header row height
      const dataRowH  = 14;  // each data row height
      const tableH    = headerH + tableRows * dataRowH;

      // Each table has 5 columns. We want two tables side-by-side with a gap.
      const gapW      = 20;
      const tableW    = (contentW - gapW) / 2;  // ≈ 382.94

      // Column widths within one table (must sum to tableW)
      const colDay        = 28;
      const colTimeIn     = Math.floor((tableW - colDay) * 0.26);
      const colTimeOut    = Math.floor((tableW - colDay) * 0.26);
      const colUndertime  = Math.floor((tableW - colDay) * 0.24);
      const colHours      = tableW - colDay - colTimeIn - colTimeOut - colUndertime;

      // ─── Positioning ────────────────────────────────────────────────────
      let currentY = margin;

      // ── Corporate header image ──────────────────────────────────────────
      const headerImgPath = path.join(process.cwd(), 'backend', 'assets', 'headerpdf', 'header.png');
      if (fs.existsSync(headerImgPath)) {
        const imgW = 420;
        doc.image(headerImgPath, (pageW - imgW) / 2, currentY - 10, { width: imgW });
        currentY += 66; // Increased space between header logo and content
      } else {
        // Fallback text header
        doc.font('Helvetica-Bold').fontSize(13)
           .text('JPM SECURITY AGENCY', margin, currentY, { align: 'center', width: contentW });
        currentY += 18;
      }

      // ── Period / staff info row ─────────────────────────────────────────
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text('Period Covered:', margin, currentY, { continued: true });
      doc.font('Helvetica').text(`  ${periodCover}`, { underline: true });
      currentY += 13;
      doc.font('Helvetica-Bold').text('Employee:', margin, currentY, { continued: true });
      doc.font('Helvetica').text(`  ${staff.name || 'N/A'}`, { underline: true, continued: true });
      doc.font('Helvetica-Bold').text('   Position:', { continued: true });
      doc.font('Helvetica').text(`  ${staff.position || staff.role || 'Staff'}`, { underline: true });
      currentY += 14;

      // ─── Helper to draw one table ────────────────────────────────────────
      const drawTable = (originX, days) => {
        const cols = [
          { label: 'Day',       w: colDay,       align: 'center' },
          { label: 'Time In',   w: colTimeIn,    align: 'center' },
          { label: 'Time Out',  w: colTimeOut,   align: 'center' },
          { label: 'Undertime', w: colUndertime, align: 'center' },
          { label: 'Hours',     w: colHours,     align: 'center' },
        ];

        // Header row background
        doc.save();
        doc.rect(originX, currentY, tableW, headerH).fill('#1E3A5F');
        doc.restore();

        // Header text
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('white');
        let cx = originX;
        cols.forEach(col => {
          doc.text(col.label, cx + 2, currentY + 4, {
            width: col.w - 4,
            align: col.align,
          });
          cx += col.w;
        });

        doc.fillColor('black');

        // Data rows
        for (let rowIdx = 0; rowIdx < tableRows; rowIdx++) {
          const rowY = currentY + headerH + rowIdx * dataRowH;
          const date = days[rowIdx] || null;
          const dateKey = date ? toDateKey(date) : null;
          const rec  = dateKey ? recordMap.get(dateKey) : null;

          // Alternating row shade
          if (rowIdx % 2 === 1) {
            doc.save();
            doc.rect(originX, rowY, tableW, dataRowH).fill('#F5F7FA');
            doc.restore();
          }

          // Row border
          doc.rect(originX, rowY, tableW, dataRowH).stroke('#CCCCCC');

          const workedH = rec ? calcHours(rec) : null;

          let undertimeLabel = '';
          if (workedH !== null) {
            undertimeLabel = workedH < 7 ? 'Yes' : 'No';
          }

          const cellValues = [
            date ? String(date.getDate()) : '',
            rec  ? fmt12h(rec.firstTimeIn || rec.timeIn) : '',
            rec  ? fmt12h(rec.timeOut) : '',
            undertimeLabel,
            workedH !== null ? fmtHours(workedH) : '',
          ];

          doc.font('Helvetica').fontSize(7).fillColor('#1a1a1a');
          cx = originX;
          cols.forEach((col, ci) => {
            // Vertical separator line
            if (ci > 0) {
              doc.moveTo(cx, rowY).lineTo(cx, rowY + dataRowH).stroke('#CCCCCC');
            }
            doc.text(cellValues[ci], cx + 2, rowY + 3, {
              width: col.w - 4,
              align: col.align,
            });
            cx += col.w;
          });
        }

        // ─── Draw Total Hours Accumulated Row ────────────────────────────────
        const totalRowY = currentY + headerH + tableRows * dataRowH;
        doc.save();
        doc.rect(originX, totalRowY, tableW, dataRowH).fill('#F1F5F9');
        doc.restore();

        doc.rect(originX, totalRowY, tableW, dataRowH).stroke('#CCCCCC');

        // Let's calculate the sum of hours for this table's days
        let tableTotalH = 0;
        days.forEach(date => {
          const dateKey = toDateKey(date);
          const rec = recordMap.get(dateKey);
          const workedH = rec ? calcHours(rec) : null;
          if (workedH !== null) {
            tableTotalH += workedH;
          }
        });

        doc.font('Helvetica-Bold').fontSize(7).fillColor('#1e293b');
        // Merge first 4 columns for "Total Hours Accumulated" label
        const labelW = tableW - colHours;
        doc.text('Total Hours Accumulated:', originX + 2, totalRowY + 3.5, {
          width: labelW - 6,
          align: 'right'
        });

        // Vertical line to separate the label and the total value
        doc.moveTo(originX + labelW, totalRowY)
           .lineTo(originX + labelW, totalRowY + dataRowH)
           .stroke('#CCCCCC');

        // Total hours value
        const totalValStr = fmtHours(tableTotalH);
        doc.text(totalValStr, originX + labelW + 2, totalRowY + 3.5, {
          width: colHours - 4,
          align: 'center'
        });

        // Outer border (including the new total row)
        const totalTableH = headerH + (tableRows + 1) * dataRowH;
        doc.rect(originX, currentY, tableW, totalTableH).stroke('#333333');

        // Vertical separators through header and data rows (but stopping before the total row)
        cx = originX;
        cols.forEach((col, ci) => {
          if (ci > 0) {
            doc.moveTo(cx, currentY)
               .lineTo(cx, currentY + headerH + tableRows * dataRowH)
               .stroke('#333333');
          }
          cx += col.w;
        });
      };

      // ─── Draw both tables ────────────────────────────────────────────────
      const leftX  = margin;
      const rightX = margin + tableW + gapW;

      drawTable(leftX,  leftDays);
      drawTable(rightX, rightDays);

      // ─── Footer – signature block ────────────────────────────────────────
      const sigBlockH    = 70;
      const signatureY   = pageH - margin - sigBlockH - 30; // Move up by 30 points to reduce empty space and prevent page break
      const labelY       = signatureY;
      const lineY        = signatureY + 14;
      const colW         = contentW / 3;
      const col1X        = margin;
      const col2X        = margin + colW;
      const col3X        = margin + colW * 2;
      const lineLen      = colW - 80;

      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('black');
      doc.text('Prepared By:', col1X, labelY);
      doc.moveTo(col1X + 72, lineY).lineTo(col1X + lineLen + 30, lineY).stroke('black');

      doc.text('Approved By (Client):', col2X, labelY);
      doc.moveTo(col2X + 108, lineY).lineTo(col2X + lineLen + 50, lineY).stroke('black');

      doc.text('Certified By (Agency):', col3X, labelY);
      doc.moveTo(col3X + 110, lineY).lineTo(col3X + lineLen + 50, lineY).stroke('black');

      // Received-by block
      const receivedY = signatureY + 28;
      doc.font('Helvetica-Bold').fontSize(8).text('Received By', col1X, receivedY);
      doc.font('Helvetica').text('Signature: _________________________', col1X, receivedY + 12);
      doc.text('Name:  _________________________', col1X, receivedY + 24);
      doc.text('Date:    _________________________', col1X, receivedY + 36);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
