const DB_KEYS = {
    USERS: 'lb_users',
    SHOPS: 'lb_shops',
    PRODUCTS: 'lb_products',
    ORDERS: 'lb_orders',
    CONFIG: 'lb_config',
    SESSION: 'lb_session',
    CART: 'lb_cart'
};

// --- Mock Data Init ---
function initData() {
    if (!localStorage.getItem(DB_KEYS.CONFIG)) {
        localStorage.setItem(DB_KEYS.CONFIG, JSON.stringify({
            baseFee: 25,
            freeDeliveryThreshold: 499,
            surchargePerKm: 10,
            banners: [
                'https://placehold.co/600x250/orange/white?text=Free+Delivery',
                'https://placehold.co/600x250/green/white?text=Fresh+Veg'
            ]
        }));
    }

    if (!localStorage.getItem(DB_KEYS.SHOPS)) {
        // Mocking a central location (approx Bangalore center coordinates)
        const baseLat = 12.9716;
        const baseLng = 77.5946;
        
        const shops = [
            { id: 's1', name: 'Fresh Mart', lat: baseLat + 0.01, lng: baseLng + 0.01, status: true, ownerPhone: '9999999999' },
            { id: 's2', name: 'Daily Needs', lat: baseLat - 0.01, lng: baseLng - 0.01, status: true, ownerPhone: '8888888888' },
            { id: 's3', name: 'Organic Greens', lat: baseLat + 0.02, lng: baseLng, status: true, ownerPhone: '7777777777' }
        ];
        localStorage.setItem(DB_KEYS.SHOPS, JSON.stringify(shops));
    }

    if (!localStorage.getItem(DB_KEYS.PRODUCTS)) {
        const products = [
            { id: 'p1', shopId: 's1', name: 'Amul Gold Milk', price: 34, mrp: 34, cat: 'Dairy', img: 'milk' },
            { id: 'p2', shopId: 's1', name: 'Farm Fresh Eggs (6pcs)', price: 45, mrp: 60, cat: 'Dairy', img: 'eggs' },
            { id: 'p3', shopId: 's1', name: 'Lays Chips Classic', price: 20, mrp: 20, cat: 'Snacks', img: 'chips' },
            { id: 'p4', shopId: 's2', name: 'Onion 1kg', price: 30, mrp: 50, cat: 'Veg', img: 'onion' },
            { id: 'p5', shopId: 's2', name: 'Potato 1kg', price: 25, mrp: 40, cat: 'Veg', img: 'potato' },
            { id: 'p6', shopId: 's3', name: 'Atta 5kg', price: 250, mrp: 310, cat: 'Grocery', img: 'flour' }
        ];
        localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
    }
}

// --- Utils ---
const Data = {
    get: (key) => JSON.parse(localStorage.getItem(key) || '[]'),
    set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
    
    // Haversine Formula for Distance (km)
    getDistance: (lat1, lon1, lat2, lon2) => {
        const R = 6371; 
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },

    getSession: () => JSON.parse(localStorage.getItem(DB_KEYS.SESSION)),
    
    login: (phone, role = 'customer') => {
        const session = { phone, role, token: Date.now() };
        localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(session));
        return session;
    },

    // Image Helper
    getImg: (keyword) => `https://placehold.co/200x200/png?text=${keyword}`
};

initData();