
// ================== التقارير والإحصائيات ==================
const reportsModule = (function() {
    function renderReports() {
        const invoices = JSON.parse(localStorage.getItem('ryan_invoices')) || [];
        const purchases = JSON.parse(localStorage.getItem('ryan_purchases')) || [];
        
        const totalSales = invoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalPurchases = purchases.reduce((sum, pur) => sum + pur.total, 0);
        const profits = totalSales - totalPurchases;
        
        document.getElementById('total-sales').textContent = totalSales.toFixed(2);
        document.getElementById('total-purchases').textContent = totalPurchases.toFixed(2);
        document.getElementById('total-profits').textContent = profits.toFixed(2);
        document.getElementById('total-sales-count').textContent = invoices.length;
        document.getElementById('total-purchases-count').textContent = purchases.length;
    }

    function showReportTab(tabId) {
        document.querySelectorAll('.report-content').forEach(c => c.classList.remove('active-report'));
        document.getElementById(tabId).classList.add('active-report');
        document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');

        if (tabId === 'report-lowstock') updateLowStockList();
        if (tabId === 'report-top') updateTopProducts();
        if (tabId === 'report-movements') updateMovementsList();
    }

    function updateLowStockThreshold(val) {
        document.getElementById('low-stock-threshold').textContent = val;
        updateLowStockList();
    }

    function updateLowStockList() {
        const threshold = parseInt(document.getElementById('threshold-input').value) || 5;
        const stock = inventoryModule.stock;
        const lowStock = stock.filter(p => p.qty < threshold);
        const list = document.getElementById('low-stock-list');
        if (lowStock.length === 0) {
            list.innerHTML = '<div class="list-group-item">لا توجد منتجات تحت الحد المحدد</div>';
        } else {
            list.innerHTML = lowStock.map(p => 
                `<div class="list-group-item low-stock-item">${p.name} - الكمية: ${p.qty} ${p.unit}</div>`
            ).join('');
        }
    }

    function updateTopProducts() {
        const invoices = JSON.parse(localStorage.getItem('ryan_invoices')) || [];
        const productSales = {};
        invoices.forEach(inv => {
            inv.items.forEach(item => {
                if (!productSales[item.name]) productSales[item.name] = 0;
                productSales[item.name] += item.qty;
            });
        });
        const sorted = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const list = document.getElementById('top-products-list');
        if (sorted.length === 0) {
            list.innerHTML = '<div class="list-group-item">لا توجد مبيعات بعد</div>';
        } else {
            list.innerHTML = sorted.map(([name, qty]) => 
                `<div class="list-group-item">${name} - الكمية المباعة: ${qty}</div>`
            ).join('');
        }
    }

    function updateMovementsList() {
        const movements = inventoryModule.movements;
        const list = document.getElementById('stock-movements-list');
        if (movements.length === 0) {
            list.innerHTML = '<div class="list-group-item">لا توجد حركات بعد</div>';
        } else {
            list.innerHTML = movements.slice(-10).reverse().map(m => 
                `<div class="list-group-item">${m.date} - ${m.type} - ${m.product} - الكمية: ${m.qty}</div>`
            ).join('');
        }
    }

    function filterSalesByDate() {
        const start = document.getElementById('start-date').value;
        const end = document.getElementById('end-date').value;
        if (!start || !end) {
            Swal.fire('تنبيه', 'الرجاء اختيار تاريخ البداية والنهاية', 'warning');
            return;
        }
        const startDate = new Date(start);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59);

        const invoices = JSON.parse(localStorage.getItem('ryan_invoices')) || [];
        const filtered = invoices.filter(inv => {
            const invDate = new Date(inv.date.split(' ')[0].split('/').reverse().join('-') + 'T00:00:00');
            return invDate >= startDate && invDate <= endDate;
        });

        const total = filtered.reduce((sum, inv) => sum + inv.total, 0);
        const count = filtered.length;
        document.getElementById('date-sales-result').innerHTML = `
            <div class="alert alert-info">
                عدد الفواتير: ${count}<br>
                إجمالي المبيعات: ${total.toFixed(2)} دج
            </div>
            <table class="table table-sm">
                <thead><tr><th>رقم</th><th>التاريخ</th><th>العميل</th><th>المبلغ</th></tr></thead>
                <tbody>
                    ${filtered.map(inv => `<tr><td>${inv.number}</td><td>${inv.date}</td><td>${inv.customer}</td><td>${inv.total.toFixed(2)} دج</td></tr>`).join('')}
                </tbody>
            </table>
        `;
    }

    return {
        renderReports,
        showReportTab,
        updateLowStockThreshold,
        updateLowStockList,
        updateTopProducts,
        updateMovementsList,
        filterSalesByDate
    };
})();
