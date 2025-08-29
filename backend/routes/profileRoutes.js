import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// GET: Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // don't send password
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// PUT: Update user profile including password/email/role
router.put('/profile/update', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const {
    name,
    email,
    phone,
    place,
    role,
    profileImage,
    password,         // optional
    currentPassword,  // optional, for verifying old password
  } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Optional: Password change
    if (password && currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Update other fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.place = place || user.place;
    user.role = role || user.role;
    user.profileImage = profileImage || user.profileImage;

    const updatedUser = await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        place: updatedUser.place,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error });
  }
});

export default router;
