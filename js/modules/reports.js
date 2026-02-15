// ================== التقارير والإحصائيات - نسخة محسنة ==================
const reportsModule = (function() {
    // ================== المتغيرات الخاصة ==================
    let movements = JSON.parse(localStorage.getItem('ryan_movements')) || [];
    
    // ثوابت للتكوين
    const CONFIG = {
        CURRENCY: 'دج',
        STORAGE_KEYS: {
            MOVEMENTS: 'ryan_movements',
            INVOICES: 'ryan_invoices',
            PURCHASES: 'ryan_purchases'
        },
        CHART_COLORS: {
            primary: '#4a5555',
            success: '#4caf50',
            danger: '#ff5e5e',
            warning: '#ffc107',
            info: '#17a2b8'
        }
    };

    // ================== دوال مساعدة ==================
    function _formatCurrency(amount) {
        return `${Number(amount).toFixed(2)} ${CONFIG.CURRENCY}`;
    }

    function _showNotification(title, message, type = 'success') {
        Swal.fire({
            icon: type,
            title: title,
            text: message,
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    }

    // ================== دالة تحديث جميع التقارير ==================
    function renderReports() {
        const invoices = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.INVOICES)) || [];
        const purchases = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PURCHASES)) || [];
        
        // إجمالي المبيعات
        const totalSales = invoices.reduce((sum, inv) => sum + inv.total, 0);
        
        // إجمالي المشتريات
        const totalPurchases = purchases.reduce((sum, pur) => sum + pur.total, 0);
        
        // الأرباح
        const profits = totalSales - totalPurchases;
        
        // مبيعات اليوم
        const today = new Date().toLocaleDateString('ar-DZ');
        const todaySales = invoices
            .filter(inv => inv.date.includes(today))
            .reduce((sum, inv) => sum + inv.total, 0);
        
        // مشتريات اليوم
        const todayPurchases = purchases
            .filter(pur => pur.date.includes(today))
            .reduce((sum, pur) => sum + pur.total, 0);
        
        // رأس المال (قيمة المخزون)
        const stock = JSON.parse(localStorage.getItem('ryan_stock')) || [];
        const capital = stock.reduce((sum, item) => sum + (item.qty * item.buyPrice), 0);
        
        // قيمة المخزون بسعر البيع
        const stockValue = stock.reduce((sum, item) => sum + (item.qty * item.sellPrice), 0);
        
        // تحديث العناصر في الصفحة
        const elements = {
            'total-sales': totalSales,
            'total-purchases': totalPurchases,
            'total-profits': profits,
            'total-sales-count': invoices.length,
            'total-purchases-count': purchases.length,
            'today-sales': todaySales,
            'today-purchases': todayPurchases,
            'capital': capital,
            'stock-value': stockValue,
            'profit-margin': totalSales > 0 ? ((profits / totalSales) * 100).toFixed(2) : 0
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                if (id.includes('margin')) {
                    el.textContent = value + '%';
                } else if (id.includes('count')) {
                    el.textContent = value;
                } else {
                    el.textContent = value.toFixed(2);
                }
            }
        });
        
        // تحديث القوائم
        updateLowStockList();
        updateTopProducts();
        updateMovementsList();
        updateSupplierReport();
        updateCustomerReport();
        updateExpensesReport();
    }

    // ================== إظهار تبويب التقارير ==================
    function showReportTab(tabId) {
        // إخفاء جميع التقارير
        document.querySelectorAll('.report-content').forEach(c => c.classList.remove('active-report'));
        
        // إظهار التقرير المطلوب
        const targetReport = document.getElementById(tabId);
        if (targetReport) {
            targetReport.classList.add('active-report');
        }
        
        // تحديث التبويبات النشطة
        document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
        if (event && event.target) {
            event.target.classList.add('active');
        }
        
        // تحديث البيانات حسب التبويب
        switch(tabId) {
            case 'report-summary':
                renderReports();
                break;
            case 'report-lowstock':
                updateLowStockList();
                break;
            case 'report-top':
                updateTopProducts();
                break;
            case 'report-movements':
                updateMovementsList();
                break;
            case 'report-date':
                // لا تحتاج لتحديث
                break;
            case 'report-suppliers':
                updateSupplierReport();
                break;
            case 'report-customers':
                updateCustomerReport();
                break;
            case 'report-expenses':
                updateExpensesReport();
                break;
            case 'report-chart':
                updateChartReport();
                break;
            case 'report-capital':
                updateCapitalReport();
                break;
            case 'report-audit':
                updateAuditReport();
                break;
        }
    }

    // ================== تقرير النواقص ==================
    function updateLowStockThreshold(val) {
        const threshold = document.getElementById('threshold-input');
        if (threshold) threshold.value = val;
        document.getElementById('low-stock-threshold').textContent = val;
        updateLowStockList();
    }

    function updateLowStockList() {
        const threshold = parseInt(document.getElementById('threshold-input')?.value) || 5;
        const stock = JSON.parse(localStorage.getItem('ryan_stock')) || [];
        const lowStock = stock.filter(p => p.qty < threshold);
        
        const list = document.getElementById('low-stock-list');
        if (!list) return;
        
        if (lowStock.length === 0) {
            list.innerHTML = '<div class="list-group-item text-center text-success">✅ لا توجد منتجات تحت الحد المحدد</div>';
        } else {
            list.innerHTML = lowStock.map(p => 
                `<div class="list-group-item low-stock-item d-flex justify-content-between align-items-center">
                    <span><i class="material-icons-round text-danger" style="font-size:16px;">warning</i> ${p.name}</span>
                    <span class="badge bg-danger">${p.qty} ${p.unit}</span>
                </div>`
            ).join('');
        }
    }

    // ================== تقرير الأكثر مبيعاً ==================
    function updateTopProducts() {
        const invoices = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.INVOICES)) || [];
        const productSales = {};
        
        invoices.forEach(inv => {
            inv.items.forEach(item => {
                if (!productSales[item.name]) {
                    productSales[item.name] = {
                        qty: 0,
                        total: 0,
                        count: 0
                    };
                }
                productSales[item.name].qty += item.qty;
                productSales[item.name].total += item.total;
                productSales[item.name].count += 1;
            });
        });
        
        const sorted = Object.entries(productSales)
            .sort((a, b) => b[1].qty - a[1].qty)
            .slice(0, 10);
        
        const list = document.getElementById('top-products-list');
        if (!list) return;
        
        if (sorted.length === 0) {
            list.innerHTML = '<div class="list-group-item text-center">📊 لا توجد مبيعات بعد</div>';
        } else {
            list.innerHTML = sorted.map(([name, data], index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📦';
                return `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <span>${medal} ${name}</span>
                        <div>
                            <span class="badge bg-primary me-1">${data.qty} قطعة</span>
                            <span class="badge bg-success">${_formatCurrency(data.total)}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // ================== تقرير حركة المخزون ==================
    function updateMovementsList() {
        const list = document.getElementById('stock-movements-list');
        if (!list) return;
        
        if (movements.length === 0) {
            list.innerHTML = '<div class="list-group-item text-center">📭 لا توجد حركات بعد</div>';
        } else {
            list.innerHTML = movements.slice(-20).reverse().map(m => {
                let icon = '🔄';
                let color = '';
                
                switch(m.type) {
                    case 'بيع':
                        icon = '💰';
                        color = 'text-danger';
                        break;
                    case 'شراء':
                        icon = '📦';
                        color = 'text-success';
                        break;
                    case 'إضافة منتج':
                        icon = '➕';
                        color = 'text-primary';
                        break;
                    case 'تعديل':
                        icon = '✏️';
                        color = 'text-warning';
                        break;
                }
                
                return `
                    <div class="list-group-item d-flex justify-content-between align-items-center ${color}">
                        <span>${icon} ${m.date}</span>
                        <span>${m.type} - ${m.product} (${m.qty})</span>
                    </div>
                `;
            }).join('');
        }
    }

    // ================== تقرير المبيعات بين تاريخين ==================
    function filterSalesByDate() {
        const start = document.getElementById('start-date').value;
        const end = document.getElementById('end-date').value;
        
        if (!start || !end) {
            _showNotification('تنبيه', 'الرجاء اختيار تاريخ البداية والنهاية', 'warning');
            return;
        }
        
        const startDate = new Date(start);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59);

        const invoices = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.INVOICES)) || [];
        
        const filtered = invoices.filter(inv => {
            const invDate = new Date(inv.date.split(' ')[0].split('/').reverse().join('-'));
            return invDate >= startDate && invDate <= endDate;
        });

        const total = filtered.reduce((sum, inv) => sum + inv.total, 0);
        const count = filtered.length;
        const avgTicket = count > 0 ? total / count : 0;
        
        const resultDiv = document.getElementById('date-sales-result');
        if (!resultDiv) return;
        
        resultDiv.innerHTML = `
            <div class="alert alert-info">
                <div class="row text-center">
                    <div class="col-4">
                        <div class="small">عدد الفواتير</div>
                        <div class="h5">${count}</div>
                    </div>
                    <div class="col-4">
                        <div class="small">إجمالي المبيعات</div>
                        <div class="h5">${_formatCurrency(total)}</div>
                    </div>
                    <div class="col-4">
                        <div class="small">متوسط الفاتورة</div>
                        <div class="h5">${_formatCurrency(avgTicket)}</div>
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-sm table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>رقم</th>
                            <th>التاريخ</th>
                            <th>العميل</th>
                            <th>المبلغ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(inv => `
                            <tr>
                                <td>#${inv.number}</td>
                                <td>${inv.date}</td>
                                <td>${inv.customer}</td>
                                <td class="fw-bold">${_formatCurrency(inv.total)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ================== تقرير الموردين ==================
    function updateSupplierReport() {
        const purchases = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PURCHASES)) || [];
        const suppliers = JSON.parse(localStorage.getItem('ryan_suppliers')) || [];
        
        const supplierStats = {};
        
        purchases.forEach(pur => {
            if (!supplierStats[pur.supplier]) {
                supplierStats[pur.supplier] = {
                    count: 0,
                    total: 0,
                    items: 0
                };
            }
            supplierStats[pur.supplier].count += 1;
            supplierStats[pur.supplier].total += pur.total;
            supplierStats[pur.supplier].items += pur.items.reduce((sum, item) => sum + item.qty, 0);
        });
        
        const container = document.getElementById('supplier-report-container');
        if (!container) return;
        
        if (suppliers.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">لا يوجد موردين</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-hover">
                    <thead class="table-success">
                        <tr>
                            <th>المورد</th>
                            <th>عدد الفواتير</th>
                            <th>إجمالي المشتريات</th>
                            <th>عدد القطع</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${suppliers.map(s => {
                            const stats = supplierStats[s.name] || { count: 0, total: 0, items: 0 };
                            return `
                                <tr>
                                    <td>${s.name}</td>
                                    <td>${stats.count}</td>
                                    <td>${_formatCurrency(stats.total)}</td>
                                    <td>${stats.items}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ================== تقرير العملاء ==================
    function updateCustomerReport() {
        const invoices = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.INVOICES)) || [];
        const customers = JSON.parse(localStorage.getItem('ryan_customers')) || [];
        
        const customerStats = {};
        
        invoices.forEach(inv => {
            if (!customerStats[inv.customer]) {
                customerStats[inv.customer] = {
                    count: 0,
                    total: 0,
                    items: 0
                };
            }
            customerStats[inv.customer].count += 1;
            customerStats[inv.customer].total += inv.total;
            customerStats[inv.customer].items += inv.items.reduce((sum, item) => sum + item.qty, 0);
        });
        
        const container = document.getElementById('customer-report-container');
        if (!container) return;
        
        if (customers.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">لا يوجد عملاء</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-hover">
                    <thead class="table-primary">
                        <tr>
                            <th>العميل</th>
                            <th>عدد الفواتير</th>
                            <th>إجمالي المشتريات</th>
                            <th>عدد القطع</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${customers.map(c => {
                            const stats = customerStats[c.name] || { count: 0, total: 0, items: 0 };
                            return `
                                <tr>
                                    <td>${c.name}</td>
                                    <td>${stats.count}</td>
                                    <td>${_formatCurrency(stats.total)}</td>
                                    <td>${stats.items}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ================== تقرير المصروفات ==================
    function updateExpensesReport() {
        const purchases = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PURCHASES)) || [];
        
        // تحليل المصروفات حسب الشهر
        const monthlyExpenses = {};
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        purchases.forEach(pur => {
            const date = new Date(pur.date.split(' ')[0].split('/').reverse().join('-'));
            const month = date.getMonth();
            const year = date.getFullYear();
            const key = `${year}-${month + 1}`;
            
            if (!monthlyExpenses[key]) {
                monthlyExpenses[key] = 0;
            }
            monthlyExpenses[key] += pur.total;
        });
        
        // مصروفات هذا الشهر
        const thisMonthKey = `${currentYear}-${currentMonth + 1}`;
        const thisMonthExpenses = monthlyExpenses[thisMonthKey] || 0;
        
        // إجمالي المصروفات
        const totalExpenses = purchases.reduce((sum, pur) => sum + pur.total, 0);
        
        const container = document.getElementById('expenses-report-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="row g-3">
                <div class="col-6">
                    <div class="card bg-light">
                        <div class="card-body text-center">
                            <div class="small text-muted">مصروفات هذا الشهر</div>
                            <div class="h4 text-danger">${_formatCurrency(thisMonthExpenses)}</div>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="card bg-light">
                        <div class="card-body text-center">
                            <div class="small text-muted">إجمالي المصروفات</div>
                            <div class="h4 text-primary">${_formatCurrency(totalExpenses)}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mt-3">
                <h6>المصروفات الشهرية:</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead class="table-warning">
                            <tr>
                                <th>الشهر</th>
                                <th>المبلغ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(monthlyExpenses)
                                .sort((a, b) => b[0].localeCompare(a[0]))
                                .slice(0, 6)
                                .map(([month, amount]) => {
                                    const [year, m] = month.split('-');
                                    const monthName = new Date(year, m - 1).toLocaleDateString('ar-DZ', { month: 'long' });
                                    return `
                                        <tr>
                                            <td>${monthName} ${year}</td>
                                            <td>${_formatCurrency(amount)}</td>
                                        </tr>
                                    `;
                                }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // ================== تقرير رأس المال ==================
    function updateCapitalReport() {
        const stock = JSON.parse(localStorage.getItem('ryan_stock')) || [];
        const purchases = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PURCHASES)) || [];
        const invoices = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.INVOICES)) || [];
        
        const capital = stock.reduce((sum, item) => sum + (item.qty * item.buyPrice), 0);
        const stockValue = stock.reduce((sum, item) => sum + (item.qty * item.sellPrice), 0);
        const potentialProfit = stockValue - capital;
        
        const totalPurchases = purchases.reduce((sum, pur) => sum + pur.total, 0);
        const totalSales = invoices.reduce((sum, inv) => sum + inv.total, 0);
        const realizedProfit = totalSales - totalPurchases;
        
        const container = document.getElementById('capital-report-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="row g-3">
                <div class="col-6">
                    <div class="card border-success">
                        <div class="card-body text-center">
                            <i class="material-icons-round text-success">inventory</i>
                            <div class="small">رأس المال المستثمر</div>
                            <div class="h5">${_formatCurrency(capital)}</div>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="card border-primary">
                        <div class="card-body text-center">
                            <i class="material-icons-round text-primary">store</i>
                            <div class="small">قيمة المخزون (بيع)</div>
                            <div class="h5">${_formatCurrency(stockValue)}</div>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="card border-warning">
                        <div class="card-body text-center">
                            <i class="material-icons-round text-warning">trending_up</i>
                            <div class="small">أرباح محتملة</div>
                            <div class="h5 ${potentialProfit >= 0 ? 'text-success' : 'text-danger'}">
                                ${_formatCurrency(potentialProfit)}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="card border-info">
                        <div class="card-body text-center">
                            <i class="material-icons-round text-info">paid</i>
                            <div class="small">أرباح محققة</div>
                            <div class="h5 ${realizedProfit >= 0 ? 'text-success' : 'text-danger'}">
                                ${_formatCurrency(realizedProfit)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ================== تقرير الرسم البياني ==================
    function updateChartReport() {
        // هذا يتطلب مكتبة رسوم بيانية مثل Chart.js
        // يمكن إضافته لاحقاً
        const container = document.getElementById('chart-report-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="text-center p-5">
                <i class="material-icons-round" style="font-size: 64px; color: #ccc;">show_chart</i>
                <p class="text-muted mt-3">الرسوم البيانية قيد التطوير</p>
                <p class="small">سيتم إضافة رسوم بيانية للمبيعات والمشتريات قريباً</p>
            </div>
        `;
    }

    // ================== تقرير المراجعة ==================
    function updateAuditReport() {
        const invoices = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.INVOICES)) || [];
        const purchases = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PURCHASES)) || [];
        const stock = JSON.parse(localStorage.getItem('ryan_stock')) || [];
        
        // حساب المؤشرات
        const totalSales = invoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalPurchases = purchases.reduce((sum, pur) => sum + pur.total, 0);
        const stockValue = stock.reduce((sum, item) => sum + (item.qty * item.buyPrice), 0);
        
        // عدد المنتجات
        const totalProducts = stock.length;
        const lowStockCount = stock.filter(p => p.qty < 5).length;
        
        const container = document.getElementById('audit-report-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="row g-3">
                <div class="col-6">
                    <div class="card">
                        <div class="card-body">
                            <h6>ملخص عام</h6>
                            <hr>
                            <p>📊 إجمالي المبيعات: <span class="fw-bold">${_formatCurrency(totalSales)}</span></p>
                            <p>📦 إجمالي المشتريات: <span class="fw-bold">${_formatCurrency(totalPurchases)}</span></p>
                            <p>🏪 قيمة المخزون: <span class="fw-bold">${_formatCurrency(stockValue)}</span></p>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="card">
                        <div class="card-body">
                            <h6>إحصائيات المخزون</h6>
                            <hr>
                            <p>📦 عدد المنتجات: <span class="fw-bold">${totalProducts}</span></p>
                            <p>⚠️ منتجات تحت النقص: <span class="fw-bold text-danger">${lowStockCount}</span></p>
                            <p>✅ منتجات متوفرة: <span class="fw-bold text-success">${totalProducts - lowStockCount}</span></p>
                        </div>
                    </div>
                </div>
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            <h6>آخر التحديثات</h6>
                            <hr>
                            <div class="small">
                                <p>🕐 آخر فاتورة مبيعات: ${invoices.length > 0 ? invoices[invoices.length - 1].date : 'لا توجد'}</p>
                                <p>🕐 آخر فاتورة مشتريات: ${purchases.length > 0 ? purchases[purchases.length - 1].date : 'لا توجد'}</p>
                                <p>🕐 آخر حركة مخزون: ${movements.length > 0 ? movements[movements.length - 1].date : 'لا توجد'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ================== تصدير الوحدة ==================
    return {
        renderReports,
        showReportTab,
        updateLowStockThreshold,
        updateLowStockList,
        updateTopProducts,
        updateMovementsList,
        filterSalesByDate,
        updateSupplierReport,
        updateCustomerReport,
        updateExpensesReport,
        updateCapitalReport,
        updateChartReport,
        updateAuditReport
    };
})();

// ================== تصدير للاستخدام العام ==================
window.reportsModule = reportsModule;

// تهيئة تلقائية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('reports')) {
        reportsModule.renderReports();
    }
});
