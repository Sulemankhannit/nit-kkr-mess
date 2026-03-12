const User = require('../models/User');
const Rebate = require('../models/Rebate');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const Meal = require('../models/Meal');

exports.getLedger = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        // 1. Fetch Approved and Pending Rebates for the user for filed days calculation
        const allRebatesThisMonth = await Rebate.find({
            user: userId,
            status: { $in: ['pending', 'approved'] }
        });

        const approvedRebates = allRebatesThisMonth.filter(r => r.status === 'approved');

        let totalFiledRebateDays = 0;
        allRebatesThisMonth.forEach(r => {
            totalFiledRebateDays += Math.ceil(Math.abs(r.endDate - r.startDate) / (1000 * 60 * 60 * 24)) + 1;
        });

        // 2. Fetch all meals the user is attending
        const mealsAttended = await Meal.find({ attendingStudents: userId });

        // Map meals to unique YYYY-MM-DD string dates to avoid counting Lunch and Dinner on the same day twice
        const attendedDatesSet = new Set();
        mealsAttended.forEach(meal => {
            const dateStr = new Date(meal.date).toISOString().split('T')[0];
            attendedDatesSet.add(dateStr);
        });

        // 3. Calculate how many of those unique dates fall under a rebate
        let billedDays = 0;
        let rebatedDays = 0;

        attendedDatesSet.forEach(dateStr => {
            const mealDate = new Date(dateStr);
            let isRebated = false;

            for (const rebate of approvedRebates) {
                const rStart = new Date(rebate.startDate);
                rStart.setHours(0, 0, 0, 0);
                const rEnd = new Date(rebate.endDate);
                rEnd.setHours(23, 59, 59, 999);

                // If the meal date falls within any approved rebate window
                if (mealDate >= rStart && mealDate <= rEnd) {
                    isRebated = true;
                    break;
                }
            }

            if (isRebated) {
                rebatedDays++;
            } else {
                billedDays++;
            }
        });

        // 4. Mathematical Deduction
        const baseFee = 4000;
        const dailyRate = 130;
        const attendedDeduction = billedDays * dailyRate;
        const guestDues = user.guestDues || 0;
        const totalExpenses = attendedDeduction + guestDues;

        // Final Prepaid Balance Formula: 4000 Advance - All Expenses
        const currentBalance = baseFee - totalExpenses;

        // Month End Payable: exactly the total expenses required to refill back to 4000.
        // If currentBalance < 0, the payable is still just `totalExpenses` (4000 + however much they went under).
        const monthEndPayable = totalExpenses;

        const rewardsAvailableToClaim = Math.floor((user.skippedMeals || 0) / 2); // REWARD LOGIC: Changed to 2
        const generatedRewards = user.rewardsAvailable || 0;

        res.status(200).json({
            ledger: {
                baseFee,
                billedDays,
                rebatedDays,
                totalFiledRebateDays,
                attendedDeduction,
                guestDues,
                rewardsAvailableToClaim,
                generatedRewards,
                skippedMeals: user.skippedMeals, // For the UI progress bar (x/5)
                currentBalance,      // What they have left of the 4000
                totalBill: monthEndPayable // What they will owe at month end
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.buyGuestPass = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Add Rs 100 to the guest dues
        user.guestDues = (user.guestDues || 0) + 100;
        await user.save();

        // Generate a random mocked QR payload
        const claimId = 'QR_GUEST_' + Math.random().toString(36).substring(2, 9).toUpperCase();

        res.status(200).json({
            message: 'Guest Pass purchased successfully! Rs. 100 deducted from your balance.',
            qrData: claimId
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.applyRebate = async (req, res) => {
    try {
        const { startDate, endDate, phone, reason } = req.body;
        const userId = req.user.id;

        if (!startDate || !endDate || !phone || !reason) {
            return res.status(400).json({ message: 'Please provide all field requirements (dates, phone, reason).' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end < start) return res.status(400).json({ message: 'End date cannot be before start date.' });

        // Ensure start date is strictly greater than today (you must apply at least one day in advance)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const rebateStartCheck = new Date(startDate);
        rebateStartCheck.setHours(0, 0, 0, 0);

        if (rebateStartCheck <= today) {
            return res.status(400).json({ message: 'Rebates must be filed at least 1 day in advance. You cannot file a rebate starting today or in the past.' });
        }

        const requestedDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;

        // Check 10 days limit
        const activeRebatesThisMonth = await Rebate.find({
            user: userId,
            status: { $in: ['pending', 'approved'] }
        });

        let currentUsedDays = 0;
        activeRebatesThisMonth.forEach(r => {
            currentUsedDays += Math.ceil(Math.abs(r.endDate - r.startDate) / (1000 * 60 * 60 * 24)) + 1;
        });

        if (currentUsedDays + requestedDays > 10) {
            return res.status(400).json({
                message: `Limit Exceeded. You have already filed or used ${currentUsedDays} days of rebate this month. You cannot exceed 10 days.`
            });
        }

        const rebate = new Rebate({
            user: userId,
            startDate: start,
            endDate: end,
            phone,
            reason,
            status: 'pending' // Admin must approve it now
        });

        await rebate.save();

        res.status(201).json({ message: 'Rebate application submitted! It is pending admin approval.', rebate });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getMyRebates = async (req, res) => {
    try {
        const userId = req.user.id;
        const rebates = await Rebate.find({ user: userId }).sort({ createdAt: -1 });
        res.status(200).json({ rebates });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Admin Endpoints
exports.getPendingRebates = async (req, res) => {
    try {
        const pending = await Rebate.find({}).sort({ createdAt: -1 }).populate('user', 'name email');

        // Filter out rebates belonging to deleted users (where user is null)
        const validPending = pending.filter(r => r.user != null);

        res.status(200).json({ rebates: validPending });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateRebateStatus = async (req, res) => {
    try {
        const { rebateId } = req.params;
        const { status } = req.body; // 'approved' or 'rejected'

        const rebate = await Rebate.findById(rebateId);
        if (!rebate) return res.status(404).json({ message: 'Rebate not found' });

        rebate.status = status;
        await rebate.save();

        res.status(200).json({ message: `Rebate successfully ${status}` });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Reward Claim logic
exports.claimReward = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        let message = '';

        // If they already have an unscanned reward, just show it
        if (user.rewardsAvailable > 0) {
            message = 'Displaying your active Reward QR. Show this to the mess staff.';
        } else {
            // They don't have an active reward, check if they can claim one
            const rewardsAvailableToBeClaimed = Math.floor((user.skippedMeals || 0) / 2);
            if (rewardsAvailableToBeClaimed < 1) {
                return res.status(400).json({ message: 'No rewards available to claim. You need at least 2 skips.' });
            }

            // Just show the QR code - do not deduct skips until the admin actually scans it.
            message = 'Displaying your active Reward QR. Show this to the mess staff to claim your reward (2 skips will be deducted upon scanning).';
        }

        const claimId = 'QR_REWARD_' + user._id.toString();

        res.status(200).json({
            message: message,
            qrData: claimId
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.generateInvoices = async (req, res) => {
    try {
        const students = await User.find({ role: 'student' });

        // Setup Nodemailer transporter reusing current env variables
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Create Master PDF for Admin Response
        const masterDoc = new PDFDocument();
        const buffers = [];
        masterDoc.on('data', buffers.push.bind(buffers));

        masterDoc.fontSize(20).text('NIT Kurukshetra Mess - Master Ledger', { align: 'center' });
        masterDoc.moveDown();
        masterDoc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`);
        masterDoc.moveDown();

        let totalRevenue = 0;

        for (const student of students) {
            // Find student's approved rebates
            const approvedRebates = await Rebate.find({ user: student._id, status: 'approved' });

            // Generate attended days logic
            const mealsAttended = await Meal.find({ attendingStudents: student._id });
            const attendedDatesSet = new Set();
            mealsAttended.forEach(m => {
                attendedDatesSet.add(new Date(m.date).toISOString().split('T')[0]);
            });

            let billedDays = 0;
            let rebatedDays = 0;

            attendedDatesSet.forEach(dateStr => {
                const mealDate = new Date(dateStr);
                let isRebated = false;
                for (const rebate of approvedRebates) {
                    const rStart = new Date(rebate.startDate);
                    rStart.setHours(0, 0, 0, 0);
                    const rEnd = new Date(rebate.endDate);
                    rEnd.setHours(23, 59, 59, 999);
                    if (mealDate >= rStart && mealDate <= rEnd) {
                        isRebated = true;
                        break;
                    }
                }
                if (isRebated) rebatedDays++;
                else billedDays++;
            });

            const baseFee = 4000;
            const dailyRate = 130;
            const attendedDeduction = billedDays * dailyRate;
            const guestDues = student.guestDues || 0;
            const totalExpenses = attendedDeduction + guestDues;

            const finalBalance = baseFee - totalExpenses;
            const payableAmount = totalExpenses; // Exactly what is needed to refill back to 4000
            totalRevenue += payableAmount;

            // 1. Generate Individual PDF buffer to email
            const studentDoc = new PDFDocument();
            const studentBuffers = [];
            studentDoc.on('data', studentBuffers.push.bind(studentBuffers));
            studentDoc.on('end', async () => {
                const pdfData = Buffer.concat(studentBuffers);
                try {
                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: student.email,
                        subject: 'NIT Kurukshetra Mess - Monthly Invoice',
                        text: `Hello ${student.name},\n\nPlease find attached your mess invoice for this month. Your total expenses are Rs. ${payableAmount}. Please pay this amount to restore your Rs. 4000 advance balance.\n\nRegards,\nMess Administration`,
                        attachments: [{ filename: `${student.name.replace(/\s+/g, '_')}_Invoice.pdf`, content: pdfData }]
                    });
                    console.log(`Invoice emailed to ${student.email}`);
                } catch (emailErr) {
                    console.error(`Failed to email invoice to ${student.email}:`, emailErr.message);
                }
            });

            // Fill individual PDF
            studentDoc.fontSize(18).text('NIT Kurukshetra Mess Invoice', { align: 'center' });
            studentDoc.moveDown();
            studentDoc.fontSize(12).text(`Student: ${student.name}`);
            studentDoc.text(`Email: ${student.email}`);
            studentDoc.moveDown();
            studentDoc.text(`Starting Advance: Rs. ${baseFee}`);
            studentDoc.text(`Billed Days (${billedDays} days @ Rs.130): -Rs. ${attendedDeduction}`);
            studentDoc.text(`Rebated/Waived Days: ${rebatedDays} days`);
            studentDoc.text(`Guest Passes: -Rs. ${guestDues}`);
            studentDoc.moveDown();
            studentDoc.fontSize(14).text(`Current Available Balance: Rs. ${finalBalance}`);
            studentDoc.fontSize(14).text(`Amount Due to Restore Advance: Rs. ${payableAmount}`, { underline: true });
            studentDoc.end();

            // 2. Append to Master PDF for Admin
            masterDoc.fontSize(14).text(`${student.name} (${student.email})`);
            masterDoc.fontSize(10).text(`Current Bal: Rs. ${finalBalance} | Owed: Rs. ${payableAmount} | Billed: -${attendedDeduction} | Guest: -${guestDues} | Rebated Days: ${rebatedDays}`);
            masterDoc.moveDown();
        }

        masterDoc.fontSize(16).text(`Total Expected Revenue (To Restore Advances): Rs. ${totalRevenue}`, { align: 'right' });

        masterDoc.on('end', () => {
            const masterPdfData = Buffer.concat(buffers);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Master_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);
            res.send(masterPdfData);
        });

        masterDoc.end();

    } catch (error) {
        console.error('Invoice generation error:', error);
        res.status(500).json({ message: 'Failed to generate invoices', error: error.message });
    }
};
