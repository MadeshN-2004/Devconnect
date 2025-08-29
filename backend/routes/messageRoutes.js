import express from 'express';
import { sendMessage, getMessages, markAsRead } from '../controllers/messageController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { check } from 'express-validator';

const router = express.Router();

// Send a message
router.post(
  '/',
  authMiddleware,
  [
    check('recipientId', 'Recipient ID is required').notEmpty(),
    check('content', 'Message content is required').notEmpty()
  ],
  sendMessage
);

// Get conversation between two users
router.get('/:recipientId', authMiddleware, getMessages);

// Mark message as read
router.put('/:messageId/read', authMiddleware, markAsRead);

export default router;