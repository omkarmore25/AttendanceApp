// Helper to clean Marathi/Devanagari numerals
function cleanDigits(val) {
  if (val == null) return val;
  const str = String(val);
  const devMap = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };
  const cleaned = str.replace(/[०-९]/g, (d) => devMap[d] !== undefined ? devMap[d] : d);
  return cleaned;
}

const express = require('express');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Group = require('../models/Group');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

// All routes here require Admin authentication
router.use(auth, adminOnly);

// ═══════════════════════════════════════════════════════
// GET /api/admin/manual-users — List manual-entry users
// ═══════════════════════════════════════════════════════
router.get('/manual-users', async (req, res) => {
  try {
    const users = await User.find({ is_manual_entry: true })
      .select('username name email is_manual_entry createdAt')
      .sort({ username: 1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Manual users fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching manual-entry users.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// POST /api/admin/manual-users — Create a manual-entry user
// ═══════════════════════════════════════════════════════
router.post('/manual-users', async (req, res) => {
  try {
    const { name, username, email, phone } = req.body;
    const cleanUsername = (username || name || 'OfflineUser').trim();
    const cleanEmail = email && email.includes('@') ? email.trim().toLowerCase() : `manual_${Date.now()}@offline.local`;

    const user = new User({
      username: cleanUsername,
      name: name || cleanUsername,
      email: cleanEmail,
      phone: (phone || '').trim(),
      role: 'User',
      is_manual_entry: true,
      is_email_verified: true,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: `Manual-entry user "${cleanUsername}" created successfully.`,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    console.error('Manual user creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating manual-entry user.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// POST /api/admin/manual-attendance — Admin marks attendance for user
// ═══════════════════════════════════════════════════════
router.post('/manual-attendance', async (req, res) => {
  try {
    const { eventId, userId } = req.body;

    if (!eventId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'eventId and userId are required.',
      });
    }

    // Check if already attended
    const existing = await Attendance.findOne({
      event_id: eventId,
      user_id: userId,
    });

    if (existing) {
      // Toggle: If already present, remove attendance
      await Attendance.findByIdAndDelete(existing._id);
      return res.status(200).json({
        success: true,
        message: 'Attendance removed (toggled off).',
        action: 'removed',
      });
    }

    // Mark as present
    const attendance = new Attendance({
      event_id: eventId,
      user_id: userId,
      marked_by: 'Admin',
    });

    await attendance.save();

    res.status(201).json({
      success: true,
      message: 'Attendance marked by admin (toggled on).',
      action: 'added',
      attendance,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already recorded.',
      });
    }

    console.error('Manual attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking manual attendance.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/admin/users — List all users
// ═══════════════════════════════════════════════════════
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('username name email phone age role is_manual_entry createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// PUT /api/admin/users/:id — Admin updates user's name, phone, age
// ═══════════════════════════════════════════════════════
router.put('/users/:id', async (req, res) => {
  try {
    const { name, username, phone, email, age } = req.body;
    const existing = await User.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (existing.role === 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify Admin account via this endpoint.',
      });
    }

    const updateFields = {};

    if (name !== undefined && name.trim() !== '') {
      updateFields.name = name.trim();
      if (existing.is_manual_entry) {
        updateFields.username = (username || name).trim();
      }
    }
    if (username !== undefined && username.trim() !== '' && !existing.is_manual_entry) {
      updateFields.username = username.trim();
    }
    if (phone !== undefined) {
      updateFields.phone = cleanDigits(phone).trim();
    }
    if (email !== undefined && email.trim() !== '') {
      updateFields.email = email.trim().toLowerCase();
    }
    if (age !== undefined) {
      const cleanAge = cleanDigits(age);
      if (cleanAge === '' || cleanAge === null || cleanAge === undefined) {
        updateFields.age = null;
      } else {
        const pNum = Number(cleanAge);
        updateFields.age = isNaN(pNum) ? null : pNum;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    ).select('username name email phone age role is_manual_entry createdAt');

    res.status(200).json({
      success: true,
      message: `User "${updatedUser.name || updatedUser.username}" updated successfully.`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format.',
      });
    }
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A user with that email or username already exists.',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error updating user.',
    });
  }
});

// DELETE /api/admin/users/:id — Permanently delete a user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (user.role === 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete Admin account.',
      });
    }

    // 1. Delete user
    await User.findByIdAndDelete(req.params.id);

    // 2. Delete all attendance records for this user
    await Attendance.deleteMany({ user_id: req.params.id });

    // 3. Remove user from all groups
    await Group.updateMany(
      { members: req.params.id },
      { $pull: { members: req.params.id } }
    );

    res.status(200).json({
      success: true,
      message: `User "${user.name}" permanently deleted.`,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format.',
      });
    }

    console.error('User delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// GROUPS MANAGEMENT
// ═══════════════════════════════════════════════════════

// GET /api/admin/groups — List all groups
router.get('/groups', async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('members', 'name username phone email is_manual_entry')
      .populate('created_by', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: groups.length,
      groups,
    });
  } catch (error) {
    console.error('Groups fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching groups.',
    });
  }
});

// POST /api/admin/groups — Create a group
router.post('/groups', async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required.',
      });
    }

    // Admin cannot add themselves as a member
    const filteredMembers = (memberIds || []).filter(
      (id) => id.toString() !== req.user._id.toString()
    );

    const group = new Group({
      name,
      description: description || '',
      members: filteredMembers,
      created_by: req.user._id,
    });

    await group.save();

    // Populate for response
    await group.populate('members', 'name phone');

    res.status(201).json({
      success: true,
      message: 'Group created successfully.',
      group,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A group with this name already exists.',
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    console.error('Group creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating group.',
    });
  }
});

// PUT /api/admin/groups/:id/members — Update group members
router.put('/groups/:id/members', async (req, res) => {
  try {
    const { memberIds } = req.body;
    const filteredMembers = (memberIds || []).filter(
      (id) => id.toString() !== req.user._id.toString()
    );

    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { members: filteredMembers },
      { new: true }
    ).populate('members', 'name phone');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Group members updated.',
      group,
    });
  } catch (error) {
    console.error('Group update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating group members.',
    });
  }
});

// DELETE /api/admin/groups/:id — Delete a group
router.delete('/groups/:id', async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: `Group "${group.name}" deleted successfully.`,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID format.',
      });
    }

    console.error('Group delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting group.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// DELETE /api/admin/attendance/:id — Delete an attendance record
// ═══════════════════════════════════════════════════════
router.delete('/attendance/:id', async (req, res) => {
  try {
    const record = await Attendance.findByIdAndDelete(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance record deleted.',
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance ID format.',
      });
    }

    console.error('Attendance delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting attendance record.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/admin/stats — Dashboard statistics
// ═══════════════════════════════════════════════════════
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, manualUsers, totalEvents, activeEvents, totalAttendance] =
      await Promise.all([
        User.countDocuments({ role: 'User' }),
        User.countDocuments({ is_manual_entry: true }),
        require('../models/Event').countDocuments(),
        require('../models/Event').countDocuments({ status: 'Active' }),
        Attendance.countDocuments(),
      ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        manualUsers,
        totalEvents,
        activeEvents,
        totalAttendance,
      },
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics.',
    });
  }
});

module.exports = router;
