// L'Afrique Medical Alert — Admin JavaScript

// Supabase Initialization
const supabaseUrl = '[[SUPABASE_URL]]';
const supabaseKey = '[[SUPABASE_KEY]]';
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Authentication Logic
function checkAuth() {
    const session = sessionStorage.getItem('adminAuthenticated');
    if (session === 'true') {
        showAdminContent();
        return true;
    }
    return false;
}

function showAdminContent() {
    document.getElementById('loginOverlay').style.display = 'none';
    document.querySelector('.admin-container').style.display = 'flex';
    fetchRequests();
    
    // Supabase Realtime Subscription for live sync
    _supabase
        .channel('public:consultation_requests')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'consultation_requests' }, payload => {
            console.log('New request received!', payload.new);
            allRequests.unshift(payload.new);
            renderRequestsList(allRequests);
        })
        .subscribe();

    setInterval(fetchRequests, 30000);
}

// Login Form Handling
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    const errorEl = document.getElementById('loginError');
    const submitBtn = e.target.querySelector('button');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying...';

    try {
        const { data, error } = await _supabase
            .from('admins')
            .select('*')
            .eq('username', user)
            .eq('password', pass)
            .single();

        if (error || !data) {
            throw new Error('Invalid username or password');
        }

        sessionStorage.setItem('adminAuthenticated', 'true');
        errorEl.style.display = 'none';
        showAdminContent();
    } catch (err) {
        console.error('Login error:', err.message);
        errorEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
});

// Logout Handling
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('adminAuthenticated');
    window.location.reload();
});

let allRequests = [];
let selectedRequestId = null;

// DOM Elements
const requestsContainer = document.getElementById('requestsContainer');
const noSelection = document.getElementById('noSelection');
const selectionActive = document.getElementById('selectionActive');
const messageBox = document.getElementById('messageBox');
const requestSearch = document.getElementById('requestSearch');
const closeDetail = document.getElementById('closeDetail');
const contactWhatsApp = document.getElementById('contactWhatsApp');
const contactEmail = document.getElementById('contactEmail');

// Fetch Requests from Supabase
async function fetchRequests() {
    try {
        const { data, error } = await _supabase
            .from('consultation_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allRequests = data;
        renderRequestsList(allRequests);
    } catch (err) {
        console.error('Error fetching requests:', err.message);
        requestsContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: #e74c3c;">Error: ${err.message}</div>`;
    }
}

function renderRequestsList(requests) {
    if (requests.length === 0) {
        requestsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #777;">No requests found.</div>';
        return;
    }

    requestsContainer.innerHTML = requests.map(req => {
        const date = new Date(req.created_at);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const initials = (req.first_name[0] + req.last_name[0]).toUpperCase();
        const isActive = selectedRequestId === req.id ? 'active' : '';

        return `
            <div class="request-item ${isActive}" onclick="selectRequest(${req.id})">
                <div class="avatar">${initials}</div>
                <div class="item-info">
                    <div class="item-header">
                        <span class="item-name">${req.first_name} ${req.last_name}</span>
                        <span class="item-time">${timeStr}</span>
                    </div>
                    <div class="item-snippet">${req.service}: ${req.message || 'No message'}</div>
                </div>
            </div>
        `;
    }).join('');
}

window.selectRequest = function(id) {
    selectedRequestId = id;
    const req = allRequests.find(r => r.id === id);
    if (!req) return;

    // Update UI
    renderRequestsList(allRequests);
    noSelection.style.display = 'none';
    selectionActive.style.display = 'flex';
    if (window.innerWidth <= 768) {
        document.getElementById('detailView').classList.add('mobile-active');
    }

    const date = new Date(req.created_at).toLocaleString();

    messageBox.innerHTML = `
        <div class="message-info">Consultation Request Received: ${date}</div>
        
        <div class="message message-received">
            <div class="message-header">Patient Info</div>
            <strong>Name:</strong> ${req.first_name} ${req.last_name}<br>
            <strong>Email:</strong> ${req.email}<br>
            <strong>Phone:</strong> ${req.phone}
        </div>

        <div class="message message-received">
            <div class="message-header">Service Requested</div>
            ${req.service.toUpperCase()}
        </div>

        <div class="message message-received">
            <div class="message-header">Medical Concern / Message</div>
            ${req.message || '<i>No additional details provided.</i>'}
        </div>
    `;

    // Action Buttons
    contactWhatsApp.onclick = () => {
        const phone = req.phone.replace(/\D/g, '');
        const text = encodeURIComponent(`Hello ${req.first_name}, this is L'Afrique Medical Alert regarding your consultation request for ${req.service}.`);
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    };

    contactEmail.onclick = () => {
        const subject = encodeURIComponent(`Consultation Request - L'Afrique Medical Alert`);
        const body = encodeURIComponent(`Hello ${req.first_name},\n\nWe received your request for ${req.service}.`);
        window.location.href = `mailto:${req.email}?subject=${subject}&body=${body}`;
    };
};

requestSearch.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allRequests.filter(req => 
        req.first_name.toLowerCase().includes(term) || 
        req.last_name.toLowerCase().includes(term) || 
        req.email.toLowerCase().includes(term) ||
        req.phone.includes(term) ||
        req.service.toLowerCase().includes(term)
    );
    renderRequestsList(filtered);
});

closeDetail.onclick = () => {
    document.getElementById('detailView').classList.remove('mobile-active');
    noSelection.style.display = 'flex';
    selectionActive.style.display = 'none';
    selectedRequestId = null;
    renderRequestsList(allRequests);
};

// Check for session on load
checkAuth();
