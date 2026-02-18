// ================== نظام التقارير والديون المتكامل - النسخة النهائية ==================
const reportsModule = (function() {
    // ================== المتغيرات الخاصة ==================
    let movements = JSON.parse(localStorage.getItem('ryan_movements')) || [];
    let payments = JSON.parse(localStorage.getItem('payment_history')) || [];
    
    // ثوابت للتكوين
    const CONFIG = {
        CURRENCY: 'دج',
        STORAGE_KEYS: {
            MOVEMENTS: 'ryan_movements',
            INVOICES: 'ryan_invoices',
            PURCHASES: 'ryan_purchases',
            CUSTOMERS: 'ryan_customers',
            SUPPLIERS: 'ryan_suppliers',
            STOCK: 'ryan_stock',
            PAYMENTS: 'payment_history'
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
            case 'report-products':
                renderProductsReport();
                break;
            case 'report-categories':
                renderCategoriesReport();
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
            case 'report-customer-debts':
                renderCustomerDebts();
                break;
            case 'report-supplier-debts':
                renderSupplierDebts();
                break;
            case 'report-debt-summary':
                renderDebtSummary();
                break;
        }
    }

    // ================== تحديث التقارير الرئيسية ==================
    function renderReports() {
        const invoices = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.INVOICES)) || [];
        const purchases = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PURCHASES)) || [];
        
        const totalSales = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const totalPurchases = purchases.reduce((sum, pur) => sum + (pur.total || 0), 0);
        const profits = totalSales - totalPurchases;
        
        const elements = {
            'total-sales': totalSales,
            'total-purchases': totalPurchases,
            'total-profits': profits,
            'total-sales-count': invoices.length,
            'total-purchases-count': purchases.length
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                if (id.includes('count')) {
                    el.textContent = value;
                } else {
                    el.textContent = value.toFixed(2);
                }
            }
        });
    }

    // ================== تقرير المنتجات ==================
    function renderProductsReport() {
        const stock = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.STOCK)) || [];
        const categories = [...new Set(stock.map(p => p.category || 'عام'))];
        
        // تحديث الإحصائيات العامة
        const productsCount = document.getElementById('products-count');
        const categoriesCount = document.getElementById('categories-count');
        const stockValue = document.getElementById('stock-value');
        
        if (productsCount) productsCount.textContent = stock.length;
        if (categoriesCount) categoriesCount.textContent = categories.length;
        
        const totalValue = stock.reduce((sum, p) => sum + ((p.qty || 0) * (p.buyPrice || 0)), 0);
        if (stockValue) stockValue.textContent = totalValue.toFixed(2) + ' دج';
        
        // عرض تفاصيل الأصناف
        const tbody = document.getElementById('products-category-tbody');
        if (!tbody) return;
        
        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">لا توجد بيانات</td></tr>';
            return;
        }
        
        tbody.innerHTML = categories.map(cat => {
            const catProducts = stock.filter(p => (p.category || 'عام') === cat);
            const totalQty = catProducts.reduce((sum, p) => sum + (p.qty || 0), 0);
            const totalValue = catProducts.reduce((sum, p) => sum + ((p.qty || 0) * (p.buyPrice || 0)), 0);
            return `
                <tr>
                    <td>${cat}</td>
                    <td>${catProducts.length}</td>
                    <td>${totalQty}</td>
                    <td>${totalValue.toFixed(2)} دج</td>
                </tr>
            `;
        }).join('');
    }

    // ================== تقرير الأصناف ==================
    function renderCategoriesReport() {
        const stock = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.STOCK)) || [];
        const categories = {};
        
        stock.forEach(p => {
            const cat = p.category || 'عام';
            if (!categories[cat]) {
                categories[cat] = {
                    count: 0,
                    totalBuy: 0,
                    totalSell: 0,
                    qty: 0
                };
            }
            categories[cat].count++;
            categories[cat].totalBuy += (p.buyPrice || 0) * (p.qty || 0);
            categories[cat].totalSell += (p.sellPrice || 0) * (p.qty || 0);
            categories[cat].qty += (p.qty || 0);
        });
        
        const tbody = document.getElementById('categories-tbody');
        if (!tbody) return;
        
        if (Object.keys(categories).length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">لا توجد بيانات</td></tr>';
            return;
        }
        
        tbody.innerHTML = Object.entries(categories).map(([cat, data]) => `
            <tr>
                <td>${cat}</td>
                <td>${data.count}</td>
                <td>${data.qty}</td>
                <td>${data.totalBuy.toFixed(2)} دج</td>
                <td>${data.totalSell.toFixed(2)} دج</td>
            </tr>
        `).join('');
    }

    // ================== تقرير النواقص ==================
    function updateLowStockThreshold(val) {
        const threshold = document.getElementById('low-stock-threshold');
        if (threshold) threshold.textContent = val;
        updateLowStockList();
    }

    function updateLowStockList() {
        const threshold = parseInt(document.getElementById('threshold-input')?.value) || 5;
        const stock = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.STOCK)) || [];
        const lowStock = stock.filter(p => (p.qty || 0) < threshold);
        
        const list = document.getElementById('low-stock-list');
        if (!list) return;
        
        if (lowStock.length === 0) {
            list.innerHTML = '<div class="list-group-item text-center text-success">✅ لا توجد منتجات تحت الحد المحدد</div>';
        } else {
            list.innerHTML = lowStock.map(p => 
                `<div class="list-group-item d-flex justify-content-between align-items-center">
                    <span><i class="material-icons-round text-danger">warning</i> ${p.name}</span>
                    <span class="badge bg-danger">${p.qty || 0} ${p.unit || ''}</span>
                </div>`
            ).join('');
        }
    }

    // ================== تقرير الأكثر مبيعاً ==================
    function updateTopProducts() {
        const invoices = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.INVOICES)) || [];
        const productSales = {};
        
        invoices.forEach(inv => {
            if (inv.items && Array.isArray(inv.items)) {
                inv.items.forEach(item => {
                    if (!productSales[item.name]) {
                        productSales[item.name] = { qty: 0, total: 0 };
                    }
                    productSales[item.name].qty += item.qty || 0;
                    productSales[item.name].total += item.total || 0;
                });
            }
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
                            <span class="badge bg-success">${data.total.toFixed(2)} دج</span>
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
                    default:
                        icon = '📝';
                }
                
                return `
                    <div class="list-group-item d-flex justify-content-between align-items-center ${color}">
                        <span>${icon} ${m.date || ''}</span>
                        <span>${m.type} - ${m.product || ''} (${m.qty || 0})</span>
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
            if (!inv.date) return false;
            const invDate = new Date(inv.date.split(' ')[0].split('/').reverse().join('-'));
            return invDate >= startDate && invDate <= endDate;
        });

        const total = filtered.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const count = filtered.length;
        const avgTicket = count > 0 ? total / count : 0;
        
        const resultDiv = document.getElementById('date-sales-result');
        if (!resultDiv) return;
        
        if (filtered.length === 0) {
            resultDiv.innerHTML = '<div class="alert alert-info">لا توجد مبيعات في هذه الفترة</div>';
            return;
        }
        
        resultDiv.innerHTML = `
            <div class="alert alert-info">
                <div class="row text-center">
                    <div class="col-4">
                        <div class="small">عدد الفواتير</div>
                        <div class="h5">${count}</div>
                    </div>
                    <div class="col-4">
                        <div class="small">إجمالي المبيعات</div>
                        <div class="h5">${total.toFixed(2)} دج</div>
                    </div>
                    <div class="col-4">
                        <div class="small">متوسط الفاتورة</div>
                        <div class="h5">${avgTicket.toFixed(2)} دج</div>
                    </div>
                </div>
            </div>
            <div class="table-responsive" style="max-height: 200px; overflow-y: auto;">
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
                                <td>#${inv.number || ''}</td>
                                <td>${inv.date || ''}</td>
                                <td>${inv.customer || 'نقدي'}</td>
                                <td class="fw-bold">${(inv.total || 0).toFixed(2)} دج</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ================== حساب ديون العملاء ==================
    function calculateCustomerDebts() {
        const customers = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.CUSTOMERS)) || [];
        const invoices = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.INVOICES)) || [];
        const payments = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PAYMENTS)) || [];
        
        const debts = [];
        let totalDebt = 0;
        let debtorCount = 0;
        let creditorCount = 0;
        let maxDebt = 0;
        let totalPaid = 0;
        
        customers.forEach(customer => {
            // فواتير هذا العميل
            const customerInvoices = invoices.filter(inv => inv.customer === customer.name);
            const totalPurchases = customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
            
            // المدفوعات التي تمت
            const paid = payments
                .filter(p => p.customer === customer.name)
                .reduce((sum, p) => sum + (p.amount || 0), 0);
            
            const remaining = totalPurchases - paid;
            totalPaid += paid;
            
            // آخر فاتورة
            let lastInvoice = '-';
            if (customerInvoices.length > 0) {
                const sorted = customerInvoices.sort((a, b) => 
                    new Date(b.date) - new Date(a.date)
                );
                lastInvoice = sorted[0].date;
            }
            
            // آخر دفعة
            let lastPayment = '-';
            const customerPayments = payments.filter(p => p.customer === customer.name);
            if (customerPayments.length > 0) {
                const sorted = customerPayments.sort((a, b) => 
                    new Date(b.date) - new Date(a.date)
                );
                lastPayment = sorted[0].date;
            }
            
            const isOverdue = remaining > (customer.maxDebt || 0) && remaining > 0;
            
            if (remaining > 0) {
                totalDebt += remaining;
                debtorCount++;
                if (remaining > maxDebt) maxDebt = remaining;
            } else {
                creditorCount++;
            }
            
            debts.push({
                name: customer.name,
                phone: customer.phone || '-',
                totalPurchases: totalPurchases,
                paid: paid,
                remaining: remaining,
                maxDebt: customer.maxDebt || 0,
                lastInvoice: lastInvoice,
                lastPayment: lastPayment,
                paymentCount: customerPayments.length,
                isOverdue: isOverdue
            });
        });
        
        return {
            debts: debts.sort((a, b) => b.remaining - a.remaining),
            totalDebt: totalDebt,
            totalPaid: totalPaid,
            debtorCount: debtorCount,
            creditorCount: creditorCount,
            maxDebt: maxDebt,
            avgDebt: debtorCount > 0 ? totalDebt / debtorCount : 0
        };
    }

    // ================== عرض ديون العملاء ==================
    function renderCustomerDebts() {
        const data = calculateCustomerDebts();
        
        // تحديث الإحصائيات
        const totalEl = document.getElementById('total-customer-debt');
        const debtorEl = document.getElementById('debtor-customers-count');
        const creditorEl = document.getElementById('creditor-customers-count');
        
        if (totalEl) totalEl.textContent = data.totalDebt.toFixed(2) + ' دج';
        if (debtorEl) debtorEl.textContent = data.debtorCount;
        if (creditorEl) creditorEl.textContent = data.creditorCount;
        
        const tbody = document.getElementById('customer-debts-tbody');
        if (!tbody) return;
        
        if (data.debts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center p-4">لا توجد بيانات</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.debts.map(d => {
            let statusClass = 'bg-success';
            let statusText = 'دائن';
            
            if (d.remaining > 0) {
                if (d.isOverdue) {
                    statusClass = 'bg-danger';
                    statusText = 'متأخر ⚠️';
                } else {
                    statusClass = 'bg-warning';
                    statusText = 'مدين';
                }
            }
            
            return `
            <tr>
                <td>${d.name}</td>
                <td>${d.phone}</td>
                <td>${d.totalPurchases.toFixed(2)} دج</td>
                <td>${d.paid.toFixed(2)} دج</td>
                <td class="${d.remaining > 0 ? 'text-danger fw-bold' : 'text-success'}">${d.remaining.toFixed(2)} دج</td>
                <td>${d.maxDebt} دج</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    ${d.remaining > 0 ? 
                        `<button class="btn btn-sm btn-success" onclick="reportsModule.payCustomerDebt('${d.name}')">
                            <i class="material-icons-round">payment</i> تسديد
                        </button>` : 
                        `<span class="badge bg-success">مدفوع</span>`
                    }
                </td>
            </tr>
        `}).join('');
    }

    // ================== تسديد دين عميل ==================
    function payCustomerDebt(customerName) {
        const data = calculateCustomerDebts();
        const customer = data.debts.find(d => d.name === customerName);
        
        if (!customer) {
            _showNotification('خطأ', 'العميل غير موجود', 'error');
            return;
        }
        
        if (customer.remaining <= 0) {
            _showNotification('معلومات', 'لا توجد ديون مستحقة لهذا العميل', 'info');
            return;
        }
        
        Swal.fire({
            title: 'تسديد دين',
            html: `
                <div style="text-align:right; padding:10px;">
                    <p><strong>العميل:</strong> ${customerName}</p>
                    <p><strong>إجمالي الديون:</strong> ${customer.remaining.toFixed(2)} دج</p>
                    <hr>
                    <div class="form-group mb-3">
                        <label class="form-label">المبلغ المدفوع</label>
                        <input type="number" id="payment-amount" class="form-control" value="${customer.remaining}" min="1" max="${customer.remaining}">
                    </div>
                    <div class="form-group mb-3">
                        <label class="form-label">طريقة الدفع</label>
                        <select id="payment-method" class="form-select">
                            <option value="نقدي">💰 نقدي</option>
                            <option value="بطاقة">💳 بطاقة</option>
                            <option value="شيك">📝 شيك</option>
                            <option value="تحويل">🏦 تحويل بنكي</option>
                        </select>
                    </div>
                    <div class="form-group mb-3">
                        <label class="form-label">ملاحظات</label>
                        <textarea id="payment-notes" class="form-control" rows="2" placeholder="ملاحظات إضافية"></textarea>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'تأكيد الدفع',
            cancelButtonText: 'إلغاء',
            confirmButtonColor: '#28a745',
            preConfirm: () => {
                const amount = parseFloat(document.getElementById('payment-amount').value);
                const method = document.getElementById('payment-method').value;
                const notes = document.getElementById('payment-notes').value;
                
                if (isNaN(amount) || amount <= 0) {
                    Swal.showValidationMessage('الرجاء إدخال مبلغ صحيح');
                    return false;
                }
                
                if (amount > customer.remaining) {
                    Swal.showValidationMessage('المبلغ أكبر من الدين المتبقي');
                    return false;
                }
                
                return { amount, method, notes };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const { amount, method, notes } = result.value;
                
                // تسجيل الدفعة
                const payment = {
                    id: Date.now(),
                    customer: customerName,
                    amount: amount,
                    method: method,
                    notes: notes,
                    date: new Date().toLocaleString('ar-DZ'),
                    timestamp: new Date().toISOString()
                };
                
                payments.push(payment);
                localStorage.setItem(CONFIG.STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
                
                const newRemaining = customer.remaining - amount;
                
                // إنشاء إيصال الدفع
                const receipt = `
                    <div style="text-align:right; font-family: 'Courier New', monospace; padding:10px;">
                        <h3 style="text-align:center;">إيصال سداد</h3>
                        <hr>
                        <p><strong>التاريخ:</strong> ${new Date().toLocaleString('ar-DZ')}</p>
                        <p><strong>العميل:</strong> ${customerName}</p>
                        <p><strong>المبلغ:</strong> ${amount.toFixed(2)} دج</p>
                        <p><strong>طريقة الدفع:</strong> ${method}</p>
                        ${notes ? `<p><strong>ملاحظات:</strong> ${notes}</p>` : ''}
                        <hr>
                        <p><strong>المتبقي بعد السداد:</strong> ${newRemaining.toFixed(2)} دج</p>
                        <p style="text-align:center; margin-top:20px;">شكراً لتعاملكم معنا</p>
                    </div>
                `;
                
                Swal.fire({
                    icon: 'success',
                    title: 'تم التسديد بنجاح',
                    html: receipt,
                    confirmButtonText: 'إغلاق'
                });
                
                // تحديث التقارير
                renderCustomerDebts();
                renderDebtSummary();
            }
        });
    }

    // ================== فلترة ديون العملاء ==================
    function filterCustomerDebts() {
        const filter = document.getElementById('debt-filter').value;
        const searchTerm = document.getElementById('debt-search').value.toLowerCase().trim();
        
        const data = calculateCustomerDebts();
        let filtered = data.debts;
        
        // تطبيق الفلتر
        switch(filter) {
            case 'debtor':
                filtered = filtered.filter(d => d.remaining > 0);
                break;
            case 'clean':
                filtered = filtered.filter(d => d.remaining <= 0);
                break;
        }
        
        // تطبيق البحث
        if (searchTerm) {
            filtered = filtered.filter(d => 
                d.name.toLowerCase().includes(searchTerm) || 
                d.phone.includes(searchTerm)
            );
        }
        
        renderFilteredCustomerDebts(filtered);
    }

    function renderFilteredCustomerDebts(filtered) {
        const tbody = document.getElementById('customer-debts-tbody');
        if (!tbody) return;
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center p-4">لا توجد نتائج</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.map(d => {
            let statusClass = 'bg-success';
            let statusText = 'دائن';
            
            if (d.remaining > 0) {
                if (d.isOverdue) {
                    statusClass = 'bg-danger';
                    statusText = 'متأخر ⚠️';
                } else {
                    statusClass = 'bg-warning';
                    statusText = 'مدين';
                }
            }
            
            return `
            <tr>
                <td>${d.name}</td>
                <td>${d.phone}</td>
                <td>${d.totalPurchases.toFixed(2)} دج</td>
                <td>${d.paid.toFixed(2)} دج</td>
                <td class="${d.remaining > 0 ? 'text-danger fw-bold' : 'text-success'}">${d.remaining.toFixed(2)} دج</td>
                <td>${d.maxDebt} دج</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    ${d.remaining > 0 ? 
                        `<button class="btn btn-sm btn-success" onclick="reportsModule.payCustomerDebt('${d.name}')">
                            <i class="material-icons-round">payment</i>
                        </button>` : 
                        `<span class="badge bg-success">✓</span>`
                    }
                </td>
            </tr>
        `}).join('');
    }

    // ================== البحث في ديون العملاء ==================
    function searchCustomerDebts() {
        filterCustomerDebts();
    }

    // ================== حساب ديون الموردين ==================
    function calculateSupplierDebts() {
        const suppliers = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SUPPLIERS)) || [];
        const purchases = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PURCHASES)) || [];
        
        const debts = [];
        let totalDebt = 0;
        let debtorCount = 0;
        let creditorCount = 0;
        let maxDebt = 0;
        
        suppliers.forEach(supplier => {
            const supplierPurchases = purchases.filter(p => p.supplier === supplier.name);
            const totalPurchases = supplierPurchases.reduce((sum, p) => sum + (p.total || 0), 0);
            
            // المدفوعات (نفترض 70% مدفوع)
            const paid = totalPurchases * 0.7;
            const remaining = totalPurchases - paid;
            
            let lastInvoice = '-';
            if (supplierPurchases.length > 0) {
                const sorted = supplierPurchases.sort((a, b) => 
                    new Date(b.date) - new Date(a.date)
                );
                lastInvoice = sorted[0].date;
            }
            
            if (remaining > 0) {
                totalDebt += remaining;
                debtorCount++;
                if (remaining > maxDebt) maxDebt = remaining;
            } else {
                creditorCount++;
            }
            
            debts.push({
                name: supplier.name,
                phone: supplier.phone || '-',
                totalPurchases: totalPurchases,
                paid: paid,
                remaining: remaining,
                lastInvoice: lastInvoice,
                invoiceCount: supplierPurchases.length
            });
        });
        
        return {
            debts: debts.sort((a, b) => b.remaining - a.remaining),
            totalDebt: totalDebt,
            debtorCount: debtorCount,
            creditorCount: creditorCount,
            maxDebt: maxDebt,
            avgDebt: debtorCount > 0 ? totalDebt / debtorCount : 0
        };
    }

    // ================== عرض ديون الموردين ==================
    function renderSupplierDebts() {
        const data = calculateSupplierDebts();
        
        const totalEl = document.getElementById('total-supplier-debt');
        const debtorEl = document.getElementById('debtor-suppliers-count');
        const creditorEl = document.getElementById('creditor-suppliers-count');
        
        if (totalEl) totalEl.textContent = data.totalDebt.toFixed(2) + ' دج';
        if (debtorEl) debtorEl.textContent = data.debtorCount;
        if (creditorEl) creditorEl.textContent = data.creditorCount;
        
        const tbody = document.getElementById('supplier-debts-tbody');
        if (!tbody) return;
        
        if (data.debts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">لا توجد بيانات</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.debts.map(d => `
            <tr>
                <td>${d.name}</td>
                <td>${d.phone}</td>
                <td>${d.totalPurchases.toFixed(2)} دج</td>
                <td>${d.paid.toFixed(2)} دج</td>
                <td class="${d.remaining > 0 ? 'text-danger fw-bold' : 'text-success'}">${d.remaining.toFixed(2)} دج</td>
                <td>${d.lastInvoice}</td>
            </tr>
        `).join('');
    }

    // ================== عرض ملخص الديون ==================
    function renderDebtSummary() {
        const customerData = calculateCustomerDebts();
        const supplierData = calculateSupplierDebts();
        
        // ديون العملاء
        const summaryCustomerDebt = document.getElementById('summary-customer-debt');
        const summaryDebtorCustomers = document.getElementById('summary-debtor-customers');
        const maxCustomerDebt = document.getElementById('max-customer-debt');
        const avgCustomerDebt = document.getElementById('avg-customer-debt');
        
        if (summaryCustomerDebt) summaryCustomerDebt.textContent = customerData.totalDebt.toFixed(2) + ' دج';
        if (summaryDebtorCustomers) summaryDebtorCustomers.textContent = customerData.debtorCount;
        if (maxCustomerDebt) maxCustomerDebt.textContent = customerData.maxDebt.toFixed(2) + ' دج';
        if (avgCustomerDebt) avgCustomerDebt.textContent = customerData.avgDebt.toFixed(2) + ' دج';
        
        // ديون الموردين
        const summarySupplierDebt = document.getElementById('summary-supplier-debt');
        const summaryDebtorSuppliers = document.getElementById('summary-debtor-suppliers');
        const maxSupplierDebt = document.getElementById('max-supplier-debt');
        const avgSupplierDebt = document.getElementById('avg-supplier-debt');
        
        if (summarySupplierDebt) summarySupplierDebt.textContent = supplierData.totalDebt.toFixed(2) + ' دج';
        if (summaryDebtorSuppliers) summaryDebtorSuppliers.textContent = supplierData.debtorCount;
        if (maxSupplierDebt) maxSupplierDebt.textContent = supplierData.maxDebt.toFixed(2) + ' دج';
        if (avgSupplierDebt) avgSupplierDebt.textContent = supplierData.avgDebt.toFixed(2) + ' دج';
        
        // صافي الديون
        const netDebt = document.getElementById('net-debt');
        if (netDebt) netDebt.textContent = (customerData.totalDebt - supplierData.totalDebt).toFixed(2) + ' دج';
    }

    // ================== تصدير ديون العملاء إلى Excel ==================
    function exportDebtsToExcel() {
        const data = calculateCustomerDebts();
        
        const rows = data.debts.map(d => ({
            'العميل': d.name,
            'الهاتف': d.phone,
            'إجمالي المشتريات': d.totalPurchases.toFixed(2),
            'المدفوع': d.paid.toFixed(2),
            'المتبقي': d.remaining.toFixed(2),
            'الحد المسموح': d.maxDebt,
            'الحالة': d.remaining > 0 ? (d.isOverdue ? 'متأخر' : 'مدين') : 'دائن'
        }));
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "ديون العملاء");
        
        const today = new Date();
        const dateStr = `${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}`;
        XLSX.writeFile(wb, `ديون_العملاء_${dateStr}.xlsx`);
        
        _showNotification('نجاح', 'تم تصدير التقرير بنجاح', 'success');
    }

    // ================== تصدير الوحدة ==================
    return {
        showReportTab,
        renderReports,
        renderProductsReport,
        renderCategoriesReport,
        updateLowStockThreshold,
        updateLowStockList,
        updateTopProducts,
        updateMovementsList,
        filterSalesByDate,
        renderCustomerDebts,
        renderSupplierDebts,
        renderDebtSummary,
        filterCustomerDebts,
        searchCustomerDebts,
        payCustomerDebt,
        exportDebtsToExcel
    };
})();

// ================== تصدير للاستخدام العام ==================
window.reportsModule = reportsModule;

// تهيئة تلقائية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('reports')) {
        setTimeout(() => {
            if (typeof window.reportsModule !== 'undefined') {
                window.reportsModule.renderReports();
            }
        }, 500);
    }
});
