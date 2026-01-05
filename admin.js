const adminApp = {
    init: () => {
        // Decoy check
        if (sessionStorage.getItem('lb_admin_unlocked') === 'true') {
            document.getElementById('decoy-screen').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'block';
            adminApp.loadData();
        } else {
            // Check for secret key shortcut (e.g. triple click or just show modal for demo purpose)
            // For this code output, we will trigger the modal immediately if they know the URL 
            // but in reality, you might hide it behind a specific interaction.
            document.getElementById('admin-auth').classList.remove('hidden');
        }
    },

    verify: () => {
        const key = document.getElementById('admin-key').value;
        const pass = document.getElementById('admin-pass').value;

        // Hardcoded secret for demo
        if (key === 'root' && pass === 'toor') {
            sessionStorage.setItem('lb_admin_unlocked', 'true');
            document.getElementById('admin-auth').classList.add('hidden');
            adminApp.init();
        } else {
            alert('Access Denied');
        }
    },

    loadData: () => {
        // Load Config
        const config = Data.get(DB_KEYS.CONFIG);
        document.getElementById('conf-fee').value = config.baseFee;
        document.getElementById('conf-free').value = config.freeDeliveryThreshold;
        document.getElementById('conf-comm').value = 10; // 10% mock

        // Load Stats
        const orders = Data.get(DB_KEYS.ORDERS);
        const revenue = orders.reduce((acc, o) => acc + o.total, 0);
        
        document.getElementById('admin-stats').innerHTML = `
            <tr><td>Total Orders</td><td>${orders.length}</td></tr>
            <tr><td>Total Revenue</td><td>₹${revenue}</td></tr>
            <tr><td>Platform Fees</td><td>₹${orders.length * config.baseFee}</td></tr>
        `;
    },

    saveConfig: () => {
        const config = Data.get(DB_KEYS.CONFIG);
        config.baseFee = parseInt(document.getElementById('conf-fee').value);
        config.freeDeliveryThreshold = parseInt(document.getElementById('conf-free').value);
        Data.set(DB_KEYS.CONFIG, config);
        alert('Configuration Updated');
    },

    killSwitch: () => {
        if(confirm("ARE YOU SURE? This will close all shops.")) {
            const shops = Data.get(DB_KEYS.SHOPS);
            shops.forEach(s => s.status = false);
            Data.set(DB_KEYS.SHOPS, shops);
            alert("All shops closed.");
        }
    },

    logout: () => {
        sessionStorage.removeItem('lb_admin_unlocked');
        location.reload();
    }
};

document.getElementById('admin-login-btn').onclick = adminApp.verify;
adminApp.init();