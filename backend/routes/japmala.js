const express = require('express');
const Japmala = require('../models/Japmala');
const User = require('../models/User');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

// Helper to format ISO date to DD-MM-YYYY
function formatDateDisplay(d) {
  if (!d) return '';
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return String(d);
  const day = String(dateObj.getUTCDate()).padStart(2, '0');
  const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  return `${day}-${m}-${dateObj.getUTCFullYear()}`;
}

// ═══════════════════════════════════════════════════════
// POST /api/japmala — Log or update Japmala (Daily, Range, or Multi-Month Breakdown)
// ═══════════════════════════════════════════════════════
router.post('/', auth, async (req, res) => {
  try {
    const { date, toDate, entryType, count, note, userId, monthlyBreakdown } = req.body;

    let targetUserId = req.user._id;
    if (userId && req.user.role === 'Admin') {
      targetUserId = userId;
    }

    // ─── Case 1: Multi-Month Breakdown (User entered distinct counts per month) ───
    if (monthlyBreakdown && Array.isArray(monthlyBreakdown) && monthlyBreakdown.length > 0) {
      for (const item of monthlyBreakdown) {
        if (!item.from || !item.to || item.count == null) continue;
        const s = new Date(item.from);
        s.setUTCHours(0, 0, 0, 0);
        const e = new Date(item.to);
        e.setUTCHours(0, 0, 0, 0);

        // Remove overlapping entries in this month's window
        await Japmala.deleteMany({
          user: targetUserId,
          date: { $gte: s, $lte: e },
        });

        await Japmala.create({
          user: targetUserId,
          entryType: 'range',
          date: s,
          toDate: e,
          count: Number(item.count),
          note: note || '',
        });
      }

      return res.status(200).json({
        success: true,
        message: `Saved ${monthlyBreakdown.length} monthly entries successfully!`,
      });
    }

    if (!date || count == null) {
      return res.status(400).json({
        success: false,
        message: 'Date and count are required.',
      });
    }

    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);

    const isRange = (entryType === 'range' || !!toDate) && toDate;
    let endDate = null;
    if (isRange) {
      endDate = new Date(toDate);
      endDate.setUTCHours(0, 0, 0, 0);
      if (endDate < startDate) {
        return res.status(400).json({
          success: false,
          message: '"To" date must be after "From" date.',
        });
      }
    }

    let entry;
    if (isRange) {
      // Validation: Check if this new range overlaps with a DIFFERENT existing range
      const overlappingRange = await Japmala.findOne({
        user: targetUserId,
        entryType: 'range',
        date: { $lte: endDate },
        toDate: { $gte: startDate },
      });

      if (
        overlappingRange &&
        (overlappingRange.date.getTime() !== startDate.getTime() ||
          overlappingRange.toDate.getTime() !== endDate.getTime())
      ) {
        const fromStr = formatDateDisplay(overlappingRange.date);
        const toStr = formatDateDisplay(overlappingRange.toDate);
        return res.status(400).json({
          success: false,
          message: `Validation Error: This range overlaps with an existing Date Range (${fromStr} to ${toStr}). Please edit that range instead.`,
        });
      }

      // 1. Remove any daily entries that fall within this range
      await Japmala.deleteMany({
        user: targetUserId,
        $or: [
          { entryType: 'daily' },
          { toDate: null },
          { toDate: { $exists: false } },
        ],
        date: { $gte: startDate, $lte: endDate },
      });

      // 2. Remove identical or fully contained sub-ranges
      await Japmala.deleteMany({
        user: targetUserId,
        entryType: 'range',
        date: { $gte: startDate, $lte: endDate },
        toDate: { $gte: startDate, $lte: endDate },
      });

      // 3. Upsert range entry
      entry = await Japmala.findOneAndUpdate(
        { user: targetUserId, date: startDate, toDate: endDate, entryType: 'range' },
        {
          user: targetUserId,
          entryType: 'range',
          date: startDate,
          toDate: endDate,
          count: Number(count),
          note: note || '',
        },
        { upsert: true, new: true, runValidators: true }
      );
    } else {
      // 🚨 VALIDATION: Check if this daily date falls inside an existing Date Range!
      const existingRange = await Japmala.findOne({
        user: targetUserId,
        entryType: 'range',
        date: { $lte: startDate },
        toDate: { $gte: startDate },
      });

      if (existingRange) {
        const fromStr = formatDateDisplay(existingRange.date);
        const toStr = formatDateDisplay(existingRange.toDate);
        return res.status(400).json({
          success: false,
          message: `Validation Error: Date ${formatDateDisplay(startDate)} falls inside an existing Date Range (${fromStr} to ${toStr}). Please edit the Date Range in History instead.`,
        });
      }

      // Upsert daily entry
      entry = await Japmala.findOneAndUpdate(
        { user: targetUserId, date: startDate, $or: [{ entryType: 'daily' }, { toDate: null }] },
        {
          user: targetUserId,
          entryType: 'daily',
          date: startDate,
          toDate: null,
          count: Number(count),
          note: note || '',
        },
        { upsert: true, new: true, runValidators: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Japmala entry saved successfully!',
      entry,
    });
  } catch (error) {
    console.error('Japmala save error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error saving Japmala entry.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/japmala/range-preview — Preview daily entries in a range for merging
// ═══════════════════════════════════════════════════════
router.get('/range-preview', auth, async (req, res) => {
  try {
    const { from, to, userId } = req.query;
    if (!from || !to) {
      return res.status(400).json({ success: false, message: 'from and to dates required.' });
    }

    let targetUserId = req.user._id;
    if (userId && req.user.role === 'Admin') {
      targetUserId = userId;
    }

    const startDate = new Date(from);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(to);
    endDate.setUTCHours(23, 59, 59, 999);

    const dailyEntries = await Japmala.find({
      user: targetUserId,
      $or: [{ entryType: 'daily' }, { toDate: null }],
      date: { $gte: startDate, $lte: endDate },
    });

    const totalCount = dailyEntries.reduce((sum, e) => sum + e.count, 0);

    res.status(200).json({
      success: true,
      count: dailyEntries.length,
      totalCount,
    });
  } catch (error) {
    console.error('Range preview error:', error);
    res.status(500).json({ success: false, message: 'Error previewing range.' });
  }
});

// ═══════════════════════════════════════════════════════
// Helper: Deduplicate entries so daily entries covered by a range are not double counted
// ═══════════════════════════════════════════════════════
function deduplicateEntries(rawEntries) {
  const rangeEntries = rawEntries.filter(
    (e) => (e.entryType === 'range' || !!e.toDate) && e.toDate
  );

  return rawEntries.filter((e) => {
    if (e.entryType === 'range' || !!e.toDate) return true;
    const t = new Date(e.date).getTime();
    const isCovered = rangeEntries.some((r) => {
      const rStart = new Date(r.date).getTime();
      const rEnd = new Date(r.toDate).getTime();
      return t >= rStart && t <= rEnd;
    });
    return !isCovered;
  });
}

// ═══════════════════════════════════════════════════════
// GET /api/japmala/my — Get logged-in user's entries
// ═══════════════════════════════════════════════════════
router.get('/my', auth, async (req, res) => {
  try {
    const { month, from, to, year } = req.query;
    const filter = { user: req.user._id };

    if (year) {
      const y = Number(year);
      const start = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
      filter.$or = [
        { date: { $gte: start, $lte: end } },
        { toDate: { $gte: start, $lte: end } },
        { date: { $lte: start }, toDate: { $gte: end } },
      ];
    } else if (month) {
      const [y, m] = month.split('-').map(Number);
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 0, 23, 59, 59));
      filter.$or = [
        { date: { $gte: start, $lte: end } },
        { toDate: { $gte: start, $lte: end } },
        { date: { $lte: start }, toDate: { $gte: end } },
      ];
    } else if (from && to) {
      const start = new Date(from);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(to);
      end.setUTCHours(23, 59, 59, 999);
      filter.$or = [
        { date: { $gte: start, $lte: end } },
        { toDate: { $gte: start, $lte: end } },
        { date: { $lte: start }, toDate: { $gte: end } },
      ];
    }

    const rawEntries = await Japmala.find(filter).sort({ date: -1 });

    // Deduplicate: daily entries that fall inside any existing range are omitted
    const entries = deduplicateEntries(rawEntries);

    // Sum true counts without any artificial equal division!
    let total = entries.reduce((sum, e) => sum + e.count, 0);
    let totalDays = 0;
    entries.forEach((e) => {
      if ((e.entryType === 'range' || !!e.toDate) && e.toDate) {
        totalDays += Math.floor((new Date(e.toDate) - new Date(e.date)) / (1000 * 60 * 60 * 24)) + 1;
      } else {
        totalDays += 1;
      }
    });

    res.status(200).json({
      success: true,
      count: entries.length,
      total,
      days: totalDays,
      entries,
    });
  } catch (error) {
    console.error('Japmala fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching Japmala entries.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/japmala/my/summary — Monthly summary for user
// ═══════════════════════════════════════════════════════
router.get('/my/summary', auth, async (req, res) => {
  try {
    const rawEntries = await Japmala.find({ user: req.user._id });
    const entries = deduplicateEntries(rawEntries);

    const monthsMap = {};
    entries.forEach((e) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthsMap[key]) {
        monthsMap[key] = {
          _id: { year: d.getFullYear(), month: d.getMonth() + 1 },
          total: 0,
          entriesCount: 0,
        };
      }
      monthsMap[key].total += e.count;
      monthsMap[key].entriesCount += 1;
    });

    const summary = Object.values(monthsMap).sort(
      (a, b) => b._id.year - a._id.year || b._id.month - a._id.month
    );

    res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('Japmala summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching summary.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/japmala/report — Admin: consolidated report
// ═══════════════════════════════════════════════════════
router.get('/report', auth, adminOnly, async (req, res) => {
  try {
    const { month, from, to, year } = req.query;
    const matchFilter = {};

    if (year) {
      const y = Number(year);
      const start = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
      matchFilter.$or = [
        { date: { $gte: start, $lte: end } },
        { toDate: { $gte: start, $lte: end } },
        { date: { $lte: start }, toDate: { $gte: end } },
      ];
    } else if (month) {
      const [y, m] = month.split('-').map(Number);
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 0, 23, 59, 59));
      matchFilter.$or = [
        { date: { $gte: start, $lte: end } },
        { toDate: { $gte: start, $lte: end } },
        { date: { $lte: start }, toDate: { $gte: end } },
      ];
    } else if (from && to) {
      const start = new Date(from);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(to);
      end.setUTCHours(23, 59, 59, 999);
      matchFilter.$or = [
        { date: { $gte: start, $lte: end } },
        { toDate: { $gte: start, $lte: end } },
        { date: { $lte: start }, toDate: { $gte: end } },
      ];
    }

    const allEntries = await Japmala.find(matchFilter).populate('user', 'name username phone');

    // Group by user and deduplicate per user
    const usersMap = {};
    allEntries.forEach((e) => {
      if (!e.user) return;
      const uId = e.user._id.toString();
      if (!usersMap[uId]) {
        usersMap[uId] = {
          _id: e.user._id,
          name: e.user.name || e.user.username,
          phone: e.user.phone || '',
          rawEntries: [],
        };
      }
      usersMap[uId].rawEntries.push(e);
    });

    const report = Object.values(usersMap).map((u) => {
      const cleanEntries = deduplicateEntries(u.rawEntries);
      const total = cleanEntries.reduce((sum, e) => sum + e.count, 0);
      return {
        _id: u._id,
        name: u.name,
        phone: u.phone,
        total,
        entriesCount: cleanEntries.length,
      };
    }).sort((a, b) => b.total - a.total);

    const grandTotal = report.reduce((sum, r) => sum + r.total, 0);

    res.status(200).json({
      success: true,
      memberCount: report.length,
      grandTotal,
      report,
    });
  } catch (error) {
    console.error('Japmala report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating report.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/japmala/user/:userId — Admin: get a specific user's entries
// ═══════════════════════════════════════════════════════
router.get('/user/:userId', auth, adminOnly, async (req, res) => {
  try {
    const { month, from, to, year } = req.query;
    const filter = { user: req.params.userId };

    if (year) {
      const y = Number(year);
      const start = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
      filter.$or = [
        { date: { $gte: start, $lte: end } },
        { toDate: { $gte: start, $lte: end } },
        { date: { $lte: start }, toDate: { $gte: end } },
      ];
    } else if (month) {
      const [y, m] = month.split('-').map(Number);
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 0, 23, 59, 59));
      filter.$or = [
        { date: { $gte: start, $lte: end } },
        { toDate: { $gte: start, $lte: end } },
        { date: { $lte: start }, toDate: { $gte: end } },
      ];
    } else if (from && to) {
      const start = new Date(from);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(to);
      end.setUTCHours(23, 59, 59, 999);
      filter.$or = [
        { date: { $gte: start, $lte: end } },
        { toDate: { $gte: start, $lte: end } },
        { date: { $lte: start }, toDate: { $gte: end } },
      ];
    }

    const rawEntries = await Japmala.find(filter).sort({ date: -1 });
    const entries = deduplicateEntries(rawEntries);
    const total = entries.reduce((sum, e) => sum + e.count, 0);

    const user = await User.findById(req.params.userId).select('name username phone');

    res.status(200).json({
      success: true,
      user: user ? { name: user.name || user.username, phone: user.phone } : null,
      count: entries.length,
      total,
      entries,
    });
  } catch (error) {
    console.error('Admin fetch user japmala error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user entries.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/japmala/users-list — Admin: get all users for dropdown
// ═══════════════════════════════════════════════════════
router.get('/users-list', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}).select('name username phone').sort({ name: 1 });
    res.status(200).json({
      success: true,
      users: users.map((u) => ({
        _id: u._id,
        name: u.name || u.username,
        phone: u.phone || '',
      })),
    });
  } catch (error) {
    console.error('Users list error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/japmala/export — Admin: export report as HTML/PDF
// ═══════════════════════════════════════════════════════
router.get('/export', auth, adminOnly, async (req, res) => {
  try {
    const { month, from, to, year } = req.query;
    const matchFilter = {};
    let periodLabel = 'All Time';

    if (year) {
      const y = Number(year);
      const start = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
      matchFilter.$or = [
        { date: { $gte: start, $lte: end } },
        { toDate: { $gte: start, $lte: end } },
        { date: { $lte: start }, toDate: { $gte: end } },
      ];
      periodLabel = `Year ${year}`;
    } else if (month) {
      const [y, m] = month.split('-').map(Number);
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 0, 23, 59, 59));
      matchFilter.$or = [
        { date: { $gte: start, $lte: end } },
        { toDate: { $gte: start, $lte: end } },
        { date: { $lte: start }, toDate: { $gte: end } },
      ];
      const monthNamesArr = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      periodLabel = `${monthNamesArr[m]} ${y}`;
    } else if (from && to) {
      const start = new Date(from);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(to);
      end.setUTCHours(23, 59, 59, 999);
      matchFilter.$or = [
        { date: { $gte: start, $lte: end } },
        { toDate: { $gte: start, $lte: end } },
        { date: { $lte: start }, toDate: { $gte: end } },
      ];
      const fmt = (str) => {
        try {
          const parts = str.split('-');
          if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        } catch {}
        return str;
      };
      periodLabel = `${fmt(from)} to ${fmt(to)}`;
    }

    const allEntries = await Japmala.find(matchFilter).populate('user', 'name username');
    const usersMap = {};
    allEntries.forEach((e) => {
      if (!e.user) return;
      const uId = e.user._id.toString();
      if (!usersMap[uId]) {
        usersMap[uId] = { name: e.user.name || e.user.username, rawEntries: [] };
      }
      usersMap[uId].rawEntries.push(e);
    });

    const report = Object.values(usersMap).map((u) => {
      const cleanEntries = deduplicateEntries(u.rawEntries);
      const total = cleanEntries.reduce((sum, e) => sum + e.count, 0);
      return { name: u.name, total };
    }).sort((a, b) => b.total - a.total);

    const grandTotal = report.reduce((sum, r) => sum + r.total, 0);

    let rows = '';
    report.forEach((r, i) => {
      rows += `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #2e3a52;color:#a0aec0;text-align:center;">${i + 1}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #2e3a52;color:#fff;">${r.name}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #2e3a52;color:#ffaa00;text-align:center;font-weight:700;">${r.total}</td>
        </tr>`;
    });

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Japmala Report</title>
<style>
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #0b0f19; color: #fff; margin: 0; padding: 30px; }
</style></head><body>
  <div style="max-width:700px;margin:0 auto;">
    <h1 style="color:#ff6b00;text-align:center;margin-bottom:4px;">📿 गुरुमंत्र जपानुष्ठान माळा नोंदणी</h1>
    <h2 style="color:#ffaa00;text-align:center;margin-top:0;">Japmala Report — ${periodLabel}</h2>
    <p style="text-align:center;color:#a0aec0;">संत समागम | Sant Samagam</p>
    <table style="width:100%;border-collapse:collapse;margin-top:20px;background:#151b2a;border-radius:12px;overflow:hidden;">
      <thead>
        <tr style="background:#1c2438;">
          <th style="padding:12px 14px;color:#ff6b00;text-align:center;">क्र.</th>
          <th style="padding:12px 14px;color:#ff6b00;text-align:left;">नाव (Name)</th>
          <th style="padding:12px 14px;color:#ff6b00;text-align:center;">माळा (Count)</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="background:#1c2438;">
          <td colspan="2" style="padding:12px 14px;color:#ff6b00;font-weight:700;text-align:right;">एकूण (Grand Total):</td>
          <td style="padding:12px 14px;color:#10b981;font-weight:700;text-align:center;font-size:18px;">${grandTotal}</td>
        </tr>
      </tfoot>
    </table>
    <p style="text-align:center;color:#64748b;margin-top:20px;">🙏 जय सच्चिदानंद 🙏</p>
  </div>
</body></html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="Japmala_Report_${periodLabel.replace(/\s/g, '_')}.html"`);
    res.send(html);
  } catch (error) {
    console.error('Japmala export error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error exporting report.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// PUT /api/japmala/:id — Edit an entry (Daily or Range)
// ═══════════════════════════════════════════════════════
router.put('/:id', auth, async (req, res) => {
  try {
    const { count, note, date, toDate, entryType } = req.body;
    const entry = await Japmala.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found.' });
    }

    const isAdmin = req.user.role === 'Admin';
    if (!isAdmin && entry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this entry.' });
    }

    let effectiveDate = entry.date;
    if (date) {
      const d = new Date(date);
      d.setUTCHours(0, 0, 0, 0);
      effectiveDate = d;
      entry.date = d;
    }

    const effectiveEntryType = entryType || entry.entryType;

    // Validation on PUT:
    if (effectiveEntryType === 'daily' && (!toDate || toDate === null)) {
      const existingRange = await Japmala.findOne({
        _id: { $ne: entry._id },
        user: entry.user,
        entryType: 'range',
        date: { $lte: effectiveDate },
        toDate: { $gte: effectiveDate },
      });
      if (existingRange) {
        return res.status(400).json({
          success: false,
          message: `Validation Error: This date falls inside an existing Date Range (${formatDateDisplay(existingRange.date)} to ${formatDateDisplay(existingRange.toDate)}).`,
        });
      }
    }

    if (count != null) entry.count = Number(count);
    if (note != null) entry.note = note;

    if (toDate !== undefined) {
      if (toDate) {
        const td = new Date(toDate);
        td.setUTCHours(0, 0, 0, 0);
        entry.toDate = td;
        entry.entryType = 'range';
      } else {
        entry.toDate = null;
        entry.entryType = 'daily';
      }
    }
    if (entryType) {
      entry.entryType = entryType;
    }

    await entry.save();

    res.status(200).json({
      success: true,
      message: 'Entry updated successfully!',
      entry,
    });
  } catch (error) {
    console.error('Japmala update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating entry.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// DELETE /api/japmala/:id — Delete an entry
// ═══════════════════════════════════════════════════════
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await Japmala.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found.' });
    }

    const isAdmin = req.user.role === 'Admin';
    if (!isAdmin && entry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this entry.' });
    }

    await entry.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Entry deleted successfully!',
    });
  } catch (error) {
    console.error('Japmala delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting entry.',
    });
  }
});

module.exports = router;
