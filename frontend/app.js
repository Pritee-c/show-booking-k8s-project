// Configuration
const API_BASE_URL = window.location.origin;
const API = {
    users: `${API_BASE_URL}/api/users`,
    events: `${API_BASE_URL}/api/events`,
    bookings: `${API_BASE_URL}/api/bookings`,
    cart: `${API_BASE_URL}/api/cart`
};

// State
let currentUser = null;
let events = [];
let cart = [];
let bookings = [];

// DOM Elements
const authSection = document.getElementById('authSection');
const eventsSection = document.getElementById('eventsSection');
const cartSection = document.getElementById('cartSection');
const bookingsSection = document.getElementById('bookingsSection');
const profileSection = document.getElementById('profileSection');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('grabshow_user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        showMainApp();
        loadEvents();
    } else {
        showAuthSection();
    }

    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Auth forms
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Navigation
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Checkout
    document.getElementById('checkoutBtn').addEventListener('click', handleCheckout);
}

// Auth Functions
async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
        const response = await fetch(`${API.users}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        if (response.ok) {
            const user = await response.json();
            showAlert('Registration successful! Please login.', 'success');
            document.getElementById('registerForm').reset();
        } else {
            const error = await response.json();
            showAlert(error.message || 'Registration failed', 'error');
        }
    } catch (error) {
        showAlert('Registration failed: ' + error.message, 'error');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;

    try {
        const response = await fetch(`${API.users}/${username}`);
        if (response.ok) {
            currentUser = await response.json();
            localStorage.setItem('grabshow_user', JSON.stringify(currentUser));
            showMainApp();
            loadEvents();
            showAlert('Login successful!', 'success');
        } else {
            showAlert('User not found', 'error');
        }
    } catch (error) {
        showAlert('Login failed: ' + error.message, 'error');
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('grabshow_user');
    cart = [];
    bookings = [];
    showAuthSection();
}

// Navigation
function handleNavigation(e) {
    e.preventDefault();
    const href = e.target.getAttribute('href');
    
    hideAllSections();
    
    if (href === '#events') {
        eventsSection.classList.remove('hidden');
        loadEvents();
    } else if (href === '#cart') {
        cartSection.classList.remove('hidden');
        loadCart();
    } else if (href === '#bookings') {
        bookingsSection.classList.remove('hidden');
        loadBookings();
    } else if (href === '#profile') {
        profileSection.classList.remove('hidden');
        showProfile();
    }
}

// Load Events
async function loadEvents() {
    try {
        const response = await fetch(API.events);
        events = await response.json();
        displayEvents();
    } catch (error) {
        showAlert('Failed to load events: ' + error.message, 'error');
    }
}

function displayEvents() {
    const eventsList = document.getElementById('eventsList');
    eventsList.innerHTML = '';

    events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        eventCard.innerHTML = `
            <span class="event-type">${event.type}</span>
            <h3>${event.title}</h3>
            <p>${event.description}</p>
            <p><strong>Venue:</strong> ${event.venue}</p>
            <p><strong>Date:</strong> ${new Date(event.eventDateTime).toLocaleString()}</p>
            <p><strong>Available Seats:</strong> ${event.availableSeats} / ${event.totalSeats}</p>
            <div class="event-price">₹${event.price}</div>
            <div class="event-actions">
                <input type="number" id="qty-${event.id}" min="1" max="${event.availableSeats}" value="1">
                <button onclick="addToCart(${event.id})">Add to Cart</button>
                <button onclick="bookNow(${event.id})">Book Now</button>
            </div>
        `;
        eventsList.appendChild(eventCard);
    });
}

// Cart Functions
async function addToCart(eventId) {
    const event = events.find(e => e.id === eventId);
    const quantity = parseInt(document.getElementById(`qty-${eventId}`).value);

    const cartItem = {
        userId: currentUser.id,
        eventId: event.id,
        quantity: quantity,
        price: event.price * quantity
    };

    try {
        const response = await fetch(API.cart, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cartItem)
        });

        if (response.ok) {
            showAlert(`Added ${quantity} ticket(s) to cart!`, 'success');
            updateCartCount();
        }
    } catch (error) {
        showAlert('Failed to add to cart: ' + error.message, 'error');
    }
}

async function loadCart() {
    try {
        const response = await fetch(`${API.cart}/user/${currentUser.id}`);
        cart = await response.json();
        displayCart();
    } catch (error) {
        showAlert('Failed to load cart: ' + error.message, 'error');
    }
}

async function displayCart() {
    const cartItems = document.getElementById('cartItems');
    cartItems.innerHTML = '';

    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty.</p>';
        return;
    }

    for (const item of cart) {
        const event = events.find(e => e.id === item.eventId) || await fetchEventById(item.eventId);
        const cartItemDiv = document.createElement('div');
        cartItemDiv.className = 'cart-item';
        cartItemDiv.innerHTML = `
            <div class="item-details">
                <h4>${event ? event.title : 'Unknown Event'}</h4>
                <p>Quantity: ${item.quantity}</p>
                <p>Price: ₹${item.price}</p>
            </div>
            <div class="item-actions">
                <button class="btn-secondary" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        `;
        cartItems.appendChild(cartItemDiv);
    }
}

async function removeFromCart(itemId) {
    try {
        await fetch(`${API.cart}/user/${currentUser.id}/item/${itemId}`, { method: 'DELETE' });
        showAlert('Item removed from cart', 'success');
        loadCart();
        updateCartCount();
    } catch (error) {
        showAlert('Failed to remove item: ' + error.message, 'error');
    }
}

async function handleCheckout() {
    if (cart.length === 0) {
        showAlert('Cart is empty', 'error');
        return;
    }

    for (const item of cart) {
        const booking = {
            userId: currentUser.id,
            eventId: item.eventId,
            numberOfSeats: item.quantity,
            totalPrice: item.price,
            status: 'CONFIRMED'
        };

        try {
            await fetch(API.bookings, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(booking)
            });
        } catch (error) {
            console.error('Booking failed:', error);
        }
    }

    // Clear cart
    await fetch(`${API.cart}/user/${currentUser.id}`, { method: 'DELETE' });
    
    showAlert('Booking confirmed! Check your bookings.', 'success');
    cart = [];
    updateCartCount();
    loadCart();
}

// Bookings
async function bookNow(eventId) {
    const event = events.find(e => e.id === eventId);
    const quantity = parseInt(document.getElementById(`qty-${eventId}`).value);

    const booking = {
        userId: currentUser.id,
        eventId: event.id,
        numberOfSeats: quantity,
        totalPrice: event.price * quantity,
        status: 'CONFIRMED'
    };

    try {
        const response = await fetch(API.bookings, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking)
        });

        if (response.ok) {
            showAlert('Booking confirmed!', 'success');
            loadEvents(); // Refresh events
        }
    } catch (error) {
        showAlert('Booking failed: ' + error.message, 'error');
    }
}

async function loadBookings() {
    try {
        const response = await fetch(`${API.bookings}/user/${currentUser.id}`);
        bookings = await response.json();
        displayBookings();
    } catch (error) {
        showAlert('Failed to load bookings: ' + error.message, 'error');
    }
}

async function displayBookings() {
    const bookingsList = document.getElementById('bookingsList');
    bookingsList.innerHTML = '';

    if (bookings.length === 0) {
        bookingsList.innerHTML = '<p>No bookings yet.</p>';
        return;
    }

    for (const booking of bookings) {
        const event = events.find(e => e.id === booking.eventId) || await fetchEventById(booking.eventId);
        const bookingDiv = document.createElement('div');
        bookingDiv.className = 'booking-item';
        bookingDiv.innerHTML = `
            <div class="item-details">
                <h4>${event ? event.title : 'Unknown Event'}</h4>
                <p>Seats: ${booking.numberOfSeats}</p>
                <p>Total: ₹${booking.totalPrice}</p>
                <p>Booked: ${new Date(booking.bookingDateTime).toLocaleString()}</p>
                <span class="status-badge status-${booking.status.toLowerCase()}">${booking.status}</span>
            </div>
            <div class="item-actions">
                ${booking.status !== 'CANCELLED' ? 
                    `<button class="btn-secondary" onclick="cancelBooking(${booking.id})">Cancel</button>` : ''}
            </div>
        `;
        bookingsList.appendChild(bookingDiv);
    }
}

async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
        await fetch(`${API.bookings}/${bookingId}/cancel`, { method: 'PATCH' });
        showAlert('Booking cancelled', 'success');
        loadBookings();
    } catch (error) {
        showAlert('Failed to cancel booking: ' + error.message, 'error');
    }
}

// Profile
function showProfile() {
    const userProfile = document.getElementById('userProfile');
    userProfile.innerHTML = `
        <p><strong>Username:</strong> ${currentUser.username}</p>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>User ID:</strong> ${currentUser.id}</p>
    `;
}

// Utility Functions
async function fetchEventById(eventId) {
    try {
        const response = await fetch(`${API.events}/${eventId}`);
        return await response.json();
    } catch (error) {
        return null;
    }
}

async function updateCartCount() {
    try {
        const response = await fetch(`${API.cart}/user/${currentUser.id}`);
        const cartItems = await response.json();
        document.getElementById('cartCount').textContent = cartItems.length;
    } catch (error) {
        document.getElementById('cartCount').textContent = '0';
    }
}

function showAlert(message, type) {
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) existingAlert.remove();

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    document.querySelector('main').prepend(alert);
    
    setTimeout(() => alert.remove(), 3000);
}

function hideAllSections() {
    authSection.classList.add('hidden');
    eventsSection.classList.add('hidden');
    cartSection.classList.add('hidden');
    bookingsSection.classList.add('hidden');
    profileSection.classList.add('hidden');
}

function showAuthSection() {
    hideAllSections();
    authSection.classList.remove('hidden');
}

function showMainApp() {
    hideAllSections();
    eventsSection.classList.remove('hidden');
    updateCartCount();
}
