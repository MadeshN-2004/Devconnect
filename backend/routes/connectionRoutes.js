import express from 'express';
import Connection from '../models/Connection.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js'; // Using your existing auth

const router = express.Router();

// GET /api/connections/discover - Get users available for connection
router.get('/discover', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // Using your req.user.id format
    
    // Get all connection IDs where current user is involved
    const connections = await Connection.find({
      $or: [
        { requester: userId },
        { recipient: userId }
      ]
    }).select('requester recipient status');
    
    // Collect all user IDs that are already connected or have pending requests
    const connectedUserIds = new Set();
    connections.forEach(conn => {
      if (conn.requester.toString() !== userId.toString()) {
        connectedUserIds.add(conn.requester.toString());
      }
      if (conn.recipient.toString() !== userId.toString()) {
        connectedUserIds.add(conn.recipient.toString());
      }
    });
    
    // Add current user ID to exclude from results
    connectedUserIds.add(userId.toString());
    
    // Find users not in the connected list
    const availableUsers = await User.find({
      _id: { $nin: Array.from(connectedUserIds) }
    }).select('name email role place createdAt');
    
    res.json({
      success: true,
      data: availableUsers
    });
  } catch (error) {
    console.error('Error discovering users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/connections/request - Send connection request
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { recipientId } = req.body;
    
    // Validation
    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required'
      });
    }
    
    if (requesterId.toString() === recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send connection request to yourself'
      });
    }
    
    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });
    
    if (existingConnection) {
      let message = 'Connection request already exists';
      if (existingConnection.status === 'accepted') {
        message = 'You are already connected with this user';
      } else if (existingConnection.status === 'rejected') {
        message = 'Connection request was previously rejected';
      }
      
      return res.status(400).json({
        success: false,
        message
      });
    }
    
    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Create connection request
    const connection = new Connection({
      requester: requesterId,
      recipient: recipientId
    });
    
    await connection.save();
    
    res.status(201).json({
      success: true,
      message: 'Connection request sent successfully',
      data: connection
    });
  } catch (error) {
    console.error('Error sending connection request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send connection request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/connections/requests/received - Get pending requests received
router.get('/requests/received', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const requests = await Connection.find({
      recipient: userId,
      status: 'pending'
    })
    .populate('requester', 'name email role place createdAt')
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching received requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connection requests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/connections/requests/sent - Get pending requests sent
router.get('/requests/sent', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const requests = await Connection.find({
      requester: userId,
      status: 'pending'
    })
    .populate('recipient', 'name email role place createdAt')
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sent requests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/connections/respond/:connectionId - Accept/Reject connection request
router.put('/respond/:connectionId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { connectionId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    
    // Validation
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "accept" or "reject"'
      });
    }
    
    // Find the connection request
    const connection = await Connection.findOne({
      _id: connectionId,
      recipient: userId,
      status: 'pending'
    });
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found or already processed'
      });
    }
    
    // Update connection status
    connection.status = action === 'accept' ? 'accepted' : 'rejected';
    connection.updatedAt = new Date();
    
    await connection.save();
    
    res.json({
      success: true,
      message: `Connection request ${action}ed successfully`,
      data: connection
    });
  } catch (error) {
    console.error('Error responding to connection request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to connection request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/connections/my-connections - Get all accepted connections
router.get('/my-connections', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const connections = await Connection.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    })
    .populate('requester recipient', 'name email role place createdAt')
    .sort({ updatedAt: -1 });
    
    // Extract the connected users (not the current user)
    const connectedUsers = connections.map(conn => {
      const isRequester = conn.requester._id.toString() === userId.toString();
      const connectedUser = isRequester ? conn.recipient : conn.requester;
      
      return {
        ...connectedUser.toObject(),
        connectionId: conn._id,
        connectedAt: conn.updatedAt,
        connectionStatus: conn.status
      };
    });
    
    res.json({
      success: true,
      data: connectedUsers
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connections',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/connections/remove/:connectionId - Remove/Delete connection
router.delete('/remove/:connectionId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { connectionId } = req.params;
    
    // Find connection where current user is involved
    const connection = await Connection.findOne({
      _id: connectionId,
      $or: [
        { requester: userId },
        { recipient: userId }
      ]
    });
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found or you do not have permission to remove it'
      });
    }
    
    await Connection.findByIdAndDelete(connectionId);
    
    res.json({
      success: true,
      message: 'Connection removed successfully'
    });
  } catch (error) {
    console.error('Error removing connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove connection',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/connections/status/:userId - Check connection status with specific user
router.get('/status/:userId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;
    
    if (currentUserId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check connection status with yourself'
      });
    }
    
    const connection = await Connection.findOne({
      $or: [
        { requester: currentUserId, recipient: userId },
        { requester: userId, recipient: currentUserId }
      ]
    });
    
    let status = 'none';
    let connectionId = null;
    let isSentByMe = false;
    let canSendRequest = true;
    
    if (connection) {
      connectionId = connection._id;
      status = connection.status;
      isSentByMe = connection.requester.toString() === currentUserId.toString();
      canSendRequest = false;
    }
    
    res.json({
      success: true,
      data: {
        status,
        connectionId,
        isSentByMe,
        canSendRequest
      }
    });
  } catch (error) {
    console.error('Error checking connection status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check connection status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/connections/stats - Get connection statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [
      totalConnections,
      pendingReceived,
      pendingSent,
      totalUsers
    ] = await Promise.all([
      Connection.countDocuments({
        $or: [
          { requester: userId, status: 'accepted' },
          { recipient: userId, status: 'accepted' }
        ]
      }),
      Connection.countDocuments({
        recipient: userId,
        status: 'pending'
      }),
      Connection.countDocuments({
        requester: userId,
        status: 'pending'
      }),
      User.countDocuments({ _id: { $ne: userId } })
    ]);
    
    res.json({
      success: true,
      data: {
        totalConnections,
        pendingReceived,
        pendingSent,
        availableUsers: Math.max(0, totalUsers - totalConnections - pendingReceived - pendingSent)
      }
    });
  } catch (error) {
    console.error('Error fetching connection stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connection statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;