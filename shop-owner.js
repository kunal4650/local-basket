const ownerApp = {
    shop: null,

    init: () => {
        const session = Data.getSession();
        if (!session || session.role !== 'owner') {
            // Show login only
            return;
        }

        // Find shop associated with this owner phone
        const shops = Data.get(DB_KEYS.SHOPS);
        this.shop = shops.find(s => s.ownerPhone === session.phone);
        
        if (this.shop) {
            document.getElementById('owner-login').classList.add('hidden');
            document.getElementById('owner-dashboard').classList.remove('hidden');
            ownerApp.loadDashboard();
        } else {
            alert("No shop linked to this account.");
        }
    },

    loadDashboard: () => {
        // Shop Status
        const toggle = document.getElementById('shop-status-toggle');
        toggle.checked = this.shop.status;
        toggle.onchange = () => {
            const shops = Data.get(DB_KEYS.SHOPS);
            const idx = shops.findIndex(s => s.id === this.shop.id);
            shops[idx].status = toggle.checked;
            Data.set(DB_KEYS.SHOPS, shops);
        };

        ownerApp.loadOrders();
        ownerApp.loadInventory();
        ownerApp.loadAnalytics();
    },

    switchTab: (tabName) => {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        
        document.getElementById(`tab-${tabName}`).classList.add('active');
        event.target.classList.add('active');
    },

    loadOrders: () => {
        const orders = Data.get(DB_KEYS.ORDERS);
        // In a real app, orders would have shopId. 
        // For this demo, we show all orders to simulate activity.
        const html = orders.map(o => `
            <div class="card mb-2">
                <h4>${o.id} <span style="float:right; font-size:0.8rem">${o.status}</span></h4>
                <small>${new Date(o.date).toLocaleString()}</small>
                <div class="mt-1">Total: ₹${o.total}</div>
            </div>
        `).join('');
        document.getElementById('orders-list').innerHTML = html || '<p>No orders yet.</p>';
    },

    loadInventory: () => {
        const products = Data.get(DB_KEYS.PRODUCTS).filter(p => p.shopId === this.shop.id); // In real app use this.shop.id
        // For demo, we might not have linked products correctly to the dummy logged in user, 
        // so we just show all products for visual completeness if the filter is empty
        const displayProducts = products.length ? products : Data.get(DB_KEYS.PRODUCTS); 

        const html = displayProducts.map(p => `
            <div class="card mb-2" style="display:flex; justify-content:space-between; align-items:center;">
                <img src="${Data.getImg(p.img)}" style="width:50px; height:50px; border-radius:4px;">
                <div style="flex:1; margin-left:10px;">
                    <h4>${p.name}</h4>
                    <small>Stock: ${Math.floor(Math.random() * 50)}</small>
                </div>
                <div>₹${p.price}</div>
            </div>
        `).join('');
        document.getElementById('inventory-list').innerHTML = html;
    },

    loadAnalytics: () => {
        document.getElementById('today-sales').innerText = '₹' + Math.floor(Math.random() * 5000);
        document.getElementById('pending-count').innerText = Math.floor(Math.random() * 10);
    },

    handleLogin: (e) => {
        e.preventDefault();
        const phone = document.getElementById('owner-phone').value;
        const pass = document.getElementById('owner-pass').value;
        
        // Mock Auth
        if (pass === 'admin123') { // Simple mock password
            const session = Data.login(phone, 'owner');
            // Ensure a shop exists for this demo user if not found
            const shops = Data.get(DB_KEYS.SHOPS);
            if (!shops.find(s => s.ownerPhone === phone)) {
                shops[0].ownerPhone = phone; // Hijack first shop for demo
                Data.set(DB_KEYS.SHOPS, shops);
            }
            location.reload();
        } else {
            alert('Invalid credentials');
        }
    },
    
    logout: () => {
        localStorage.removeItem(DB_KEYS.SESSION);
        location.reload();
    }
};

document.getElementById('owner-login-form').onsubmit = ownerApp.handleLogin;
ownerApp.init();