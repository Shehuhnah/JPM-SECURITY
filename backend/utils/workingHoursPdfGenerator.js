import PDFDocument from 'pdfkit';

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
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        // Helper for parsing dates
        const parseDateTime = (datePart, timePart) => {
            if (!timePart) return null;
            const timeAsDate = new Date(timePart);
            if (!isNaN(timeAsDate.getTime())) return timeAsDate;
            if (!datePart) return null;
            const dateString = new Date(datePart).toISOString().split('T')[0];
            return new Date(`${dateString} ${timePart}`);
        };

        // Create a map of attendance data for easy lookup
        const attendanceMap = new Map();
        let totalMinutes = 0;
        let workDays = 0;

        attendanceRecords.forEach(record => {
            const day = new Date(record.date).getDate();
            const start = parseDateTime(record.date, record.timeIn);
            const end = parseDateTime(record.date, record.timeOut);
            
            if (start && end) {
                workDays++;
                if (end < start) end.setDate(end.getDate() + 1);
                const diffMs = end - start;
                if (diffMs > 0) {
                    const diffMinutes = Math.floor(diffMs / (1000 * 60));
                    totalMinutes += diffMinutes;
                    const hours = Math.floor(diffMinutes / 60);
                    // const minutes = diffMinutes % 60;
                    // For simplicity in the small box, we just show hours as a decimal.
                    attendanceMap.set(day, (diffMinutes / 60).toFixed(1));
                } else {
                    attendanceMap.set(day, '0');
                }
            }
        });
        
        const totalHours = (totalMinutes / 60).toFixed(1);

        // -- DRAWING --
        
        // Header
        doc.font('Helvetica-Bold').fontSize(11).text('Period Cover: ', 40, 40, { continued: true }).font('Helvetica').text(periodCover, { underline: true });
        doc.font('Helvetica-Bold').fontSize(11).text('Detachment: ', 40, 60, { continued: true }).font('Helvetica').text(guard.dutyStation || 'N/A', { underline: true });

        // --- Table Constants ---
        const tableX = 40;
        const tableY = 90;
        const headerHeight = 40;
        const rowHeight = 25;
        const nameColWidth = 120;
        const dateCellWidth = 24;
        const totalColWidth = 70;
        const sigColWidth = 100;
        const tableWidth = nameColWidth + (dateCellWidth * 16) + totalColWidth + sigColWidth;

        // --- Draw Main Table Structure ---
        doc.rect(tableX, tableY, tableWidth, headerHeight + (rowHeight * 2)).stroke();

        // --- Column Headers ---
        doc.font('Helvetica-Bold').fontSize(8);
        
        // Name Header
        doc.rect(tableX, tableY, nameColWidth, headerHeight).stroke();
        doc.text('Name of Guard', tableX, tableY + 15, { width: nameColWidth, align: 'center'});
        
        // Date Headers (1-16)
        for (let i = 1; i <= 16; i++) {
            const x = tableX + nameColWidth + (dateCellWidth * (i - 1));
            doc.rect(x, tableY, dateCellWidth, headerHeight).stroke();
            doc.text(i, x, tableY + 15, { width: dateCellWidth, align: 'center' });
        }
        
        // Total Header
        const totalX = tableX + nameColWidth + (dateCellWidth * 16);
        doc.rect(totalX, tableY, totalColWidth, headerHeight).stroke();
        doc.text('TOTAL NO.', totalX, tableY + 15, { width: totalColWidth, align: 'center'});
        
        // Signature Header
        const sigX = totalX + totalColWidth;
        doc.rect(sigX, tableY, sigColWidth, headerHeight).stroke();
        doc.text('Signature', sigX, tableY + 15, { width: sigColWidth, align: 'center'});

        // --- Data Rows ---
        doc.font('Helvetica').fontSize(8);
        const row1Y = tableY + headerHeight;
        const row2Y = row1Y + rowHeight;

        // Name Data
        doc.rect(tableX, row1Y, nameColWidth, rowHeight * 2).stroke();
        doc.text(guard.fullName, tableX + 3, row1Y + (rowHeight - 5), { width: nameColWidth - 6 });

        // Date Data Rows
        for (let i = 1; i <= 16; i++) { // Days 1-16
            const x = tableX + nameColWidth + (dateCellWidth * (i - 1));
            doc.rect(x, row1Y, dateCellWidth, rowHeight).stroke();
            doc.text(attendanceMap.get(i) || '', x, row1Y + 9, { width: dateCellWidth, align: 'center' });
        }
         for (let i = 17; i <= 31; i++) { // Days 17-31
            const x = tableX + nameColWidth + (dateCellWidth * (i - 17));
            doc.rect(x, row2Y, dateCellWidth, rowHeight).stroke();
            doc.text(attendanceMap.get(i) || '', x, row2Y + 9, { width: dateCellWidth, align: 'center' });
        }
        // Fill empty cell for day 16 on second row
        doc.rect(tableX + nameColWidth + (dateCellWidth * 15), row2Y, dateCellWidth, rowHeight).stroke();


        // Total Data
        doc.rect(totalX, row1Y, totalColWidth, rowHeight * 2).stroke(); // Main total box
        doc.rect(totalX, row1Y, totalColWidth, rowHeight).stroke();     // Line to split days/hours
        doc.text('Days', totalX + 3, row1Y + 9);
        doc.text('Hours', totalX + 3, row2Y + 9);
        doc.font('Helvetica-Bold');
        doc.text(workDays.toString(), totalX + 35, row1Y + 9, { width: 30, align: 'right' });
        doc.text(totalHours, totalX + 35, row2Y + 9, { width: 30, align: 'right' });
        
        // Signature Data
        doc.rect(sigX, row1Y, sigColWidth, rowHeight * 2).stroke();
        
        doc.end();
    } catch(err) {
        reject(err);
    }
  });
};

