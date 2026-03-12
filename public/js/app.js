const API_URL = window.location.origin + '/api';

// --- UTILITIES ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span style="font-size:1.2rem">${type === 'success' ? '✓' : '✗'}</span> ${message}`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- AUTHENTICATION ---
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg_name').value;
    const email = document.getElementById('reg_email').value;
    const password = document.getElementById('reg_password').value;
    const role = document.getElementById('reg_role').value;

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        showToast(data.message, 'success');

        if (data.otp) {
            console.log(`%c[TESTING] Your OTP is: ${data.otp}`, 'color: #ec4899; font-size: 16px; font-weight: bold;');
        }

        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('verifyForm').classList.remove('hidden');
        document.getElementById('verify_email').value = email;

    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleVerify(e) {
    e.preventDefault();
    const email = document.getElementById('verify_email').value;
    const otp = document.getElementById('verify_otp').value;

    try {
        const res = await fetch(`${API_URL}/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        showToast(data.message, 'success');
        document.getElementById('verifyForm').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');

    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleResendOTP(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('verify_email').value;

    if (!email) {
        showToast('No email found to resend OTP to. Please register again.', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/auth/resend-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        showToast(data.message, 'success');

        if (data.otp) {
            console.log(`%c[TESTING] Your new OTP is: ${data.otp}`, 'color: #ec4899; font-size: 16px; font-weight: bold;');
        }

    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('log_email').value;
    const password = document.getElementById('log_password').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        // Save to local storage
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('name', data.name);

        showToast('Login successful!', 'success');

        // Redirect logic
        setTimeout(() => {
            if (data.role === 'admin') {
                window.location.href = '/dashboard.html';
            } else {
                window.location.href = '/index.html';
            }
        }, 1000);

    } catch (error) {
        showToast(error.message, 'error');
    }
}

function logout() {
    localStorage.clear();
    window.location.href = '/index.html';
}

function openProfileModal() {
    const name = localStorage.getItem('name');
    const email = localStorage.getItem('email') || '';

    // Extract roll number from email (e.g. 123456@nitkkr.ac.in -> 123456)
    const rollMatch = email.match(/^(\d+)/);
    const roll = rollMatch ? rollMatch[1] : 'N/A';

    document.getElementById('profile-name').innerText = name;
    document.getElementById('profile-roll').innerText = roll;

    // The skips and dues are already tracked in fetchLedger and placed in the DOM.
    // We can pull them directly from the UI or localStorage if we saved them, or just default to 0 and let fetchLedger update them if we structure it right.
    // For now, let's grab the text from the reward progress text if it exists.
    const progressText = document.getElementById('reward-progress-text');
    let skipsStr = "0";
    if (progressText) {
        // e.g. "2 / 3 Skips" -> "2"
        const match = progressText.innerText.match(/(\d+)/);
        if (match) skipsStr = match[1];
    }

    document.getElementById('profile-skips').innerText = skipsStr;

    // We can read Guest Dues from the ledger details string
    const detailsVal = document.getElementById('live-ledger-details');
    let duesStr = "Rs. 0";
    if (detailsVal && detailsVal.innerText.includes('Guest Passes:')) {
        const parts = detailsVal.innerText.split('Guest Passes:');
        duesStr = parts[1].trim().replace('-', '');
    }
    document.getElementById('profile-dues').innerText = duesStr;

    document.getElementById('profile-modal').classList.remove('hidden');
}

let activeAdminStudentSearchId = null;

async function searchStudentAdmin(e) {
    e.preventDefault();
    const rollNumber = document.getElementById('admin_search_roll').value.trim();
    if (!rollNumber) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/admin/student/search?rollNumber=${rollNumber}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        // Populate Result UI
        const student = data.student;
        activeAdminStudentSearchId = student._id;

        document.getElementById('admin_res_name').innerText = student.name;
        document.getElementById('admin_res_email').innerText = student.email;
        document.getElementById('admin_res_balance').innerText = `Rs. ${student.currentBalance || 0}`;
        document.getElementById('admin_res_skips').innerText = student.skippedMeals || 0;
        document.getElementById('admin_res_rebates').innerText = student.approvedRebates || 0;
        document.getElementById('admin_res_dues').innerText = `Rs. ${student.guestDues || 0}`;

        document.getElementById('admin-student-result').classList.remove('hidden');

    } catch (error) {
        showToast(error.message, 'error');
        document.getElementById('admin-student-result').classList.add('hidden');
        activeAdminStudentSearchId = null;
    }
}

async function adminDeleteStudent() {
    if (!activeAdminStudentSearchId) return;

    // Explicit double confirmation box for admin
    const rollNumber = document.getElementById('admin_search_roll').value.trim();
    const confirmed1 = confirm(`WARNING: You are about to irrevocably delete the student account for roll number ${rollNumber}. Are you sure?`);
    if (!confirmed1) return;

    const confirmed2 = confirm(`FINAL WARNING: This will also delete all of ${rollNumber}'s rebates and history. Type 'DELETE' to confirm.`);
    if (confirmed2 !== 'DELETE' && confirmed2 !== 'delete') {
        showToast('Deletion cancelled.', 'info');
        return;
    }

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/admin/student/${activeAdminStudentSearchId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        showToast(data.message, 'success');

        // Reset Search UI
        document.getElementById('form-search-student').reset();
        document.getElementById('admin-student-result').classList.add('hidden');
        activeAdminStudentSearchId = null;

    } catch (error) {
        showToast(error.message, 'error');
    }
}

// --- APP INIT AND PAGE ROUTING ---
document.addEventListener('DOMContentLoaded', () => {
    // Check Auth State
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');
    const path = window.location.pathname;

    const authSection = document.getElementById('auth-section');
    const mainSection = document.getElementById('main-section');
    const userNameSpan = document.getElementById('user-name-display');

    if (userNameSpan && name) userNameSpan.textContent = name;

    if (path.includes('dashboard.html') && role !== 'admin') {
        window.location.href = '/index.html';
        return;
    }

    if (token && role === 'student' && path === '/' || token && role === 'student' && path.includes('index.html')) {
        if (authSection) authSection.classList.add('hidden');
        if (mainSection) {
            mainSection.classList.remove('hidden');
            const logoutBtn = document.getElementById('logout-btn');
            const profileBtn = document.getElementById('profile-btn');
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (profileBtn) profileBtn.style.display = 'block';
            fetchTodayMeals();
            fetchActivePoll();
            fetchLiveCrowd();
            fetchStudentQR(); // Draw their personalized QR
            fetchStudentAnalytics(); // Render Heatmap and Eco Footprint
            // Start polling for live crowd every 60 seconds
            setInterval(fetchLiveCrowd, 60000);
        }

    } else if (token && role === 'admin' && path === '/' || token && role === 'admin' && path.includes('index.html')) {
        window.location.href = '/dashboard.html';
        return;
    }

    // Attach form listeners
    const elLogin = document.getElementById('form-login');
    const elRegister = document.getElementById('form-register');
    const elVerify = document.getElementById('form-verify');

    if (elLogin) elLogin.addEventListener('submit', handleLogin);
    if (elRegister) elRegister.addEventListener('submit', handleRegister);
    if (elVerify) elVerify.addEventListener('submit', handleVerify);
});

// --- TOGGLE AUTH VIEWS ---
function toggleAuthView(viewId) {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('verifyForm').classList.add('hidden');
    document.getElementById(viewId).classList.remove('hidden');
}

// --- FETCH DATA FOR STUDENT ---
async function fetchLiveCrowd() {
    const crowdDisplay = document.getElementById('live-crowd-count');
    if (!crowdDisplay) return; // Only process if the element exists on the page

    try {
        const res = await fetch(`${API_URL}/engagement/crowd`);
        const data = await res.json();
        if (res.ok) {
            crowdDisplay.innerText = data.crowdCount || 0;
            // Add a little animation effect on update
            crowdDisplay.style.transform = 'scale(1.2)';
            setTimeout(() => crowdDisplay.style.transform = 'scale(1)', 300);
        }
    } catch (err) {
        console.error("Failed to fetch live crowd:", err);
    }
}

async function fetchStudentQR() {
    const token = localStorage.getItem('token');
    const miniCanvas = document.getElementById('mini-qr-canvas');
    const largeCanvas = document.getElementById('large-qr-canvas');

    if (!miniCanvas || !largeCanvas || !token) return;

    try {
        const res = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok && data.user) {
            const studentId = data.user._id;

            // Draw Mini Canvas
            QRCode.toCanvas(miniCanvas, studentId, { width: 60, margin: 1 }, function (error) {
                if (error) console.error(error);
            });

            // Draw Large Canvas            // Draw Large Canvas
            QRCode.toCanvas(largeCanvas, studentId, { width: 300 }, function (error) {
                if (error) console.error(error);
            });
        }
    } catch (err) {
        console.error("Failed to fetch student QR:", err);
    }
}

async function fetchStudentAnalytics() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/engagement/student-analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok && data.analytics) {
            // Render Eco-Footprint
            if (document.getElementById('eco-saved-kg')) {
                document.getElementById('eco-saved-kg').innerText = data.analytics.ecoFootprint.savedKg;
                document.getElementById('eco-impact-msg').innerText = data.analytics.ecoFootprint.impactMessage;
            }

            // Render Heatmap
            const heatmapContainer = document.getElementById('attendance-heatmap');
            if (heatmapContainer && data.analytics.heatmap) {
                let html = '';
                const heatmapData = data.analytics.heatmap;

                heatmapData.forEach(day => {
                    let color = 'rgba(255, 255, 255, 0.1)'; // default unknown
                    let title = `${new Date(day.date).toLocaleDateString()} - No Data`;

                    if (day.status === 'attended') {
                        color = 'rgba(16, 185, 129, 0.8)'; // Green
                        title = `${new Date(day.date).toLocaleDateString()} - Attended`;
                    } else if (day.status === 'skipped') {
                        color = 'rgba(239, 68, 68, 0.8)'; // Red
                        title = `${new Date(day.date).toLocaleDateString()} - Skipped`;
                    }

                    html += `<div title="${title}" style="width: 20px; height: 20px; background: ${color}; border-radius: 4px; transition: transform 0.2s; cursor: pointer;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'"></div>`;
                });

                heatmapContainer.innerHTML = html;
            }
        }
    } catch (err) {
        console.error("Failed to fetch student analytics:", err);
    }
}

// --- FETCH DATA FOR ADMIN ---
async function fetchTodayMeals() {
    const token = localStorage.getItem('token');
    const mealContainer = document.getElementById('meals-container');
    const tomorrowMealContainer = document.getElementById('tomorrow-meals-container');

    try {
        // Fetch Live Ledger Stats in parallel
        fetchLedger();

        const res = await fetch(`${API_URL}/menu/today`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        if (!data.meals || data.meals.length === 0) {
            mealContainer.innerHTML = '<div class="glass-panel" style="grid-column: span 3;"><p class="text-center">No meals scheduled for today yet.</p></div>';
            if (tomorrowMealContainer) tomorrowMealContainer.innerHTML = '<div class="glass-panel" style="grid-column: span 3;"><p class="text-center">No meals scheduled for tomorrow yet.</p></div>';
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let todayHtml = '';
        let tomorrowHtml = '';

        data.meals.forEach(meal => {
            const itemsHtml = meal.menuItems.map(item => `<li>${item}</li>`).join('');

            // Check RSVP Logic
            const userId = parseJwt(token).id;
            const isAttending = meal.attendingStudents.includes(userId);
            const isSkipping = meal.skippedStudents.includes(userId);

            // Generate Buttons depending on status
            let btnHtml = '';

            // Check if meal time has passed to replace RSVP with Rating
            const now = new Date();
            const mealTime = new Date(meal.date);

            // Set explicit end-times based on meal type so they don't default to midnight
            // Assuming 1hr meals: Breakfast 8-9AM, Lunch 1-2PM, Dinner 8-9PM
            if (meal.type === 'Breakfast') {
                mealTime.setHours(9, 0, 0, 0); // Breakfast ends at 9:00 AM
            } else if (meal.type === 'Lunch') {
                mealTime.setHours(14, 0, 0, 0); // Lunch ends at 2:00 PM (14:00)
            } else if (meal.type === 'Dinner') {
                mealTime.setHours(21, 0, 0, 0); // Dinner ends at 9:00 PM (21:00)
            }

            const mealStartTime = new Date(meal.date);
            if (meal.type === 'Breakfast') mealStartTime.setHours(8, 0, 0, 0);
            else if (meal.type === 'Lunch') mealStartTime.setHours(13, 0, 0, 0);
            else if (meal.type === 'Dinner') mealStartTime.setHours(20, 0, 0, 0);

            const hoursUntilStart = (mealStartTime - now) / (1000 * 60 * 60);
            const isRsvpLocked = (hoursUntilStart < 3 && now < mealStartTime) || meal.isRsvpLocked;

            if (mealTime < now) {
                btnHtml = `
                    <div style="display:flex; justify-content:center; margin-top:15px;">
                        <button class="btn-primary" style="width:100%; font-size: 0.9rem;" onclick="openRateModal('${meal._id}')">⭐️ Rate Meal</button>
                    </div>
                `;
            } else if (isRsvpLocked) {
                const statusText = isAttending ? "✓ Attending" : (isSkipping ? "✗ Skipping" : "No RSVP");
                const color = isAttending ? "var(--secondary)" : (isSkipping ? "var(--danger)" : "var(--text-muted)");
                btnHtml = `
                    <div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">
                        <button class="btn-primary" style="width:100%; background: ${color}; cursor: default;">${statusText} (Locked)</button>
                        <button class="btn-primary" style="width:100%; font-size: 0.8rem; background: rgba(255,255,255,0.1); border: 1px solid var(--accent); color: white;" onclick="buyGuestPass('${meal._id}')">🎟️ Guest Pass (Rs.100)</button>
                    </div>
                `;
            } else if (isAttending) {
                btnHtml = `
                    <div style="display:flex; gap:10px; margin-top:15px; flex-direction:column;">
                        <div style="display:flex; gap:10px;">
                            <button class="btn-primary" style="flex:1; background: var(--secondary); cursor: default;">✓ Attending</button>
                            <button class="btn-secondary" style="flex:1;" onclick="toggleRsvp('${meal._id}', 'Skipping')">Change to Skip</button>
                        </div>
                        <button class="btn-primary" style="width:100%; font-size: 0.8rem; background: rgba(255,255,255,0.1); border: 1px solid var(--accent); color: white;" onclick="buyGuestPass('${meal._id}')">🎟️ Guest Pass (Rs.100)</button>
                    </div>
                `;
            } else if (isSkipping) {
                btnHtml = `
                    <div style="display:flex; gap:10px; margin-top:15px; flex-direction:column;">
                        <div style="display:flex; gap:10px;">
                            <button class="btn-secondary" style="flex:1;" onclick="toggleRsvp('${meal._id}', 'Attending')">Change to Attend</button>
                            <button class="btn-primary" style="flex:1; background: var(--danger); cursor: default;">✗ Skipping</button>
                        </div>
                        <button class="btn-primary" style="width:100%; font-size: 0.8rem; background: rgba(255,255,255,0.1); border: 1px solid var(--accent); color: white;" onclick="buyGuestPass('${meal._id}')">🎟️ Guest Pass (Rs.100)</button>
                    </div>
                `;
            } else {
                btnHtml = `
                    <div style="display:flex; gap:10px; margin-top:15px; flex-direction:column;">
                        <div style="display:flex; gap:10px;">
                            <button class="btn-secondary" style="flex:1; border-color: var(--secondary); color: var(--secondary);" onclick="toggleRsvp('${meal._id}', 'Attending')">Attend</button>
                            <button class="btn-secondary" style="flex:1; border-color: var(--danger); color: var(--danger);" onclick="toggleRsvp('${meal._id}', 'Skipping')">Skip</button>
                        </div>
                        <button class="btn-primary" style="width:100%; font-size: 0.8rem; background: rgba(255,255,255,0.1); border: 1px solid var(--accent); color: white;" onclick="buyGuestPass('${meal._id}')">🎟️ Guest Pass (Rs.100)</button>
                    </div>
                `;
            }

            const card = `
                <div class="glass-panel meal-card" style="display: flex; flex-direction: column;">
                    <div class="meal-type-tag" style="color: var(--${meal.type === 'Breakfast' ? 'accent' : meal.type === 'Lunch' ? 'secondary' : 'primary'}); border: 1px solid currentColor;">
                        ${meal.type}
                    </div>
                    <h3>${meal.type}</h3>
                    <ul class="meal-items" style="flex: 1;">${itemsHtml}</ul>
                    ${btnHtml}
                </div>
            `;

            const mealDate = new Date(meal.date);
            mealDate.setHours(0, 0, 0, 0);

            if (mealDate.getTime() === today.getTime()) {
                todayHtml += card;
            } else {
                tomorrowHtml += card;
            }
        });

        mealContainer.innerHTML = todayHtml || '<div class="glass-panel" style="grid-column: span 3;"><p class="text-center">No meals found for today.</p></div>';
        if (tomorrowMealContainer) tomorrowMealContainer.innerHTML = tomorrowHtml || '<div class="glass-panel" style="grid-column: span 3;"><p class="text-center">No meals found for tomorrow.</p></div>';

    } catch (error) {
        showToast(error.message, 'error');
        if (error.message.includes('Not authorized') || error.message.includes('malformed')) logout();
    }
}

// Helper to decode JWT to get User ID
function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return {};
    }
}

// --- RSVP HANDLING ---
async function toggleRsvp(mealId, status) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/rsvp/${mealId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        showToast(data.message, 'success');
        fetchTodayMeals(); // Refresh UI

    } catch (error) {
        showToast(error.message, 'error');
    }
}

// --- BILLING / LEDGER ---
async function fetchLedger() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/billing/ledger`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok && data.ledger) {
            document.getElementById('live-ledger-total').innerText = `Rs. ${data.ledger.currentBalance}`;
            document.getElementById('live-ledger-details').innerText = `Est. Month-End Bill: Rs. ${data.ledger.totalBill} | Rebated: ${data.ledger.rebatedDays} days | Guest: -Rs. ${data.ledger.guestDues}`;

            // Update Reward Progress Bar
            const skipped = data.ledger.skippedMeals || 0;
            const progressPct = (skipped / 2) * 100; // REWARD LOGIC: Changed to 2
            const progressBar = document.getElementById('reward-progress-bar');
            const progressText = document.getElementById('reward-progress-text');
            const claimBtn = document.getElementById('btn-claim-reward');

            if (progressBar && progressText) {
                progressBar.style.width = `${progressPct}%`;
                progressText.innerText = `${skipped} / 2 Skips`; // CHANGED TO 2
            }

            if (claimBtn) {
                if (data.ledger.generatedRewards > 0) {
                    claimBtn.style.display = 'block';
                    claimBtn.innerText = `🎁 Show Active Reward QR`;
                } else if (data.ledger.rewardsAvailableToClaim > 0) {
                    claimBtn.style.display = 'block';
                    claimBtn.innerText = `🎁 Claim QR Code (${data.ledger.rewardsAvailableToClaim} Available)`;
                } else {
                    claimBtn.style.display = 'none';
                }
            }

            // Update Rebate Limit Text
            const rebateLimitText = document.getElementById('rebate-limit-text');
            if (rebateLimitText) {
                const filed = data.ledger.totalFiledRebateDays || 0;
                rebateLimitText.innerText = `You have filed ${filed} / 10 rebate days this month.`;
                if (filed >= 10) rebateLimitText.style.color = 'var(--danger)';
            }
        }
    } catch (error) {
        console.error("Failed to fetch ledger", error);
    }
}

// --- REBATE SUBMISSION ---
async function handleRebate(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const startDate = document.getElementById('rebate_start').value;
    const endDate = document.getElementById('rebate_end').value;
    const phone = document.getElementById('rebate_phone').value;
    const reason = document.getElementById('rebate_reason').value;

    try {
        const res = await fetch(`${API_URL}/billing/rebate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ startDate, endDate, phone, reason })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        showToast(data.message, 'success'); // Usually "Pending admin approval"
        document.getElementById('form-rebate').reset();
        fetchLedger(); // Refresh bill
        if (typeof fetchMyRebates === 'function') fetchMyRebates(); // Refresh My Rebates

    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function claimReward() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/billing/claim-reward`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        // Show QR Modal
        const modal = document.getElementById('qr-modal');
        const display = document.getElementById('qr-code-display');
        if (modal && display) {
            QRCode.toCanvas(display, data.qrData, { width: 250, margin: 2 }, function (error) {
                if (error) console.error(error);
            });
            modal.classList.remove('hidden');
        }

        showToast(data.message || 'Reward Claimed Successfully!', 'success');
        fetchLedger(); // Refresh UI to update skip and reward counts

    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function buyGuestPass(mealId) {
    if (!confirm("Are you sure you want to buy a Guest Pass for Rs. 100? This will be deducted from your current balance.")) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/billing/guest-pass`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        // Show QR Modal
        const modal = document.getElementById('qr-modal');
        const display = document.getElementById('qr-code-display');

        if (modal && display) {
            // Change text temporarily to indicate it's a guest pass, not a reward
            modal.querySelector('h2').innerText = "Guest Pass Generated!";
            modal.querySelector('p').innerText = "Show this QR code to the mess staff to allow your guest entry.";

            QRCode.toCanvas(display, data.qrData, { width: 250, margin: 2 }, function (error) {
                if (error) console.error(error);
            });
            modal.classList.remove('hidden');
        }

        showToast('Guest Pass Generated', 'success');
        fetchLedger(); // Refresh bill to show the +100 addition

    } catch (error) {
        showToast(error.message, 'error');
    }
}

// --- ADMIN UPLOAD ---
async function handleWeeklyUpload(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const startDate = document.getElementById('upload_date').value;

    // Helper to get array from input
    const getItems = (id) => {
        const val = document.getElementById(id).value;
        return val ? val.split(',').map(i => i.trim()).filter(i => i) : [];
    };

    try {
        const menuData = {
            monday: {
                breakfast: getItems('mon_b'),
                lunch: getItems('mon_l'),
                dinner: getItems('mon_d')
            },
            tuesday: {
                breakfast: getItems('tue_b'),
                lunch: getItems('tue_l'),
                dinner: getItems('tue_d')
            },
            wednesday: {
                breakfast: getItems('wed_b'),
                lunch: getItems('wed_l'),
                dinner: getItems('wed_d')
            },
            thursday: {
                breakfast: getItems('thu_b'),
                lunch: getItems('thu_l'),
                dinner: getItems('thu_d')
            },
            friday: {
                breakfast: getItems('fri_b'),
                lunch: getItems('fri_l'),
                dinner: getItems('fri_d')
            },
            saturday: {
                breakfast: getItems('sat_b'),
                lunch: getItems('sat_l'),
                dinner: getItems('sat_d')
            },
            sunday: {
                breakfast: getItems('sun_b'),
                lunch: getItems('sun_l'),
                dinner: getItems('sun_d')
            }
        };

        const res = await fetch(`${API_URL}/menu/upload-week`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ startDate, menuData })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        showToast(data.message, 'success');
        document.getElementById('form-upload-menu').reset();

    } catch (error) {
        showToast(error.message, 'error');
    }
}

// --- ADMIN REBATES ---
async function fetchPendingRebates() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('rebates-container');
    const countBadge = document.getElementById('pending-rebates-count');

    if (!container) return; // Not on dashboard

    try {
        const res = await fetch(`${API_URL}/billing/admin/rebates`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        const rebates = data.rebates || [];
        if (countBadge) countBadge.innerText = rebates.length;

        if (rebates.length === 0) {
            container.innerHTML = '<p class="text-muted text-center" style="margin-top: 20px;">No pending rebate applications.</p>';
            return;
        }

        let html = '';
        rebates.forEach(r => {
            const start = new Date(r.startDate).toLocaleDateString();
            const end = new Date(r.endDate).toLocaleDateString();
            html += `
                <div class="glass-panel mb-3" style="padding: 15px; border-left: 4px solid var(--accent);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <h3 style="margin: 0; font-size: 1.1rem;">${r.user ? r.user.name : 'Deleted User'}</h3>
                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px;">${r.user ? r.user.email : 'No Email'} | 📞 ${r.phone}</div>
                            <div style="font-size: 0.9rem; font-weight: bold;">${start} to ${end}</div>
                            <div style="font-size: 0.9rem; margin-top: 5px; color: var(--text-muted);"><em>"${r.reason}"</em></div>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            ${r.status === 'pending' ? `
                                <button class="btn-primary" style="padding: 5px 15px; font-size: 0.8rem; background: var(--secondary);" onclick="resolveRebate('${r._id}', 'approved')">Approve</button>
                                <button class="btn-primary" style="padding: 5px 15px; font-size: 0.8rem; background: var(--danger);" onclick="resolveRebate('${r._id}', 'rejected')">Reject</button>
                            ` : `
                                <span style="background: ${r.status === 'approved' ? 'var(--secondary)' : 'var(--danger)'}; color: white; padding: 5px 10px; border-radius: 5px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase;">
                                    ${r.status}
                                </span>
                            `}
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function fetchMyRebates() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('my-rebates-container');
    const banner = document.getElementById('today-rebate-banner');

    if (!container) return; // Exit if not on myrebates.html

    try {
        const res = await fetch(`${API_URL}/billing/myrebates`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        const rebates = data.rebates || [];
        if (rebates.length === 0) {
            container.innerHTML = '<p class="text-muted">You haven\'t filed any rebates yet.</p>';
            if (banner) banner.innerText = "You have no approved rebates for today.";
            return;
        }

        let html = '';
        let isTodayRebated = false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        rebates.forEach(r => {
            const startRaw = new Date(r.startDate);
            const endRaw = new Date(r.endDate);
            const start = startRaw.toLocaleDateString();
            const end = endRaw.toLocaleDateString();

            let statusColor = "var(--text-muted)";
            if (r.status === 'approved') {
                statusColor = "var(--secondary)";
                // Check if today falls in an approved rebate
                startRaw.setHours(0, 0, 0, 0);
                endRaw.setHours(23, 59, 59, 999);
                if (today >= startRaw && today <= endRaw) {
                    isTodayRebated = true;
                }
            }
            if (r.status === 'rejected') statusColor = "var(--danger)";
            if (r.status === 'pending') statusColor = "var(--accent)";

            html += `
                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <div>
                            <strong style="color: var(--primary); font-size: 1.1rem;">${start} - ${end}</strong>
                        </div>
                        <span style="background: ${statusColor}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase;">
                            ${r.status}
                        </span>
                    </div>
                    <p style="font-size: 0.9rem; margin-bottom: 5px; color: var(--text-main);"><strong>Reason:</strong> ${r.reason}</p>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">
                        Filed on: ${new Date(r.createdAt).toLocaleDateString()}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Update the Live Banner Status
        if (banner) {
            if (isTodayRebated) {
                banner.className = 'rebate-banner rebate-active';
                banner.innerHTML = "✅ <strong>Today is an approved Rebate day.</strong> You are not being charged for meals today.";
            } else {
                banner.className = 'rebate-banner rebate-inactive';
                banner.innerHTML = "ℹ️ <strong>Today is not an approved Rebate day.</strong> You will be billed for attended meals.";
            }
        }

    } catch (error) {
        console.error("Failed to fetch my rebates", error);
        container.innerHTML = `<p class="text-danger">Failed to load rebates: ${error.message}</p>`;
    }
}

async function resolveRebate(rebateId, status) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/billing/admin/rebate/${rebateId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        showToast(data.message, 'success');
        fetchPendingRebates(); // Refresh list

    } catch (error) {
        showToast(error.message, 'error');
    }
}

// --- POLLING & FEEDBACK ---
async function fetchActivePoll() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('live-polls-container');
    if (!container) return; // Check if on dashboard

    try {
        const res = await fetch(`${API_URL}/engagement/poll/active`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.polls || data.polls.length === 0) {
            container.innerHTML = '';
            return;
        }

        const userId = parseJwt(token).id;
        let finalHtml = '';

        data.polls.forEach(poll => {
            const hasVoted = poll.votedUsers.includes(userId);
            let totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
            if (totalVotes === 0) totalVotes = 1; // prevent div by zero

            let optionsHtml = '';
            poll.options.forEach(opt => {
                const perc = Math.round((opt.votes / totalVotes) * 100);

                if (hasVoted) {
                    optionsHtml += `
                        <div style="position: relative; background: rgba(255,255,255,0.05); border-radius: 8px; overflow: hidden; padding: 10px; border: 1px solid rgba(255,255,255,0.1);">
                            <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${perc}%; background: rgba(236, 72, 153, 0.2); z-index: 0;"></div>
                            <div style="position: relative; z-index: 1; display:flex; justify-content:space-between;">
                                <span>${opt.name}</span>
                                <span style="font-weight:bold; color: var(--accent);">${perc}%</span>
                            </div>
                        </div>
                    `;
                } else {
                    optionsHtml += `
                        <button class="btn-secondary" style="text-align: left; justify-content: space-between;" onclick="votePoll('${poll._id}', '${opt._id}')">
                            ${opt.name}
                        </button>
                    `;
                }
            });

            finalHtml += `
                <div class="glass-panel" style="border-left: 4px solid var(--accent); background: rgba(236, 72, 153, 0.05);">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <span style="background: var(--accent); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; margin-bottom: 5px; display: inline-block;">LIVE POLL</span>
                            <h3 style="margin: 0; color: var(--primary);">${poll.question}</h3>
                        </div>
                    </div>
                    <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 10px;">
                        ${optionsHtml}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 10px; text-align: right;">
                        Expires: ${new Date(poll.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            `;
        });

        container.innerHTML = finalHtml;

    } catch (error) {
        console.error('Failed to fetch active polls', error);
    }
}

async function votePoll(pollId, optionId) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/engagement/poll/${pollId}/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ optionId })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        showToast('Vote cast successfully!', 'success');
        fetchActivePoll(); // Re-render to show results

    } catch (error) {
        showToast(error.message, 'error');
    }
}

function openRateModal(mealId) {
    document.getElementById('feedback_meal_id').value = mealId;
    document.getElementById('feedback_comments').value = '';
    setRating(0); // Reset stars
    document.getElementById('feedback-modal').classList.remove('hidden');
}

function setRating(rating) {
    document.getElementById('feedback_rating').value = rating;
    const stars = document.querySelectorAll('#star-rating-container .star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.style.color = 'var(--accent)';
            star.style.textShadow = '0 0 10px rgba(236, 72, 153, 0.5)';
        } else {
            star.style.color = '#444';
            star.style.textShadow = 'none';
        }
    });
}

async function submitFeedback(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const mealId = document.getElementById('feedback_meal_id').value;
    const rating = document.getElementById('feedback_rating').value;
    const comments = document.getElementById('feedback_comments').value;

    if (!rating || rating === '0') {
        showToast('Please select a star rating.', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/engagement/feedback/${mealId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ rating, comments })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        showToast(data.message, 'success');
        document.getElementById('feedback-modal').classList.add('hidden');

    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleCreatePoll(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const question = document.getElementById('poll_question').value;
    const optionsRaw = document.getElementById('poll_options').value;
    const durationMins = document.getElementById('poll_duration').value;

    // Split by comma and trim
    const options = optionsRaw.split(',').map(opt => opt.trim()).filter(opt => opt);

    try {
        const res = await fetch(`${API_URL}/engagement/poll/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ question, options, durationMins })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        showToast(data.message, 'success');
        document.getElementById('form-create-poll').reset();

    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Call fetch on load if on dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        fetchPendingRebates();
        fetchCookSheet();
        fetchAnalytics();
        fetchAdminPolls();
    }
});

// --- ADMIN POLLS MANAGEMENT ---
async function fetchAdminPolls() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('admin-polls-container');
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/engagement/poll/admin/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        const polls = data.polls || [];
        if (polls.length === 0) {
            container.innerHTML = '<p class="text-muted">No polls found.</p>';
            return;
        }

        let html = '';
        polls.forEach(poll => {
            const isExpired = new Date(poll.expiresAt) < new Date();
            const statusLabel = isExpired
                ? `<span style="color: var(--danger); font-size: 0.8rem; font-weight: bold;">[EXPIRED]</span>`
                : `<span style="color: var(--secondary); font-size: 0.8rem; font-weight: bold;">[ACTIVE]</span>`;

            let optionsHtml = '';
            let totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
            if (totalVotes === 0) totalVotes = 1;

            poll.options.forEach(opt => {
                const perc = Math.round((opt.votes / totalVotes) * 100);
                optionsHtml += `
                    <div style="font-size: 0.85rem; display: flex; justify-content: space-between; margin-top: 5px;">
                        <span>${opt.name}</span>
                        <span style="font-weight: bold;">${opt.votes} (${perc}%)</span>
                    </div>
                `;
            });

            html += `
                <div style="border: 1px solid rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; background: rgba(0,0,0,0.2);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h4 style="margin: 0; color: var(--primary);">${poll.question} ${statusLabel}</h4>
                        <button class="btn-primary" style="background: var(--danger); padding: 4px 10px; font-size: 0.8rem;" onclick="deleteAdminPoll('${poll._id}')">Delete</button>
                    </div>
                    <div style="margin-top: 10px;">
                        ${optionsHtml}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 10px;">
                        Total Votes: ${poll.options.reduce((sum, opt) => sum + opt.votes, 0)} | 
                        Expires: ${new Date(poll.expiresAt).toLocaleString()}
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;

    } catch (error) {
        console.error("Failed to fetch admin polls", error);
        container.innerHTML = `<p class="text-danger">Failed to load polls</p>`;
    }
}

async function deleteAdminPoll(pollId) {
    if (!confirm("Are you sure you want to delete this poll?")) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/engagement/poll/${pollId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        showToast(data.message, 'success');
        fetchAdminPolls(); // Refresh list
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// --- ADMIN PHASE 4: COOK-SHEET & ANALYTICS ---

async function fetchCookSheet() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('cook-sheet-container');
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/admin/cook-sheet`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        const meals = data.cookSheet || [];
        if (meals.length === 0) {
            container.innerHTML = '<p class="text-muted">No upcoming meals found.</p>';
            return;
        }

        let html = '';
        meals.forEach(meal => {
            const dateStr = new Date(meal.date).toLocaleDateString();
            html += `
                <div style="display:flex; justify-content:space-between; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <div>
                        <strong>${meal.type} (${dateStr})</strong>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">${meal.name}</div>
                    </div>
                    <div style="font-weight: bold; color: var(--secondary); display:flex; align-items:center;">
                        🍽️ ${meal.headcount} Plates
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;

    } catch (error) {
        container.innerHTML = `<p class="text-danger">Failed to load cook-sheet</p>`;
    }
}

async function fetchAnalytics() {
    const token = localStorage.getItem('token');
    if (!document.getElementById('chartFoodWaste')) return;

    try {
        const res = await fetch(`${API_URL}/admin/analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        const { foodSavedTrend, moneySavedTrend, overallAvgRating } = data.analytics;
        const aiAlerts = data.analytics.aiAlerts || [];
        const top3Meals = data.analytics.top3Meals || [];
        const bottom3Meals = data.analytics.bottom3Meals || [];
        const dailyRatingsTrend = data.analytics.dailyRatingsTrend || [];

        // Render AI Alerts
        const aiContainer = document.getElementById('ai-alerts-container');
        if (aiContainer && aiAlerts.length > 0) {
            let alertHtml = '';
            aiAlerts.forEach(a => { alertHtml += `<div style="margin-bottom: 5px;">⚠️ ${a}</div>` });
            aiContainer.innerHTML = alertHtml;
        }

        // Render Top 3 Meals
        const topMealsContainer = document.getElementById('top-meals-container');
        if (topMealsContainer) {
            if (top3Meals.length === 0) {
                topMealsContainer.innerHTML = '<p class="text-muted text-center">No meals rated yet.</p>';
            } else {
                let html = '';
                top3Meals.forEach(m => {
                    html += `
                        <div style="display:flex; justify-content:space-between; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <div><strong>${m.type}</strong><br><span style="font-size: 0.8rem; color: var(--text-muted);">${m.name}</span></div>
                            <div style="color: var(--secondary); font-weight: bold; min-width: 40px; text-align:right;">⭐ ${m.avgRating}</div>
                        </div>
                    `;
                });
                topMealsContainer.innerHTML = html;
            }
        }

        // Render Bottom 3 (Bad) Meals
        const badMealsContainer = document.getElementById('bad-meals-container');
        if (badMealsContainer) {
            if (bottom3Meals.length === 0) {
                badMealsContainer.innerHTML = '<p class="text-success text-center">No poorly rated meals! Great job.</p>';
            } else {
                let html = '';
                bottom3Meals.forEach(m => {
                    html += `
                        <div style="display:flex; justify-content:space-between; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <div><strong>${m.type}</strong><br><span style="font-size: 0.8rem; color: var(--text-muted);">${m.name}</span></div>
                            <div style="color: var(--danger); font-weight: bold; min-width: 40px; text-align:right;">⭐ ${m.avgRating}</div>
                        </div>
                    `;
                });
                badMealsContainer.innerHTML = html;
            }
        }

        // Update Text Status
        document.getElementById('avg-rating-display').innerText = overallAvgRating;

        // --- Render Chart.js Graphs ---

        // Destroy old charts to prevent duplicate render artifacts
        Chart.helpers.each(Chart.instances, function (instance) {
            instance.destroy();
        });

        // 1. Food Saved Bar Chart
        new Chart(document.getElementById('chartFoodWaste'), {
            type: 'bar',
            data: {
                labels: foodSavedTrend.map(d => new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })),
                datasets: [{
                    label: 'Saved (kg)',
                    data: foodSavedTrend.map(d => d.savedKg),
                    backgroundColor: 'rgba(56, 189, 248, 0.6)',
                    borderColor: 'rgba(56, 189, 248, 1)',
                    borderWidth: 1
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
        });

        // 2. Money Saved Line Chart
        new Chart(document.getElementById('chartMoneySaved'), {
            type: 'line',
            data: {
                labels: moneySavedTrend.map(d => new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })),
                datasets: [{
                    label: 'Money Saved (Rs)',
                    data: moneySavedTrend.map(d => d.savedAmount),
                    borderColor: 'rgba(16, 185, 129, 1)',
                    tension: 0.3,
                    fill: true,
                    backgroundColor: 'rgba(16, 185, 129, 0.2)'
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
        });

        // 3. Average Meal Ratings Daily Trend Line Chart
        new Chart(document.getElementById('chartMealRatings'), {
            type: 'line',
            data: {
                labels: dailyRatingsTrend.map(d => new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })),
                datasets: [{
                    label: 'Avg Rating',
                    data: dailyRatingsTrend.map(d => d.avgRating),
                    borderColor: 'rgba(245, 158, 11, 1)', // Warning Yellow/Orange
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        min: 0
                    }
                },
                plugins: { legend: { display: false } }
            }
        });

    } catch (error) {
        console.error("Failed to load analytics", error);
    }
}

// Menu Modal Controls
function openMenuModal() {
    document.getElementById('menu-modal').classList.remove('hidden');
}

function closeMenuModal() {
    document.getElementById('menu-modal').classList.add('hidden');
}

// Generate PDF placeholder function
async function generatePDFBills() {
    if (!confirm("Are you sure you want to generate end-of-month PDF Bills and email them to ALL students?")) return;

    document.getElementById('btn-generate-bills').innerText = "⏳ Generating & Emailing... (Please Wait)";
    document.getElementById('btn-generate-bills').disabled = true;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/billing/admin/generate-invoices`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'Failed to generate PDF');
        }

        // Handle the PDF Blob response so the Browser downloads it automatically
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Master_Ledger_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showToast("PDF Ledgers Downloaded & Emailed Successfully!", "success");

    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        document.getElementById('btn-generate-bills').innerText = "📄 Generate & Email Bills (PDF)";
        document.getElementById('btn-generate-bills').disabled = false;
    }
}

// --- ADMIN ATTENDANCE & REWARDS ---
async function handleMarkAttendance(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const studentId = document.getElementById('attendance_student_id').value;

    try {
        const res = await fetch(`${API_URL}/admin/attendance/mark`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ studentId })
        });

        const rawText = await res.text();
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (err) {
            throw new Error(rawText.substring(0, 40) + "... (Tunnel or Network Error)");
        }

        if (!res.ok) throw new Error(data.message);

        let toastMsg = data.message;
        if (data.remarks && data.remarks.length > 0) {
            toastMsg += ` (${data.remarks.join(', ')})`;
        }

        showToast(toastMsg, 'success');
        document.getElementById('form-mark-attendance').reset();
        fetchCookSheet(); // Update headcount if applicable

    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleVerifyReward(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const payload = document.getElementById('reward_qr_payload').value;

    try {
        const res = await fetch(`${API_URL}/admin/reward/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ payload })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        showToast(data.message, 'success');
        document.getElementById('form-verify-reward').reset();

    } catch (error) {
        showToast(error.message, 'error');
    }
}

// --- HTML5 QR SCANNER LOGIC ---
let html5QrcodeScanner = null;
let lastScannedId = null;
let lastScanTime = 0;

function startQRScanner() {
    const readerElement = document.getElementById('reader');
    if (!readerElement) return;

    document.getElementById('btn-start-scanner').style.display = 'none';
    readerElement.style.display = 'block';
    document.getElementById('btn-stop-scanner').style.display = 'block';

    html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
    );

    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

function stopQRScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().then(() => {
            document.getElementById('reader').style.display = 'none';
            document.getElementById('btn-start-scanner').style.display = 'block';
            document.getElementById('btn-stop-scanner').style.display = 'none';
            html5QrcodeScanner = null;
            lastScannedId = null; // Reset debounce
        }).catch(err => {
            console.error("Failed to clear html5QrcodeScanner. ", err);
        });
    }
}

function onScanSuccess(decodedText, decodedResult) {
    const now = Date.now();

    // Simple debounce: Ignore same ID if scanned within last 3 seconds
    if (decodedText === lastScannedId && (now - lastScanTime) < 3000) {
        return;
    }

    lastScannedId = decodedText;
    lastScanTime = now;

    // We assume the QR simply contains the user's Object ID
    console.log(`[SCANNER] Read ID: ${decodedText}`);

    // Read the scanner mode dropdown
    const modeSelectElement = document.getElementById('scanner-mode');
    const scanMode = modeSelectElement ? modeSelectElement.value : 'attendance';

    if (scanMode === 'attendance') {
        const idInput = document.getElementById('attendance_student_id');
        if (idInput) {
            idInput.value = decodedText;

            // Flash the input to show it was populated
            idInput.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
            setTimeout(() => idInput.style.backgroundColor = '', 500);

            // Manually trigger the attendance POST function
            const mockEvent = { preventDefault: () => { } };
            handleMarkAttendance(mockEvent);
        }
    } else if (scanMode === 'reward') {
        const rewardInput = document.getElementById('reward_qr_payload');
        if (rewardInput) {
            rewardInput.value = decodedText;

            // Flash the input to show it was populated
            rewardInput.style.backgroundColor = 'rgba(236, 72, 153, 0.2)';
            setTimeout(() => rewardInput.style.backgroundColor = '', 500);

            // Manually trigger the verify reward POST function
            const mockEvent = { preventDefault: () => { } };
            handleVerifyReward(mockEvent);
        }
    }
}

function onScanFailure(error) {
    // Usually harmless background noise when no QR is in frame
    // console.warn(`Code scan error = ${error}`);
}
