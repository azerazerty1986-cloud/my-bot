// ================== نظام التقارير والإحصائيات - نسخة كاملة ==================
const reportsModule = (function() {
    let movements = JSON.parse(localStorage.getItem('ryan_movements')) || [];
    
    const CONFIG = {
        CURRENCY: 'دج',
        STORAGE_KEYS: {
            INVOICES: 'ryan_invoices', PURCHASES: 'ryan_purchases',
            CUSTOMERS: 'ryan_customers', SUPPLIERS: 'ryan_suppliers',
            STOCK: 'ryan_stock', MOVEMENTS: 'ryan_movements'
        }
    };

    function _formatCurrency(a) { return `${Number(a).toFixed(2)} ${CONFIG.CURRENCY}`; }

    function showReportTab(tabId) {
        document.querySelectorAll('.report-content').forEach(c => c.classList.remove('active-report'));
        document.getElementById(tabId)?.classList.add('active-report');
        document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
        if (event?.target) event.target.classList.add('active');
        
        if (tabId === 'report-summary') renderReports();
        else if (tabId === 'report-products') renderProductsReport();
        else if (tabId === 'report-categories') renderCategoriesReport();
        else if (tabId === 'report-lowstock') updateLowStockList();
        else if (tabId === 'report-top') updateTopProducts();
        else if (tabId === 'report-movements') updateMovementsList();
        else if (tabId === 'report-customer-debts' && window.debtModule) window.debtModule.renderCustomerDebts();
        else if (tabId === 'report-supplier-debts' && window.debtModule) window.debtModule.renderSupplierDebts();
        else if (tabId === 'report-debt-summary' && window.debtModule) window.debtModule.renderDebtSummary();
    }

    function renderReports() {
        const inv = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.INVOICES)) || [];
        const pur = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PURCHASES)) || [];
        const ts = inv.reduce((s, i) => s + (i.total || 0), 0);
        const tp = pur.reduce((s, p) => s + (p.total || 0), 0);
        
        const els = {
            'total-sales': ts, 'total-purchases': tp, 'total-profits': ts - tp,
            'total-sales-count': inv.length, 'total-purchases-count': pur.length
        };
        Object.entries(els).forEach(([id, v]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = id.includes('count') ? v : v.toFixed(2);
        });
    }

    function renderProductsReport() {
        const stock = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.STOCK)) || [];
        const cats = [...new Set(stock.map(p => p.category || 'عام'))];
        document.getElementById('products-count') && (document.getElementById('products-count').textContent = stock.length);
        document.getElementById('categories-count') && (document.getElementById('categories-count').textContent = cats.length);
        const val = stock.reduce((s, p) => s + (p.qty * p.buyPrice), 0);
        document.getElementById('stock-value') && (document.getElementById('stock-value').textContent = val.toFixed(2) + ' دج');
        
        const tb = document.getElementById('products-category-tbody');
        if (!tb) return;
        if (!cats.length) { tb.innerHTML = '<tr><td colspan="4" class="text-center">لا توجد بيانات</td></tr>'; return; }
        
        tb.innerHTML = cats.map(c => {
            const cp = stock.filter(p => (p.category || 'عام') === c);
            const tq = cp.reduce((s, p) => s + p.qty, 0);
            const tv = cp.reduce((s, p) => s + (p.qty * p.buyPrice), 0);
            return `<tr><td>${c}</td><td>${cp.length}</td><td>${tq}</td><td>${tv.toFixed(2)} دج</td></tr>`;
        }).join('');
    }

    function renderCategoriesReport() {
        const stock = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.STOCK)) || [];
        const cats = {};
        stock.forEach(p => {
            const c = p.category || 'عام';
            if (!cats[c]) cats[c] = { cnt: 0, buy: 0, sell: 0, qty: 0 };
            cats[c].cnt++;
            cats[c].buy += (p.buyPrice * p.qty);
            cats[c].sell += (p.sellPrice * p.qty);
            cats[c].qty += p.qty;
        });
        
        const tb = document.getElementById('categories-tbody');
        if (!tb) return;
        if (!Object.keys(cats).length) { tb.innerHTML = '<tr><td colspan="5" class="text-center">لا توجد بيانات</td></tr>'; return; }
        
        tb.innerHTML = Object.entries(cats).map(([c, d]) => 
            `<tr><td>${c}</td><td>${d.cnt}</td><td>${d.qty}</td><td>${d.buy.toFixed(2)} دج</td><td>${d.sell.toFixed(2)} دج</td></tr>`
        ).join('');
    }

    function updateLowStockThreshold(val) {
        document.getElementById('low-stock-threshold').textContent = val;
        updateLowStockList();
    }

    function updateLowStockList() {
        const th = parseInt(document.getElementById('threshold-input')?.value) || 5;
        const stock = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.STOCK)) || [];
        const low = stock.filter(p => p.qty < th);
        const list = document.getElementById('low-stock-list');
        if (!list) return;
        
        if (!low.length) {
            list.innerHTML = '<div class="list-group-item text-center text-success">✅ لا توجد منتجات تحت الحد</div>';
        } else {
            list.innerHTML = low.map(p => 
                `<div class="list-group-item d-flex justify-content-between"><span><i class="material-icons-round text-danger">warning</i> ${p.name}</span><span class="badge bg-danger">${p.qty} ${p.unit}</span></div>`
            ).join('');
        }
    }

    function updateTopProducts() {
        const inv = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.INVOICES)) || [];
        const sales = {};
        inv.forEach(i => i.items?.forEach(item => {
            if (!sales[item.name]) sales[item.name] = { qty: 0, total: 0 };
            sales[item.name].qty += item.qty || 0;
            sales[item.name].total += item.total || 0;
        }));
        
        const sorted = Object.entries(sales).sort((a, b) => b[1].qty - a[1].qty).slice(0, 10);
        const list = document.getElementById('top-products-list');
        if (!list) return;
        
        if (!sorted.length) {
            list.innerHTML = '<div class="list-group-item text-center">📊 لا توجد مبيعات</div>';
        } else {
            list.innerHTML = sorted.map(([n, d], i) => 
                `<div class="list-group-item d-flex justify-content-between"><span>${i===0?'🥇':i===1?'🥈':i===2?'🥉':'📦'} ${n}</span><span class="badge bg-primary">${d.qty} قطعة</span></div>`
            ).join('');
        }
    }

    function updateMovementsList() {
        const list = document.getElementById('stock-movements-list');
        if (!list) return;
        if (!movements.length) { list.innerHTML = '<div class="list-group-item text-center">📭 لا توجد حركات</div>'; return; }
        
        list.innerHTML = movements.slice(-20).reverse().map(m => {
            const icon = m.type === 'بيع' ? '💰' : m.type === 'شراء' ? '📦' : m.type === 'إضافة منتج' ? '➕' : '✏️';
            return `<div class="list-group-item d-flex justify-content-between"><span>${icon} ${m.date}</span><span>${m.type} - ${m.product} (${m.qty})</span></div>`;
        }).join('');
    }

    function filterSalesByDate() {
        const start = document.getElementById('start-date')?.value;
        const end = document.getElementById('end-date')?.value;
        if (!start || !end) return Swal.fire('تنبيه', 'اختر تاريخ البداية والنهاية', 'warning');
        
        const sd = new Date(start), ed = new Date(end); ed.setHours(23,59,59);
        const inv = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.INVOICES)) || [];
        const filtered = inv.filter(i => {
            if (!i.date) return false;
            const d = new Date(i.date.split(' ')[0].split('/').reverse().join('-'));
            return d >= sd && d <= ed;
        });
        
        const total = filtered.reduce((s, i) => s + (i.total || 0), 0);
        const cnt = filtered.length;
        const avg = cnt ? total / cnt : 0;
        const div = document.getElementById('date-sales-result');
        if (!div) return;
        
        if (!cnt) { div.innerHTML = '<div class="alert alert-info">لا توجد مبيعات</div>'; return; }
        
        div.innerHTML = `
            <div class="alert alert-info"><div class="row"><div class="col-4"><div>عدد الفواتير</div><div class="h5">${cnt}</div></div><div class="col-4"><div>الإجمالي</div><div class="h5">${total.toFixed(2)} دج</div></div><div class="col-4"><div>المتوسط</div><div class="h5">${avg.toFixed(2)} دج</div></div></div></div>
            <table class="table table-sm"><thead><tr><th>رقم</th><th>التاريخ</th><th>العميل</th><th>المبلغ</th></tr></thead><tbody>${filtered.map(i => `<tr><td>#${i.number}</td><td>${i.date}</td><td>${i.customer}</td><td>${i.total.toFixed(2)} دج</td></tr>`).join('')}</tbody></table>
        `;
    }

    return {
        showReportTab, renderReports, renderProductsReport, renderCategoriesReport,
        updateLowStockThreshold, updateLowStockList, updateTopProducts, updateMovementsList, filterSalesByDate
    };
})();

window.reportsModule = reportsModule;
