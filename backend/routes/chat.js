const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Group = require('../models/Group');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get user's chats (both direct and groups)
router.get('/chats', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get direct messages
    const directMessages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId, isGroup: false },
            { recipient: userId, isGroup: false }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$recipient',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', userId] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          name: '$user.name',
          email: '$user.email',
          role: '$user.role',
          isGroup: false,
          lastMessage: '$lastMessage',
          unreadCount: 1,
          updatedAt: '$lastMessage.createdAt'
        }
      }
    ]);

    // Get group chats
    const groupChats = await Group.find({
      members: userId
    }).populate('members', 'name email role').populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'name'
      }
    }).sort({ updatedAt: -1 });

    // Count unread messages for each group
    const groupsWithUnread = await Promise.all(
      groupChats.map(async (group) => {
        const unreadCount = await Message.countDocuments({
          groupId: group._id,
          sender: { $ne: userId },
          read: false
        });

        return {
          _id: group._id,
          name: group.name,
          description: group.description,
          members: group.members,
          isGroup: true,
          lastMessage: group.lastMessage,
          unreadCount,
          updatedAt: group.updatedAt
        };
      })
    );

    const allChats = [...directMessages, ...groupsWithUnread]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({
      success: true,
      data: allChats
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chats'
    });
  }
});

// Get messages for a specific chat
router.get('/messages/:chatId', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { isGroup } = req.query;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    let messages;

    if (isGroup === 'true') {
      messages = await Message.find({
        groupId: chatId
      })
        .populate('sender', 'name email role')
        .sort({ createdAt: -1 })
        .limit(limit * page)
        .skip((page - 1) * limit);
    } else {
      messages = await Message.find({
        $or: [
          { sender: userId, recipient: chatId, isGroup: false },
          { sender: chatId, recipient: userId, isGroup: false }
        ]
      })
        .populate('sender', 'name email role')
        .populate('recipient', 'name email role')
        .sort({ createdAt: -1 })
        .limit(limit * page)
        .skip((page - 1) * limit);
    }

    // Mark messages as read
    if (isGroup === 'false') {
      await Message.updateMany({
        sender: chatId,
        recipient: userId,
        read: false
      }, {
        read: true
      });
    } else {
      await Message.updateMany({
        groupId: chatId,
        sender: { $ne: userId },
        read: false
      }, {
        read: true
      });
    }

    res.json({
      success: true,
      data: messages.reverse()
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// Send message
router.post('/send', auth, async (req, res) => {
  try {
    const { recipient, groupId, content, isGroup = false } = req.body;
    const senderId = req.user.id;

    if (!content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const messageData = {
      sender: senderId,
      content: content.trim(),
      isGroup,
      read: false
    };

    if (isGroup) {
      messageData.groupId = groupId;
      // Update group's last message and timestamp
      await Group.findByIdAndUpdate(groupId, {
        updatedAt: new Date()
      });
    } else {
      messageData.recipient = recipient;
    }

    const message = new Message(messageData);
    await message.save();

    // Populate sender info for real-time emission
    await message.populate('sender', 'name email role');
    if (!isGroup) {
      await message.populate('recipient', 'name email role');
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// Create group
router.post('/groups', auth, async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const creatorId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }

    if (!members || members.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one member is required'
      });
    }

    // Add creator to members if not already included
    const allMembers = [...new Set([...members, creatorId])];

    const group = new Group({
      name: name.trim(),
      description: description?.trim() || '',
      creator: creatorId,
      members: allMembers
    });

    await group.save();
    await group.populate('members', 'name email role');
    await group.populate('creator', 'name email role');

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create group'
    });
  }
});

// Get group details
router.get('/groups/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId)
      .populate('members', 'name email role')
      .populate('creator', 'name email role');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is a member
    if (!group.members.some(member => member._id.toString() === userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group details'
    });
  }
});

// Add members to group
router.post('/groups/:groupId/members', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { members } = req.body;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is creator or admin
    if (group.creator.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only group creator can add members'
      });
    }

    // Add new members (avoid duplicates)
    const newMembers = members.filter(member => 
      !group.members.includes(member)
    );

    if (newMembers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All selected users are already group members'
      });
    }

    group.members.push(...newMembers);
    await group.save();
    await group.populate('members', 'name email role');

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Error adding group members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add members'
    });
  }
});

// Remove member from group
router.delete('/groups/:groupId/members/:memberId', auth, async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is creator or removing themselves
    if (group.creator.toString() !== userId && memberId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only remove yourself or if you are the group creator'
      });
    }

    group.members = group.members.filter(member => 
      member.toString() !== memberId
    );

    await group.save();
    await group.populate('members', 'name email role');

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Error removing group member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member'
    });
  }
});

module.exports = router;