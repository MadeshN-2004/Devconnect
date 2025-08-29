import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxLength: 100 },
  description: { type: String, trim: true, maxLength: 500 },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  groupType: { type: String, enum: ['public', 'private'], default: 'private' }
}, { timestamps: true });

groupSchema.index({ members: 1 });
groupSchema.index({ creator: 1 });

const Group = mongoose.model('Group', groupSchema);
export default Group;