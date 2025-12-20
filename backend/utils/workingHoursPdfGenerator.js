import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

/**
 * Generate a grid-based timesheet PDF.
 * @param {Object} guard - The guard object, containing fullName and dutyStation.
 * @param {Array} attendanceRecords - An array of attendance records for the period.
 * @param {string} periodCover - A string describing the pay period (e.g., "November 1-15, 2025").
 * @returns {Promise<Buffer>} - A promise that resolves with the PDF buffer.
 */
export const generateWorkHoursPDF = (guard, attendanceRecords, periodCover) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const detachment = attendanceRecords[0]?.scheduleId?.client || 'N/A';

      // Helper to get work hours in minutes
      const getWorkMinutes = (record) => {
        if (!record.timeIn || !record.timeOut) return 0;
        const start = new Date(record.timeIn);
        const end = new Date(record.timeOut);
        if (end < start) end.setDate(end.getDate() + 1); // overnight shift
        return (end - start) / (1000 * 60);
      };

      // Map day => hours
      const attendanceMap = new Map();
      let totalMinutes = 0;
      attendanceRecords.forEach(record => {
        const day = new Date(record.timeIn).getDate();
        const workMinutes = getWorkMinutes(record);
        if (workMinutes > 0) {
          totalMinutes += workMinutes;
          attendanceMap.set(day, (workMinutes / 60).toFixed(1)); // hours
        }
      });

      const totalHours = (totalMinutes / 60).toFixed(1);
      const workDays = attendanceMap.size;

      // --- TABLE CONSTANTS ---
      const tableX = 40;
      const tableY = 90;
      const headerHeight = 40;
      const rowHeight = 25;
      const nameColWidth = 120;
      const dateCellWidth = 24;
      const totalColWidth = 70;
      const sigColWidth = 100;

      // --- HEADER ---
      doc.font('Helvetica-Bold').fontSize(11).text('Period Cover: ', 40, 40, { continued: true })
         .font('Helvetica').text(periodCover, { underline: true });
      doc.font('Helvetica-Bold').text('Detachment: ', 40, 60, { continued: true })
         .font('Helvetica').text(detachment, { underline: true });

      // --- DRAW TABLE HEADERS ---
      doc.font('Helvetica-Bold').fontSize(8);

      // Name Header
      doc.rect(tableX, tableY, nameColWidth, headerHeight * 2).stroke();
      doc.text('Name of Guard', tableX, tableY + 15, { width: nameColWidth, align: 'center' });

      // Days 1-15 header (row 1)
      for (let i = 1; i <= 15; i++) {
        const x = tableX + nameColWidth + (dateCellWidth * (i - 1));
        doc.rect(x, tableY, dateCellWidth, headerHeight).stroke();
        doc.text(i, x, tableY + 15, { width: dateCellWidth, align: 'center' });
      }

      // Days 16-31 header (row 2)
      for (let i = 16; i <= 31; i++) {
        const x = tableX + nameColWidth + (dateCellWidth * (i - 16));
        doc.rect(x, tableY + headerHeight, dateCellWidth, headerHeight).stroke();
        doc.text(i, x, tableY + headerHeight + 15, { width: dateCellWidth, align: 'center' });
      }

      // Total and Signature columns
      const totalX = tableX + nameColWidth + (dateCellWidth * 15);
      const sigX = totalX + totalColWidth;
      doc.rect(totalX, tableY, totalColWidth, headerHeight * 2).stroke();
      doc.text('TOTAL NO.', totalX, tableY + 15, { width: totalColWidth, align: 'center' });
      doc.rect(sigX, tableY, sigColWidth, headerHeight * 2).stroke();
      doc.text('Signature', sigX, tableY + 15, { width: sigColWidth, align: 'center' });

      // --- DATA ROW ---
      doc.font('Helvetica').fontSize(8);
      const row1Y = tableY + headerHeight * 2;
      const row2Y = row1Y + rowHeight;

      // Name row
      doc.rect(tableX, row1Y, nameColWidth, rowHeight * 2).stroke();
      doc.text(guard.fullName, tableX + 3, row1Y + (rowHeight - 5), { width: nameColWidth - 6 });

      // Days 1-15
      for (let i = 1; i <= 15; i++) {
        const x = tableX + nameColWidth + (dateCellWidth * (i - 1));
        doc.rect(x, row1Y, dateCellWidth, rowHeight).stroke();
        doc.text(attendanceMap.get(i) || '', x, row1Y + 9, { width: dateCellWidth, align: 'center' });
      }

      // Days 16-31
      for (let i = 16; i <= 31; i++) {
        const x = tableX + nameColWidth + (dateCellWidth * (i - 16));
        doc.rect(x, row2Y, dateCellWidth, rowHeight).stroke();
        doc.text(attendanceMap.get(i) || '', x, row2Y + 9, { width: dateCellWidth, align: 'center' });
      }

      // Total row
      doc.rect(totalX, row1Y, totalColWidth, rowHeight * 2).stroke();
      doc.rect(totalX, row1Y, totalColWidth, rowHeight).stroke(); // split
      doc.text('Days', totalX + 3, row1Y + 9);
      doc.text('Hours', totalX + 3, row2Y + 9);
      doc.font('Helvetica-Bold');
      doc.text(workDays.toString(), totalX + 35, row1Y + 9, { width: 30, align: 'right' });
      doc.text(totalHours, totalX + 35, row2Y + 9, { width: 30, align: 'right' });

      // Signature row
      doc.rect(sigX, row1Y, sigColWidth, rowHeight * 2).stroke();

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


export const generateWorkHoursByClientPDF = (clientName, groupedAttendance, periodCover) => {
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

      // --- 1. PARSE PERIOD FOR DATA MAPPING ---
      // We need to know if we are in the "1st Half" (1-15) or "2nd Half" (16-31)
      // based on the start date of the selection.
      let isFirstHalf = true;
      if (periodCover.includes(" - ")) {
          const parts = periodCover.split(" - ");
          const startDate = new Date(parts[0]);
          if (startDate.getDate() > 15) {
              isFirstHalf = false;
          }
      } else if (periodCover.includes("16-")) {
          isFirstHalf = false;
      }

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
      const dateCellW = Math.floor(dateAreaW / 16);
      const headerRowHeight = 18;
      const rowHeight = 18;
      const guardRowHeight = rowHeight * 2;
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
        
        doc.rect(currentX, headerY1, ampmColW, headerRowHeight).stroke();
        doc.text("AM", currentX, headerY1 + 6, { width: ampmColW, align: 'center' });
        doc.rect(currentX, headerY2, ampmColW, headerRowHeight).fillAndStroke(pmShadeColor, 'black');
        doc.fillColor('black').text("PM", currentX, headerY2 + 6, { width: ampmColW, align: 'center' });
        currentX += ampmColW;

        const dateHeaderStartX = currentX;
        
        // Loop 16 times to create the header grid
        for (let col = 0; col < 16; col++) {
          const thisColW = dateCellW;
          const topDay = col + 1;  // 1 to 16
          const bottomDay = col + 16; // 16 to 31
          
          // TOP ROW (1-15)
          if (topDay <= 15) {
            doc.rect(currentX, headerY1, thisColW, headerRowHeight).stroke();
            doc.text(String(topDay), currentX, headerY1 + 6, { width: thisColW, align: "center" });
          } else {
            // For column 16 (empty top)
            doc.rect(currentX, headerY1, thisColW, headerRowHeight).stroke();
          }

          // BOTTOM ROW (16-31) - THIS IS THE RESTORED PART
          if (bottomDay <= 31) {
            doc.rect(currentX, headerY2, thisColW, headerRowHeight).fillAndStroke(pmShadeColor, 'black');
            doc.fillColor('black').text(String(bottomDay), currentX, headerY2 + 6, { width: thisColW, align: "center" });
          } else {
             // For Empty days after 31
            doc.rect(currentX, headerY2, thisColW, headerRowHeight).stroke();
          }
          currentX += thisColW;
        }

        currentX = dateHeaderStartX + dateCellW * 16;
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
          if (rec.timeIn && rec.timeOut && rec.scheduleId) {
            const t1 = new Date(rec.timeIn);
            const t2 = new Date(rec.timeOut);
            let diffMs = t2 - t1;
            if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
            const hours = diffMs / (1000 * 60 * 60);
            totalMinutes += diffMs / (1000 * 60);

            // Use the actual Date (1-31)
            const day = t1.getDate();
            workDays.add(day);

            if (rec.scheduleId.shiftType === 'Night Shift') {
                nightShiftHoursMap.set(day, (nightShiftHoursMap.get(day) || 0) + hours);
            } else {
                dayShiftHoursMap.set(day, (dayShiftHoursMap.get(day) || 0) + hours);
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
        doc.rect(currentX, rowY, ampmColW, rowHeight).stroke();
        doc.rect(currentX, rowY + rowHeight, ampmColW, rowHeight).fillAndStroke(pmShadeColor, 'black');
        doc.fillColor('black');
        currentX += ampmColW;

        const dateCellStartX = currentX;
        
        // Determine Start Day for Data Filling based on "isFirstHalf"
        // If 1st half: start at 1. If 2nd half: start at 16.
        const startDay = isFirstHalf ? 1 : 16;

        for (let col = 0; col < 16; col++) {
            const day = startDay + col;
            const thisColW = dateCellW;

            // AM Row
            doc.fillColor('black');
            doc.rect(currentX, rowY, thisColW, rowHeight).stroke();
            const dayShiftHours = dayShiftHoursMap.get(day);
            if (dayShiftHours) {
                doc.text(dayShiftHours.toFixed(1), currentX, rowY + 6, { width: thisColW, align: 'center' });
            }

            // PM Row
            doc.rect(currentX, rowY + rowHeight, thisColW, rowHeight).fillAndStroke(pmShadeColor, 'black');
            doc.fillColor('black');
            const nightShiftHours = nightShiftHoursMap.get(day);
            if (nightShiftHours) {
                doc.text(nightShiftHours.toFixed(1), currentX, rowY + rowHeight + 6, { width: thisColW, align: 'center' });
            }
            currentX += thisColW;
        }

        // Totals & Sig
        currentX = dateCellStartX + dateCellW * 16;
        doc.rect(currentX, rowY, daysColW, guardRowHeight).stroke();
        doc.text(totalDays.toString(), currentX, rowY + 12, { width: daysColW, align: "center" });
        currentX += daysColW;
        doc.rect(currentX, rowY, hoursColW, guardRowHeight).stroke();
        doc.text(totalHours, currentX, rowY + 12, { width: hoursColW, align: 'center' });
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
