import schedule from "node-schedule";
import { SocialMediaService } from "../services/SocialMediaService";

export class SocialMediaScheduler {
  /**
   * Initialize social media posting scheduler
   * Runs every hour to check for scheduled posts
   */
  static initializeScheduler(): void {
    // Process scheduled posts every hour
    schedule.scheduleJob("0 * * * *", async () => {
      console.log("🔄 Processing scheduled social media posts...");
      try {
        await SocialMediaService.processScheduledPosts();
        console.log("✅ Social media posts processed");
      } catch (error) {
        console.error("❌ Error processing social media posts:", error);
      }
    });

    // Log scheduler status
    console.log("📅 Social Media Scheduler initialized");
    console.log("   - Processes scheduled posts every hour");
    console.log("   - Available 20 hours per day (4am-midnight)");
  }

  /**
   * Get scheduler status
   */
  static getStatus(): any {
    const now = new Date();
    const hours = now.getHours();
    const isActive = hours >= 4 && hours < 24; // 4am to midnight

    return {
      isActive,
      currentHour: hours,
      activeHours: "4:00 AM - 11:59 PM (20 hours/day)",
      offlineHours: "12:00 AM - 3:59 AM (4 hours maintenance)",
      nextCheckIn: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
    };
  }
}
