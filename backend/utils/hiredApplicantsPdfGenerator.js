import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

export const generateHiredApplicantsPDF = (applicants, month, year) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margins: { top: 30, bottom: 30, left: 30, right: 30 },
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      const headerPath = path.join(process.cwd(), "backend", "assets", "headerpdf", "header.png");
      if (fs.existsSync(headerPath)) {
        doc.image(headerPath, {
          fit: [doc.page.width - 100, 100],
          align: 'center',
          valign: 'top'
        });
      }
      doc.moveDown(1);

      // Title
      doc.font('Helvetica-Bold').fontSize(16).text('List of Hired Applicants', { align: 'center' });
      doc.fontSize(12).text(`${month} ${year}`, { align: 'center' });
      doc.moveDown(1);

      // Table Header
      const tableTop = doc.y;
      const itemX = 50;
      const nameX = 90;
      const emailX = 250;
      const contactX = 420;
      const positionX = 550;
      const dateHiredX = 700;

      doc.font('Helvetica-Bold');
      doc.fontSize(10);
      doc.text('No.', itemX, tableTop);
      doc.text('Name', nameX, tableTop);
      doc.text('Email', emailX, tableTop);
      doc.text('Contact No.', contactX, tableTop);
      doc.text('Position', positionX, tableTop);
      doc.text('Date Hired', dateHiredX, tableTop);
      doc.moveTo(itemX, doc.y).lineTo(doc.page.width - itemX, doc.y).stroke();
      doc.moveDown(1);
      
      // Table Body
      doc.font('Helvetica').fontSize(10);
      applicants.forEach((applicant, index) => {
        const y = doc.y;
        doc.text(index + 1, itemX, y);
        doc.text(applicant.name, nameX, y);
        doc.text(applicant.email, emailX, y);
        doc.text(applicant.phone, contactX, y);
        doc.text(applicant.position, positionX, y);
        doc.text(new Date(applicant.dateOfHired).toLocaleDateString(), dateHiredX, y);
        doc.moveDown(0.8);
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
