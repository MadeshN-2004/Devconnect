// backend/models/Skill.js
import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  skill: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    default: 'Intermediate',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Skill = mongoose.model('Skill', skillSchema);
export default Skill;
