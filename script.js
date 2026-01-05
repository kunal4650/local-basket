const app = {
    userLoc: null, // { lat, lng }
    cart: {}, // { prodId: qty }
    
    init: () => {
        // Load Cart from storage
        const storedCart = localStorage.getItem('lb_local_cart');
        if (storedCart) app.cart = JSON.parse(storedCart);

        // Load Location
        const storedLoc = localStorage.getItem('lb_user_loc');
        if (storedLoc) {
            app.userLoc = JSON.parse(storedLoc);
            app.updateHeaderLoc();
            app.loadHomepage();
        } else {
            document.getElementById('location-modal').classList.remove('hidden');
        }

        // Check Auth
        const session = Data.getSession();
        if (session) {
            document.querySelector('.user-actions').innerHTML = `
                <span>Hi, ${session.phone.slice(-4)}</span>
                <button onclick="app.logout()" class="btn-sm">Logout</button>
            `;
        }

        app.updateCartUI();
    },

    // --- Location Logic ---
    openLocationModal: () => document.getElementById('location-modal').classList.remove('hidden'),
    
    detectLocation: () => {
        if (!navigator.geolocation) return alert('Geolocation not supported');
        navigator.geolocation.getCurrentPosition(pos => {
            app.userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude, address: "Current Location" };
            app.saveLocation();
        }, () => {
            alert('Unable to retrieve location. Please enter manually.');
        });
    },

    saveLocation: () => {
        // In a real app, we'd reverse geocode here. 
        // For this demo, if address is empty, we fake it.
        if(!app.userLoc.address) app.userLoc.address = "detected_loc";
        
        localStorage.setItem('lb_user_loc', JSON.stringify(app.userLoc));
        document.getElementById('location-modal').classList.add('hidden');
        app.updateHeaderLoc();
        app.loadHomepage();
    },

    updateHeaderLoc: () => {
        document.getElementById('header-address').innerText = app.userLoc.address || 'Unknown';
        // Calculate nearest shop distance
        const shops = Data.get(DB_KEYS.SHOPS);
        let minDst = 999;
        shops.forEach(s => {
            const d = Data.getDistance(app.userLoc.lat, app.userLoc.lng, s.lat, s.lng);
            if(d < minDst) minDst = d;
        });

        const etaEl = document.getElementById('header-eta');
        if (minDst > 8) {
            etaEl.innerText = "Too far for delivery";
            etaEl.style.color = "red";
        } else if (minDst > 7) {
            etaEl.innerText = "Limited Delivery (45-75 mins)";
            etaEl.style.color = "orange";
        } else {
            etaEl.innerText = "Delivery in 30-45 mins";
            etaEl.style.color = "green";
        }
    },

    // --- Core UI Loaders ---
    loadHomepage: () => {
        document.getElementById('loader').classList.add('hidden');
        
        // Render Banners
        const config = Data.get(DB_KEYS.CONFIG);
        document.getElementById('banner-slider').innerHTML = config.banners.map(url => 
            `<div class="banner" style="background-image: url('${url}')"></div>`
        ).join('');

        // Render Categories
        const cats = ['Dairy', 'Snacks', 'Veg', 'Grocery', 'Fruits', 'Home', 'Care', 'Drinks'];
        document.getElementById('category-grid').innerHTML = cats.map(c => 
            `<div class="cat-item" onclick="app.filterCat('${c}')">
                <img src="${Data.getImg(c)}" loading="lazy">
                <span>${c}</span>
            </div>`
        ).join('');

        // Render Products
        app.renderProducts();
    },

    renderProducts: (filterCat = null) => {
        const products = Data.get(DB_KEYS.PRODUCTS);
        const shops = Data.get(DB_KEYS.SHOPS);
        
        // Filter products by distance availability
        const validProds = products.filter(p => {
            const shop = shops.find(s => s.id === p.shopId);
            if (!shop) return false;
            const dist = Data.getDistance(app.userLoc.lat, app.userLoc.lng, shop.lat, shop.lng);
            return dist <= 8;
        });

        const displayProds = filterCat ? validProds.filter(p => p.cat === filterCat) : validProds;

        const html = displayProds.map(p => {
            const qty = app.cart[p.id] || 0;
            return `
            <div class="product-card">
                <img src="${Data.getImg(p.img)}" loading="lazy">
                <div class="product-meta">
                    <h4>${p.name}</h4>
                    <div class="price">₹${p.price} <span class="mrp">₹${p.mrp}</span></div>
                </div>
                <div class="add-btn-container">
                    ${qty === 0 
                        ? `<button class="add-btn" onclick="app.updateQty('${p.id}', 1)">ADD</button>`
                        : `<div class="qty-control">
                               <span onclick="app.updateQty('${p.id}', -1)">-</span>
                               <span>${qty}</span>
                               <span onclick="app.updateQty('${p.id}', 1)">+</span>
                           </div>`
                    }
                </div>
            </div>`;
        }).join('');

        document.getElementById('product-feed').innerHTML = html || '<p class="text-center w-100">No products found nearby.</p>';
    },

    // --- Cart Logic ---
    updateQty: (pid, delta) => {
        if (!app.cart[pid]) app.cart[pid] = 0;
        app.cart[pid] += delta;
        if (app.cart[pid] <= 0) delete app.cart[pid];
        
        localStorage.setItem('lb_local_cart', JSON.stringify(app.cart));
        app.renderProducts(); // Re-render to show button state
        app.updateCartUI();
    },

    updateCartUI: () => {
        const pids = Object.keys(app.cart);
        const float = document.getElementById('cart-float');
        
        if (pids.length === 0) {
            float.classList.add('hidden');
            return;
        }

        const products = Data.get(DB_KEYS.PRODUCTS);
        let total = 0;
        let count = 0;

        pids.forEach(id => {
            const p = products.find(x => x.id === id);
            if(p) {
                total += p.price * app.cart[id];
                count += app.cart[id];
            }
        });

        document.getElementById('cart-count').innerText = `${count} Items`;
        document.getElementById('cart-total').innerText = `₹${total}`;
        float.classList.remove('hidden');
    },

    toggleCart: () => {
        const overlay = document.getElementById('cart-overlay');
        if (overlay.classList.contains('hidden')) {
            app.renderCartDetails();
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    },

    renderCartDetails: () => {
        const pids = Object.keys(app.cart);
        const products = Data.get(DB_KEYS.PRODUCTS);
        let itemTotal = 0;
        let html = '';

        pids.forEach(id => {
            const p = products.find(x => x.id === id);
            if(p) {
                const sub = p.price * app.cart[id];
                itemTotal += sub;
                html += `
                <div class="cart-item-row">
                    <div>
                        <div style="font-weight:600">${p.name}</div>
                        <div style="font-size:0.8rem">₹${p.price} x ${app.cart[id]}</div>
                    </div>
                    <div>₹${sub}</div>
                </div>`;
            }
        });

        document.getElementById('cart-items').innerHTML = html;
        
        const config = Data.get(DB_KEYS.CONFIG);
        const delFee = itemTotal > config.freeDeliveryThreshold ? 0 : config.baseFee;
        
        // Check max distance for surcharge
        const shops = Data.get(DB_KEYS.SHOPS);
        let maxDist = 0;
        pids.forEach(id => {
            const p = products.find(x => x.id === id);
            const s = shops.find(x => x.id === p.shopId);
            const d = Data.getDistance(app.userLoc.lat, app.userLoc.lng, s.lat, s.lng);
            if(d > maxDist) maxDist = d;
        });

        let surcharge = 0;
        if (maxDist > 7) {
            surcharge = 20; // Hardcoded for logic simplicity
            document.getElementById('dist-surcharge-row').classList.remove('hidden');
        } else {
            document.getElementById('dist-surcharge-row').classList.add('hidden');
        }

        const grandTotal = itemTotal + delFee + surcharge;

        document.getElementById('bill-item-total').innerText = `₹${itemTotal}`;
        document.getElementById('bill-delivery').innerText = delFee === 0 ? 'FREE' : `₹${delFee}`;
        document.getElementById('bill-surcharge').innerText = `₹${surcharge}`;
        document.getElementById('bill-grand-total').innerText = `₹${grandTotal}`;

        // Setup Checkout
        const btn = document.getElementById('checkout-btn');
        if (maxDist > 8) {
            btn.disabled = true;
            btn.innerText = "Location Unserviceable (>8km)";
            btn.style.backgroundColor = "#ccc";
        } else {
            btn.disabled = false;
            btn.innerText = "Order via WhatsApp";
            btn.style.backgroundColor = "var(--secondary)";
            btn.onclick = () => app.checkout(grandTotal, pids, products);
        }
    },

    checkout: (total, pids, allProds) => {
        const session = Data.getSession();
        if (!session) {
            document.getElementById('auth-modal').classList.remove('hidden');
            return;
        }

        // Generate Order
        const orderId = 'ORD-' + Date.now().toString().slice(-6);
        let msg = `*New Order: ${orderId}*\n\n`;
        pids.forEach(id => {
            const p = allProds.find(x => x.id === id);
            msg += `- ${p.name} x${app.cart[id]}\n`;
        });
        msg += `\nTotal: ₹${total}`;
        msg += `\nAddress: ${app.userLoc.address}`;
        msg += `\n\nPlease confirm delivery.`;

        // Save Order locally
        const orders = Data.get(DB_KEYS.ORDERS);
        orders.push({
            id: orderId,
            userId: session.phone,
            items: app.cart,
            total: total,
            status: 'Pending',
            date: new Date().toISOString()
        });
        Data.set(DB_KEYS.ORDERS, orders);

        // Clear Cart
        app.cart = {};
        localStorage.removeItem('lb_local_cart');
        app.updateCartUI();
        app.toggleCart();

        // Redirect to WhatsApp (Shop owner number - using generic here)
        window.location.href = `https://wa.me/919999999999?text=${encodeURIComponent(msg)}`;
    },

    // --- Auth Logic ---
    handleLogin: (e) => {
        e.preventDefault();
        const phone = document.getElementById('login-phone').value;
        const otpSec = document.getElementById('otp-section');
        
        if (otpSec.classList.contains('hidden')) {
            // Fake OTP step
            otpSec.classList.remove('hidden');
            document.getElementById('login-phone').disabled = true;
            document.getElementById('login-btn').innerText = "Verify & Login";
            alert("Your OTP is 1234");
        } else {
            // Verify
            const otp = document.getElementById('login-otp').value;
            if (otp === '1234') {
                Data.login(phone);
                document.getElementById('auth-modal').classList.add('hidden');
                app.init();
            } else {
                alert("Invalid OTP");
            }
        }
    },
    
    logout: () => {
        localStorage.removeItem(DB_KEYS.SESSION);
        window.location.reload();
    }
};

// Event Listeners
document.getElementById('detect-loc-btn').onclick = app.detectLocation;
document.getElementById('save-loc-btn').onclick = () => {
    const manual = document.getElementById('manual-address').value;
    if(manual) {
        // Mock geocoding for manual entry (Reset to base location for demo)
        app.userLoc = { lat: 12.9716, lng: 77.5946, address: manual };
        app.saveLocation();
    }
};
document.getElementById('login-form').onsubmit = app.handleLogin;

// Initialize
app.init();