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
        size: "LEGAL",
        layout: "landscape",
        margins: { top: 30, bottom: 30, left: 30, right: 30 },
      });

      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // --- LAYOUT CONSTANTS ---
      const pageW = doc.page.width;
      const pageH = doc.page.height;
      const margin = 30;

      const noColW = 30;
      const nameColW = 120;
      const daysColW = 40;
      const hoursColW = 55;
      const sigColW = 70;

      const contentW = pageW - margin * 2;
      const dateAreaW = contentW - (noColW + nameColW + daysColW + hoursColW + sigColW);
      const dateCellW = Math.floor(dateAreaW / 16);
      
      const headerRowHeight = 18;
      const rowHeight = 18;
      const guardRowHeight = rowHeight * 2;
      const signatureBlockHeight = 90;

      let currentY = margin;

      const drawPageHeader = (isFirstPage) => {
        currentY = margin;
        if (isFirstPage) {
          const logoPath = path.join(process.cwd(), "backend", "assets", "headerpdf", "jpmlogo.png");
          if (fs.existsSync(logoPath)) {
            doc.image(logoPath, pageW - margin - 70, margin - 10, { width: 70 });
          }

          doc.font("Helvetica-Bold").fontSize(12).text("JPM SECURITY AGENCY CORP.", margin, currentY);
          currentY += 14;
          doc.font("Helvetica").fontSize(9).text("123 Security Drive, Indang, Cavite, 4122", margin, currentY);
          currentY += 11;
          doc.font("Helvetica").text("Contact: (123) 456-7890", margin, currentY);
          currentY += 11;
          doc.font("Helvetica").text("Email: contact@jpmsecurity.test", margin, currentY);
          currentY += 20;
        } else {
          currentY += 75; // Reserve space on subsequent pages
        }

        doc.font("Helvetica-Bold").fontSize(10);
        doc.text("Period Covered:", margin, currentY, { continued: true });
        doc.font("Helvetica").text(` ${periodCover}`);

        // Simplified Detachment positioning
        doc.font("Helvetica-Bold").text("Detachment:", margin, currentY + 12, { continued: true });
        doc.font("Helvetica").text(` ${clientName}`);

        currentY += 35;
      };

      const drawTableHeaders = () => {
        doc.font("Helvetica-Bold").fontSize(8);
        const headerY1 = currentY;
        const headerY2 = headerY1 + headerRowHeight;
        let currentX = margin;

        doc.rect(currentX, headerY1, noColW, headerRowHeight * 2).stroke();
        doc.text("No.", currentX, headerY1 + 10, { width: noColW, align: "center" });
        currentX += noColW;

        doc.rect(currentX, headerY1, nameColW, headerRowHeight * 2).stroke();
        doc.text("Name of Guard", currentX, headerY1 + 10, { width: nameColW, align: "center" });
        currentX += nameColW;

        const dateHeaderStartX = currentX;
        for (let col = 0; col < 16; col++) {
          const thisColW = dateCellW;
          const topDay = col + 1;
          const bottomDay = col + 16;
          
          if (topDay <= 15) {
            doc.rect(currentX, headerY1, thisColW, headerRowHeight).stroke();
            doc.text(String(topDay), currentX, headerY1 + 6, { width: thisColW, align: "center" });
          } else {
            doc.rect(currentX, headerY1, thisColW, headerRowHeight).stroke();
          }

          if (bottomDay <= 31) {
            doc.rect(currentX, headerY2, thisColW, headerRowHeight).stroke();
            doc.text(String(bottomDay), currentX, headerY2 + 6, { width: thisColW, align: "center" });
          } else {
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

      const guards = Array.from(groupedAttendance.keys ? groupedAttendance.keys() : []);
      for (let i = 0; i < guards.length; i++) {
        const guard = guards[i];

        if (currentY + guardRowHeight > pageH - margin) {
          doc.addPage();
          drawPageHeader(false);
          drawTableHeaders();
        }

        const rowY = currentY;
        let currentX = margin;
        
        doc.rect(currentX, rowY, noColW, guardRowHeight).stroke();
        doc.font("Helvetica").fontSize(9).text(String(i + 1), currentX, rowY + 12, { width: noColW, align: "center" });
        currentX += noColW;

        doc.rect(currentX, rowY, nameColW, guardRowHeight).stroke();
        const guardName = guard && guard.fullName ? guard.fullName : (typeof guard === "string" ? guard : "");
        doc.text(guardName || "", currentX + 3, rowY + 12, { width: nameColW - 6, ellipsis: true });
        currentX += nameColW;

        const dateCellStartX = currentX;
        for (let col = 0; col < 16; col++) {
          const thisColW = dateCellW;
          doc.rect(currentX, rowY, thisColW, rowHeight).stroke();
          doc.rect(currentX, rowY + rowHeight, thisColW, rowHeight).stroke();
          currentX += thisColW;
        }

        currentX = dateCellStartX + dateCellW * 16;
        doc.rect(currentX, rowY, daysColW, guardRowHeight).stroke();
        currentX += daysColW;
        doc.rect(currentX, rowY, hoursColW, guardRowHeight).stroke();
        currentX += hoursColW;
        doc.rect(currentX, rowY, sigColW, guardRowHeight).stroke();

        currentY += guardRowHeight;
      }

      if (currentY + signatureBlockHeight > pageH - margin) {
        doc.addPage();
        currentY = margin + 20; // Add some top margin on new page for signatures
      }
      
      doc.font("Helvetica-Bold").fontSize(10);
      const sigBlockX = margin;
      const sigBlockWidth = 250;
      const lineYOffset = 10;

      // Position signature block at the end of content
      currentY = pageH - margin - signatureBlockHeight;

      doc.text("Prepared By:", sigBlockX, currentY);
      doc.moveTo(sigBlockX + 70, currentY + lineYOffset).lineTo(sigBlockX + sigBlockWidth, currentY + lineYOffset).stroke();
      currentY += 12;
      doc.font("Helvetica").fontSize(8).text("Guard on Duty", sigBlockX + 70, currentY);
      
      currentY += 18;
      doc.font("Helvetica-Bold").fontSize(10).text("Checked By:", sigBlockX, currentY);
      doc.moveTo(sigBlockX + 70, currentY + lineYOffset).lineTo(sigBlockX + sigBlockWidth, currentY + lineYOffset).stroke();
      currentY += 12;
      doc.font("Helvetica").fontSize(8).text("Officer / Supervisor / Manager", sigBlockX + 70, currentY);

      currentY += 18;
      doc.font("Helvetica-Bold").fontSize(10).text("Approved By:", sigBlockX, currentY);
      doc.moveTo(sigBlockX + 70, currentY + lineYOffset).lineTo(sigBlockX + sigBlockWidth, currentY + lineYOffset).stroke();
      currentY += 12;
      doc.font("Helvetica").fontSize(8).text("Client Representative", sigBlockX + 70, currentY);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

