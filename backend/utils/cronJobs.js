import cron from "node-cron";
import Applicant from "../models/applicant.model.js"; 
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 

export const startApplicantCleanup = () => {
  // 1. SCHEDULE: Run once a day at Midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    console.log(" Daily Cleanup: Checking for old declined applicants...");

    try {
      // 2. TIMELINE: Set cutoff to 30 Days Ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // 3. QUERY: Find 'Declined' applicants OLDER than 30 days
      const applicantsToDelete = await Applicant.find({
        status: "Declined", 
        updatedAt: { $lt: thirtyDaysAgo } 
      });

      if (applicantsToDelete.length === 0) {
        // This is normal for most days!
        console.log("✅ No old declined applicants found today.");
        return;
      }

      console.log(`🗑️ Found ${applicantsToDelete.length} old applicants to remove.`);

      // 4. CLEANUP: Delete their files
      applicantsToDelete.forEach(app => {
        if (app.resume && app.resume.path) {
          try {
            const filePath = path.resolve(app.resume.path); 
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (fileErr) {
            console.error(`   - Failed to delete file for ${app.name}:`, fileErr.message);
          }
        }
      });

      // 5. DELETE: Remove from Database
      const idsToDelete = applicantsToDelete.map(a => a._id);
      const result = await Applicant.deleteMany({
        _id: { $in: idsToDelete }
      });

      console.log(`🎉 Cleanup Complete: Deleted ${result.deletedCount} records.`);

    } catch (error) {
      console.error("❌ Error during automated cleanup:", error);
    }
  });
};