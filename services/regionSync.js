
import mongoose from 'mongoose';

class RegionSyncService {
  constructor() {
    this.regions = {
      uae: process.env.MONGODB_URI_UAE,
      saudi: process.env.MONGODB_URI_KSA,
      qatar: process.env.MONGODB_URI_QATAR
    };
  }

  async syncAppointment(appointmentId, sourceRegion) {
    const appointment = await this.getAppointment(appointmentId, sourceRegion);
    
    // Sync to all other regions
    for (const [region, uri] of Object.entries(this.regions)) {
      if (region === sourceRegion) continue;
      
      try {
        await this.upsertAppointment(region, appointment);
        console.log(`✅ Synced to ${region}`);
      } catch (error) {
        console.error(`❌ Failed to sync to ${region}:`, error.message);
        await this.queueRetry(appointmentId, region);
      }
    }
  }

  async resolveConflict(record, regionRecords) {
    // Last-write-wins conflict resolution
    const latest = regionRecords.sort((a, b) => b.updatedAt - a.updatedAt)[0];
    return latest;
  }

  queueRetry(appointmentId, region) {
    // Add to BullMQ retry queue
    // Will retry after 5, 15, 30 minutes
  }
}

export default new RegionSyncService();
