// L'Afrique Medical Alert — Admin JavaScript

// Supabase Initialization
const supabaseUrl = 'VITE_SUPABASE_URL';
const supabaseKey = 'VITE_SUPABASE_ANON_KEY';
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Authentication Logic
const AUTH_CREDENTIALS = {
    username: 'ADMIN_USERNAME',
    password: 'ADMIN_PASSWORD'
};

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
            // Play a notification sound (optional)
        })
        .subscribe();

    // Still keep 30s polling as backup
    setInterval(fetchRequests, 30000);
}

// Login Form Handling
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');

    if (user === AUTH_CREDENTIALS.username && pass === AUTH_CREDENTIALS.password) {
        sessionStorage.setItem('adminAuthenticated', 'true');
        errorEl.style.display = 'none';
        showAdminContent();
    } else {
        errorEl.style.display = 'block';
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
