```javascript
import mongoose from 'mongoose';
const { Schema } = mongoose;

const reportSchema = new Schema({
  tenant: String,
  type: String,
  format: String,
  status: String,
  requestedBy: String,
  parameters: Object,
  filePath: String,
  fileSize: Number,
  downloadUrl: String,
  downloadUrlExpiresAt: Date,
  emailedTo: [String],
  processingStartedAt: Date,
  completedAt: Date,
  errorMessage: String,
  rowCount: Number,
  createdAt: { type: Date, default: Date.now },
});

reportSchema.methods.refreshDownloadUrl = function(newUrl) {
  this.downloadUrl = newUrl;
};

const Report = mongoose.model('Report', reportSchema);
export default Report;
```