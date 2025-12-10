import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Generate a simple COE PDF and save to disk. Returns object with fileName and publicPath
 * @param {Object} requestObj - approvedCOE object and request metadata
 * @param {Object} opts - options { outputDir }
 */

export const generateAndSaveCOE = async (requestObj, opts = {}) => {
  const uploadsDir = opts.outputDir || path.join(process.cwd(), 'backend', 'uploads', 'coe');
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  const fileName = `COE_${requestObj._id}.pdf`;
  const filePath = path.join(uploadsDir, fileName);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // ---- HEADER IMAGE ----
      const headerPath = path.join(process.cwd(), 'backend', 'assets', 'headerpdf', 'header.png');
      if (fs.existsSync(headerPath)) {
        doc.image(headerPath, 60, 20, { width: 480 });
      }

      doc.moveDown(5); // space below header

      // ---- TITLE ----
      doc.font('Helvetica-Bold').fontSize(16).text('CERTIFICATE OF EMPLOYMENT', {
        align: 'center',
      });

      doc.moveDown(2);

      // ---- MAIN CONTENT ----
      const approved = requestObj.approvedCOE || {};
      const guardName = requestObj.guardName || 'Employee Name';
      const position = approved.position || 'Security Guard';
      const purpose = requestObj.purpose || 'employment verification purposes';
      const rawSalary = String(approved.salary || "0").replace(/,/g, "");
      const salaryNum = parseFloat(rawSalary);
      const salary = !isNaN(salaryNum) 
        ? `PHP ${salaryNum.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : 'PHP 0.00';
      const salaryWords = approved.salaryWords || ''; 
      
      // Determine person and default start date from createdAt
      const isGuard = requestObj.requesterRole === 'guard';
      const person = isGuard ? requestObj.guard : requestObj.subadmin;
      const createdAtVal = person?.createdAt || person?._doc?.createdAt; // handle potential mongoose doc structure
      const defaultStart = createdAtVal 
        ? new Date(createdAtVal).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
        : 'November 2023';

      const startDate = approved.employmentStartDate || defaultStart;
      const endDate = approved.employmentEndDate || 'Present';
      const issuedBy = approved.issuedBy || 'HR and Head Administrator';
      const issuedDate = approved.issuedDate
        ? new Date(approved.issuedDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });

      // ---- BODY TEXT ----
      doc.font('Helvetica').fontSize(12).text('This is to certify that', { align: 'center' });
      doc.moveDown(1);

      doc.font('Helvetica-Bold').fontSize(14).text(guardName, { align: 'center' });
      doc.moveDown(1);

      doc.font('Helvetica').fontSize(12).text('has been employed in', { align: 'center' });
      doc.moveDown(1);

      doc.font('Helvetica-Bold').fontSize(13).text('JPM SECURITY AGENCY CORP', { align: 'center' });
      doc.moveDown(1);

      doc.font('Helvetica-Oblique').fontSize(12).text('as', { align: 'center' });
      doc.moveDown(1);

      doc.font('Helvetica-Bold').fontSize(13).text(position, { align: 'center' });
      doc.moveDown(0.5);

      doc.font('Helvetica-Oblique').fontSize(11).text(`from ${startDate} to ${endDate}`, { align: 'center' });

      doc.moveDown(1.5);

      // ---- COMPENSATION LINE (robust centering using margins and exact x positions) ----
      const chunk1 = 'With compensation of ';
      const chunk2 = salaryWords ? `${salaryWords} (${salary})` : `${salary}`;
      const chunk3 = ' per month.';
      const fontSize = 12;

      // set font size first
      doc.fontSize(fontSize);

      // Compute widths using the correct fonts for each chunk
      // IMPORTANT: widthOfString uses the current font. We set the font before each call.
      doc.font('Helvetica');
      const width1 = doc.widthOfString(chunk1);

      doc.font('Helvetica-Bold');
      const width2 = doc.widthOfString(chunk2);

      doc.font('Helvetica');
      const width3 = doc.widthOfString(chunk3);

      const totalWidth = width1 + width2 + width3;

    // Compute usable page width inside margins and center inside margins
    const pageWidth = doc.page.width; // full page width
    const leftMargin = doc.page.margins.left || 50;
    const rightMargin = doc.page.margins.right || 50;
    const usableWidth = pageWidth - leftMargin - rightMargin;

    // Starting x so the combined chunks are centered inside the margins
    const startX = leftMargin + (usableWidth - totalWidth) / 2;

    // Current y position (where to draw the line)
    const startY = doc.y;

    // Small gap to ensure there is always a tiny separation if metrics differ slightly
    const gap = 4; // points

    // Draw each chunk at exact x positions with the correct fonts
    doc.font('Helvetica').text(chunk1, startX, startY, { lineBreak: false });
    doc.font('Helvetica-Bold').text(chunk2, startX + width1, startY, { lineBreak: false });
    doc.font('Helvetica').text(chunk3, startX + width1 + width2 + gap, startY, { lineBreak: false });

      doc.moveDown(1.5);

      // ---- PURPOSE LINE ----
      doc.font('Helvetica-Oblique')
        .fontSize(11)
        .text(
          `This certification is issued upon the request of the aforementioned name for ${purpose} purpose.`,
          { align: 'center' }
        );

      doc.moveDown(2);

      // ---- DATE LINE ----
      doc.font('Helvetica')
        .fontSize(11)
        .text(`Given this ${issuedDate} at Indang, Cavite.`, { align: 'center' });

      doc.moveDown(3);

      // ---- SIGNATURE SECTION ----
      const signaturePath = path.join(process.cwd(), 'backend', 'assets', 'headerpdf', 'signature.png');
      if (fs.existsSync(signaturePath)) {
        // place signature roughly centered
        const sigWidth = 100;
        const sigX = leftMargin + (usableWidth - sigWidth) / 2;
        doc.image(signaturePath, sigX, doc.y - 10, { width: sigWidth });
      }

      doc.moveDown(2);
      doc.font('Helvetica-Bold').fontSize(11).text(issuedBy, { align: 'center' });
      doc.font('Helvetica-Oblique').fontSize(10).text('HR and Head Administrator', { align: 'center' });
      doc.text('JPMSA Corp.', { align: 'center' });

      // ---- END ----
      doc.end();

      stream.on('finish', () => {
        const publicPath = `/uploads/coe/${fileName}`;
        resolve({ fileName, filePath, publicPath });
      });
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};

export default { generateAndSaveCOE };
