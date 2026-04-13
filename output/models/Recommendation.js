```javascript
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const recommendationSchema = new Schema({
    userId: { type: String, required: true },
    itemId: { type: String, required: true },
    score: { type: Number, required: true },
}, { timestamps: true });

export default model('Recommendation', recommendationSchema);
```