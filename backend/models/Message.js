import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  content: { type: String, required: true, trim: true },
  isGroup: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  messageType: { type: String, enum: ['text', 'image', 'file'], default: 'text' }
}, { timestamps: true });

messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ groupId: 1, createdAt: -1 });
messageSchema.index({ read: 1, recipient: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;