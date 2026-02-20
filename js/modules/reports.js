// ================== reports.js - التقارير والإحصائيات ==================
// الرقم 25 في ترتيب الملفات - يعتمد على utils.js وجميع الوحدات الأخرى

const reportsModule = (function() {
    // ================== دوال مساعدة داخلية ==================
    
    // ================== تقرير المبيعات ==================
    function getSalesReport(startDate, endDate) {
        const salesInvoices = window.salesModule?.getInvoices() || [];
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        
        const filtered = salesInvoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= start && invDate <= end;
        });
        
        // تحليل المبيعات
        const totalAmount = filtered.reduce((sum, inv) => sum + inv.grandTotal, 0);
        const totalDiscount = filtered.reduce((sum, inv) => sum + (inv.totalDiscount || 0), 0);
        const averagePerInvoice = filtered.length > 0 ? totalAmount / filtered.length : 0;
        
        // المبيعات حسب طريقة الدفع
        const byPaymentMethod = {
            cash: filtered.filter(inv => inv.paymentMethod === 'cash').reduce((sum, inv) => sum + inv.grandTotal, 0),
            card: filtered.filter(inv => inv.paymentMethod === 'card').reduce((sum, inv) => sum + inv.grandTotal, 0),
            credit: filtered.filter(inv => inv.paymentMethod === 'credit').reduce((sum, inv) => sum + inv.grandTotal, 0)
        };
        
        // المبيعات اليومية
        const dailySales = {};
        filtered.forEach(inv => {
            const date = new Date(inv.date).toDateString();
            dailySales[date] = (dailySales[date] || 0) + inv.grandTotal;
        });
        
        return {
            period: { start, end },
            count: filtered.length,
            totalAmount,
            totalDiscount,
            averagePerInvoice,
            byPaymentMethod,
            dailySales,
            invoices: filtered
        };
    }
    
    // ================== تقرير المشتريات ==================
    function getPurchasesReport(startDate, endDate) {
        const purchaseInvoices = window.purchasesModule?.getInvoices() || [];
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        
        const filtered = purchaseInvoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= start && invDate <= end;
        });
        
        const totalAmount = filtered.reduce((sum, inv) => sum + inv.grandTotal, 0);
        const averagePerInvoice = filtered.length > 0 ? totalAmount / filtered.length : 0;
        
        // المشتريات حسب طريقة الدفع
        const byPaymentMethod = {
            cash: filtered.filter(inv => inv.paymentMethod === 'cash').reduce((sum, inv) => sum + inv.grandTotal, 0),
            check: filtered.filter(inv => inv.paymentMethod === 'check').reduce((sum, inv) => sum + inv.grandTotal, 0),
            transfer: filtered.filter(inv => inv.paymentMethod === 'transfer').reduce((sum, inv) => sum + inv.grandTotal, 0),
            credit: filtered.filter(inv => inv.paymentMethod === 'credit').reduce((sum, inv) => sum + inv.grandTotal, 0)
        };
        
        return {
            period: { start, end },
            count: filtered.length,
            totalAmount,
            averagePerInvoice,
            byPaymentMethod,
            invoices: filtered
        };
    }
    
    // ================== تقرير الأرباح ==================
    function getProfitReport(startDate, endDate) {
        const sales = getSalesReport(startDate, endDate);
        const purchases = getPurchasesReport(startDate, endDate);
        
        // حساب التكلفة المقدرة للمبيعات (بناءً على آخر سعر شراء)
        let estimatedCost = 0;
        sales.invoices.forEach(inv => {
            inv.items.forEach(item => {
                // البحث عن المنتج لمعرفة سعر شرائه
                const product = window.productModule?.getProduct(item.productId);
                if (product) {
                    estimatedCost += product.buyPrice * item.qty;
                }
            });
        });
        
        const grossProfit = sales.totalAmount - estimatedCost;
        const profitMargin = sales.totalAmount > 0 ? (grossProfit / sales.totalAmount) * 100 : 0;
        
        return {
            period: { start: sales.period.start, end: sales.period.end },
            sales: sales.totalAmount,
            purchases: purchases.totalAmount,
            estimatedCost,
            grossProfit,
            profitMargin,
            netProfit: grossProfit - (purchases.totalAmount - estimatedCost) // تبسيط
        };
    }
    
    // ================== أكثر المنتجات مبيعاً ==================
    function getTopProducts(limit = 10, startDate, endDate) {
        const salesInvoices = window.salesModule?.getInvoices() || [];
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        
        const filtered = salesInvoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= start && invDate <= end;
        });
        
        const productSales = {};
        
        filtered.forEach(inv => {
            inv.items.forEach(item => {
                if (!productSales[item.name]) {
                    productSales[item.name] = {
                        name: item.name,
                        productId: item.productId,
                        quantity: 0,
                        total: 0,
                        count: 0
                    };
                }
                productSales[item.name].quantity += item.qty;
                productSales[item.name].total += item.total;
                productSales[item.name].count += 1;
            });
        });
        
        return Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, limit);
    }
    
    // ================== المنتجات الأقل مبيعاً ==================
    function getBottomProducts(limit = 10, startDate, endDate) {
        const topProducts = getTopProducts(1000, startDate, endDate);
        return [...topProducts].sort((a, b) => a.quantity - b.quantity).slice(0, limit);
    }
    
    // ================== المنتجات الناقصة ==================
    function getLowStockProducts() {
        return window.productModule?.getLowStockProducts() || [];
    }
    
    // ================== المنتجات المنتهية الصلاحية ==================
    function getExpiringProducts(daysThreshold = 30) {
        const products = window.productModule?.getAllProducts() || [];
        const now = new Date();
        const threshold = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);
        
        return products.filter(p => {
            if (!p.expiryDate) return false;
            const expiry = new Date(p.expiryDate);
            return expiry <= threshold && expiry >= now;
        });
    }
    
    // ================== أكثر العملاء شراءً ==================
    function getTopCustomers(limit = 5, startDate, endDate) {
        const salesInvoices = window.salesModule?.getInvoices() || [];
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        
        const filtered = salesInvoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= start && invDate <= end;
        });
        
        const customerTotals = {};
        
        filtered.forEach(inv => {
            const customer = inv.customer || 'زبون نقدي';
            if (!customerTotals[customer]) {
                customerTotals[customer] = {
                    name: customer,
                    customerId: inv.customerId,
                    count: 0,
                    total: 0
                };
            }
            customerTotals[customer].count++;
            customerTotals[customer].total += inv.grandTotal;
        });
        
        return Object.values(customerTotals)
            .sort((a, b) => b.total - a.total)
            .slice(0, limit);
    }
    
    // ================== أكثر الموردين تعاملاً ==================
    function getTopSuppliers(limit = 5, startDate, endDate) {
        const purchaseInvoices = window.purchasesModule?.getInvoices() || [];
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        
        const filtered = purchaseInvoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= start && invDate <= end;
        });
        
        const supplierTotals = {};
        
        filtered.forEach(inv => {
            const supplier = inv.supplier || 'مورد';
            if (!supplierTotals[supplier]) {
                supplierTotals[supplier] = {
                    name: supplier,
                    supplierId: inv.supplierId,
                    count: 0,
                    total: 0
                };
            }
            supplierTotals[supplier].count++;
            supplierTotals[supplier].total += inv.grandTotal;
        });
        
        return Object.values(supplierTotals)
            .sort((a, b) => b.total - a.total)
            .slice(0, limit);
    }
    
    // ================== تقرير المخزون ==================
    function getInventoryReport() {
        const products = window.productModule?.getAllProducts() || [];
        const inventoryLogs = window.inventoryModule?.inventoryLogs || [];
        
        const totalValue = products.reduce((sum, p) => sum + (p.buyPrice * p.quantity), 0);
        const totalSellValue = products.reduce((sum, p) => sum + (p.sellPrice * p.quantity), 0);
        const lowStock = products.filter(p => p.quantity <= p.minStock);
        const outOfStock = products.filter(p => p.quantity === 0);
        
        // قيمة المخزون حسب التصنيف
        const byCategory = {};
        products.forEach(p => {
            const cat = p.category || 'عام';
            if (!byCategory[cat]) {
                byCategory[cat] = {
                    category: cat,
                    count: 0,
                    quantity: 0,
                    value: 0
                };
            }
            byCategory[cat].count++;
            byCategory[cat].quantity += p.quantity;
            byCategory[cat].value += p.buyPrice * p.quantity;
        });
        
        return {
            totalProducts: products.length,
            totalQuantity: products.reduce((sum, p) => sum + p.quantity, 0),
            totalValue,
            totalSellValue,
            potentialProfit: totalSellValue - totalValue,
            lowStockCount: lowStock.length,
            outOfStockCount: outOfStock.length,
            lowStockProducts: lowStock,
            outOfStockProducts: outOfStock,
            byCategory: Object.values(byCategory),
            lastUpdate: new Date().toISOString()
        };
    }
    
    // ================== تقرير الديون ==================
    function getDebtReport() {
        const customers = window.customerModule?.getAllCustomers() || [];
        const suppliers = window.supplierModule?.getAllSuppliers() || [];
        
        const customerDebts = customers.filter(c => c.totalDebt > 0).map(c => ({
            name: c.name,
            type: 'عميل',
            debt: c.totalDebt,
            maxDebt: c.maxDebt,
            percentage: c.maxDebt > 0 ? (c.totalDebt / c.maxDebt) * 100 : 0
        }));
        
        const supplierDebts = suppliers.filter(s => s.totalDebt > 0).map(s => ({
            name: s.name,
            type: 'مورد',
            debt: s.totalDebt,
            creditLimit: s.creditLimit,
            percentage: s.creditLimit > 0 ? (s.totalDebt / s.creditLimit) * 100 : 0
        }));
        
        const totalCustomerDebt = customerDebts.reduce((sum, d) => sum + d.debt, 0);
        const totalSupplierDebt = supplierDebts.reduce((sum, d) => sum + d.debt, 0);
        
        return {
            totalDebt: totalCustomerDebt + totalSupplierDebt,
            customerDebt: totalCustomerDebt,
            supplierDebt: totalSupplierDebt,
            customerCount: customerDebts.length,
            supplierCount: supplierDebts.length,
            customerDetails: customerDebts,
            supplierDetails: supplierDebts
        };
    }
    
    // ================== إحصائيات عامة ==================
    function getDashboardStats() {
        const products = window.productModule?.getAllProducts() || [];
        const customers = window.customerModule?.getAllCustomers() || [];
        const suppliers = window.supplierModule?.getAllSuppliers() || [];
        const salesInvoices = window.salesModule?.getInvoices() || [];
        const purchaseInvoices = window.purchasesModule?.getInvoices() || [];
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const todaySales = salesInvoices.filter(inv => new Date(inv.date) >= today);
        const monthSales = salesInvoices.filter(inv => new Date(inv.date) >= thisMonth);
        
        const stats = {
            // إحصائيات سريعة
            products: {
                count: products.length,
                lowStock: products.filter(p => p.quantity <= p.minStock).length,
                outOfStock: products.filter(p => p.quantity === 0).length
            },
            customers: {
                count: customers.length,
                withDebt: customers.filter(c => c.totalDebt > 0).length
            },
            suppliers: {
                count: suppliers.length,
                withDebt: suppliers.filter(s => s.totalDebt > 0).length
            },
            sales: {
                count: salesInvoices.length,
                today: todaySales.length,
                thisMonth: monthSales.length,
                total: salesInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
                todayTotal: todaySales.reduce((sum, inv) => sum + inv.grandTotal, 0),
                monthTotal: monthSales.reduce((sum, inv) => sum + inv.grandTotal, 0)
            },
            purchases: {
                count: purchaseInvoices.length,
                total: purchaseInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0)
            }
        };
        
        // حساب الربح التقريبي
        stats.profit = stats.sales.total - stats.purchases.total;
        stats.profitMargin = stats.sales.total > 0 ? (stats.profit / stats.sales.total) * 100 : 0;
        
        return stats;
    }
    
    // ================== تقرير المبيعات الشهرية ==================
    function getMonthlySalesReport(year) {
        const salesInvoices = window.salesModule?.getInvoices() || [];
        const months = Array(12).fill(0).map((_, i) => ({
            month: i + 1,
            monthName: new Date(2000, i, 1).toLocaleDateString('ar-EG', { month: 'long' }),
            count: 0,
            total: 0
        }));
        
        salesInvoices.forEach(inv => {
            const date = new Date(inv.date);
            if (date.getFullYear() === year) {
                const month = date.getMonth();
                months[month].count++;
                months[month].total += inv.grandTotal;
            }
        });
        
        return {
            year,
            months,
            total: months.reduce((sum, m) => sum + m.total, 0),
            average: months.reduce((sum, m) => sum + m.total, 0) / 12
        };
    }
    
    // ================== تقرير المبيعات اليومية ==================
    function getDailySalesReport(month, year) {
        const salesInvoices = window.salesModule?.getInvoices() || [];
        const daysInMonth = new Date(year, month, 0).getDate();
        const days = Array(daysInMonth).fill(0).map((_, i) => ({
            day: i + 1,
            count: 0,
            total: 0
        }));
        
        salesInvoices.forEach(inv => {
            const date = new Date(inv.date);
            if (date.getMonth() + 1 === month && date.getFullYear() === year) {
                const day = date.getDate() - 1;
                days[day].count++;
                days[day].total += inv.grandTotal;
            }
        });
        
        return {
            month,
            year,
            days,
            total: days.reduce((sum, d) => sum + d.total, 0)
        };
    }
    
    // ================== تصدير التقرير إلى CSV ==================
    function exportReportToCSV(reportData, filename, headers) {
        if (!reportData || reportData.length === 0) {
            utilsModule.showNotification('تنبيه', 'لا توجد بيانات للتصدير', 'warning');
            return;
        }
        
        utilsModule.exportToCSV(reportData, filename, headers);
    }
    
    // ================== تحديث لوحة التحكم ==================
    function updateDashboard() {
        const stats = getDashboardStats();
        
        // تحديث العناصر في HTML
        const elements = {
            'total-products': stats.products.count,
            'total-customers': stats.customers.count,
            'total-suppliers': stats.suppliers.count,
            'total-sales': stats.sales.total,
            'total-purchases': stats.purchases.total,
            'today-sales': stats.sales.todayTotal,
            'month-sales': stats.sales.monthTotal,
            'profit': stats.profit,
            'profit-margin': stats.profitMargin.toFixed(1)
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                if (id.includes('sales') || id.includes('purchases') || id.includes('profit')) {
                    el.textContent = utilsModule.formatCurrency(value);
                } else {
                    el.textContent = value;
                }
            }
        });
        
        // عرض المنتجات الناقصة
        const lowStock = getLowStockProducts();
        const lowStockEl = document.getElementById('low-stock-list');
        if (lowStockEl) {
            if (lowStock.length === 0) {
                lowStockEl.innerHTML = '<p class="text-success">لا توجد منتجات ناقصة</p>';
            } else {
                lowStockEl.innerHTML = `
                    <table class="table-custom">
                        <thead>
                            <tr>
                                <th>المنتج</th>
                                <th>الكمية</th>
                                <th>الحد الأدنى</th>
                                <th>النقص</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${lowStock.map(p => `
                                <tr>
                                    <td>${p.name}</td>
                                    <td>${p.quantity}</td>
                                    <td>${p.minStock}</td>
                                    <td>${p.minStock - p.quantity}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }
        }
        
        // عرض أفضل المنتجات
        const topProducts = getTopProducts(5);
        const topProductsEl = document.getElementById('top-products-list');
        if (topProductsEl) {
            if (topProducts.length === 0) {
                topProductsEl.innerHTML = '<p class="text-muted">لا توجد مبيعات كافية</p>';
            } else {
                topProductsEl.innerHTML = `
                    <table class="table-custom">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>المنتج</th>
                                <th>الكمية</th>
                                <th>الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${topProducts.map((p, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td>${p.name}</td>
                                    <td>${p.quantity}</td>
                                    <td>${utilsModule.formatCurrency(p.total)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }
        }
        
        // عرض أفضل العملاء
        const topCustomers = getTopCustomers(5);
        const topCustomersEl = document.getElementById('top-customers-list');
        if (topCustomersEl) {
            if (topCustomers.length === 0) {
                topCustomersEl.innerHTML = '<p class="text-muted">لا يوجد عملاء</p>';
            } else {
                topCustomersEl.innerHTML = `
                    <table class="table-custom">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>العميل</th>
                                <th>عدد الفواتير</th>
                                <th>الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${topCustomers.map((c, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td>${c.name}</td>
                                    <td>${c.count}</td>
                                    <td>${utilsModule.formatCurrency(c.total)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }
        }
    }
    
    // ================== رسم بياني للمبيعات ==================
    function drawSalesChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined') return;
        
        const ctx = canvas.getContext('2d');
        
        // تدمير الرسم البياني السابق إن وجد
        if (window.salesChart) {
            window.salesChart.destroy();
        }
        
        window.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
                datasets: [{
                    label: 'المبيعات',
                    data: data.values || [0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(220, 53, 69, 0.2)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 2,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString() + ' دج';
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return utilsModule.formatCurrency(context.raw) + ' دج';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // ================== تصدير التقرير إلى PDF (طباعة) ==================
    function printReport(reportType) {
        let title = '';
        let content = '';
        
        switch(reportType) {
            case 'sales':
                title = 'تقرير المبيعات';
                content = generateSalesReportHTML();
                break;
            case 'purchases':
                title = 'تقرير المشتريات';
                content = generatePurchasesReportHTML();
                break;
            case 'inventory':
                title = 'تقرير المخزون';
                content = generateInventoryReportHTML();
                break;
            case 'profit':
                title = 'تقرير الأرباح';
                content = generateProfitReportHTML();
                break;
            default:
                title = 'تقرير شامل';
                content = generateFullReportHTML();
        }
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: Arial; padding: 20px; }
                    h1 { text-align: center; color: #333; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .date { color: #666; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th { background: #f5f5f5; padding: 10px; border: 1px solid #ddd; }
                    td { padding: 8px; border: 1px solid #ddd; text-align: center; }
                    .summary { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; }
                    .footer { text-align: center; margin-top: 30px; color: #999; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${title}</h1>
                    <div class="date">تاريخ التقرير: ${utilsModule.formatDate(new Date())}</div>
                </div>
                ${content}
                <div class="footer">
                    <p>تم إنشاؤه بواسطة نظام سوبر - الإصدار 2.0.0</p>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }
    
    // ================== توليد HTML لتقرير المبيعات ==================
    function generateSalesReportHTML() {
        const stats = getDashboardStats();
        const topProducts = getTopProducts(10);
        
        let productsHTML = '';
        topProducts.forEach((p, i) => {
            productsHTML += `<tr><td>${i + 1}</td><td>${p.name}</td><td>${p.quantity}</td><td>${utilsModule.formatCurrency(p.total)}</td></tr>`;
        });
        
        return `
            <div class="summary">
                <h3>ملخص المبيعات</h3>
                <p>إجمالي المبيعات: ${utilsModule.formatCurrency(stats.sales.total)}</p>
                <p>عدد الفواتير: ${stats.sales.count}</p>
                <p>مبيعات اليوم: ${utilsModule.formatCurrency(stats.sales.todayTotal)}</p>
                <p>مبيعات هذا الشهر: ${utilsModule.formatCurrency(stats.sales.monthTotal)}</p>
            </div>
            <h3>أفضل المنتجات مبيعاً</h3>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>المنتج</th>
                        <th>الكمية</th>
                        <th>الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    ${productsHTML || '<tr><td colspan="4" style="text-align:center">لا توجد بيانات</td></tr>'}
                </tbody>
            </table>
        `;
    }
    
    // ================== توليد HTML لتقرير المخزون ==================
    function generateInventoryReportHTML() {
        const report = getInventoryReport();
        
        let categoryHTML = '';
        report.byCategory.forEach(c => {
            categoryHTML += `<tr><td>${c.category}</td><td>${c.count}</td><td>${c.quantity}</td><td>${utilsModule.formatCurrency(c.value)}</td></tr>`;
        });
        
        let lowStockHTML = '';
        report.lowStockProducts.forEach(p => {
            lowStockHTML += `<tr><td>${p.name}</td><td>${p.quantity}</td><td>${p.minStock}</td><td>${p.minStock - p.quantity}</td></tr>`;
        });
        
        return `
            <div class="summary">
                <h3>ملخص المخزون</h3>
                <p>إجمالي المنتجات: ${report.totalProducts}</p>
                <p>إجمالي الكميات: ${report.totalQuantity}</p>
                <p>قيمة المخزون (سعر الشراء): ${utilsModule.formatCurrency(report.totalValue)}</p>
                <p>قيمة المخزون (سعر البيع): ${utilsModule.formatCurrency(report.totalSellValue)}</p>
                <p>الربح المتوقع: ${utilsModule.formatCurrency(report.potentialProfit)}</p>
                <p>منتجات ناقصة: ${report.lowStockCount}</p>
                <p>منتجات نافدة: ${report.outOfStockCount}</p>
            </div>
            <h3>المخزون حسب التصنيف</h3>
            <table>
                <thead>
                    <tr>
                        <th>التصنيف</th>
                        <th>عدد المنتجات</th>
                        <th>الكمية</th>
                        <th>القيمة</th>
                    </tr>
                </thead>
                <tbody>
                    ${categoryHTML || '<tr><td colspan="4" style="text-align:center">لا توجد بيانات</td></tr>'}
                </tbody>
            </table>
            <h3>المنتجات الناقصة</h3>
            <table>
                <thead>
                    <tr>
                        <th>المنتج</th>
                        <th>الكمية</th>
                        <th>الحد الأدنى</th>
                        <th>النقص</th>
                    </tr>
                </thead>
                <tbody>
                    ${lowStockHTML || '<tr><td colspan="4" style="text-align:center">لا توجد منتجات ناقصة</td></tr>'}
                </tbody>
            </table>
        `;
    }
    
    // ================== توليد HTML لتقرير الأرباح ==================
    function generateProfitReportHTML() {
        const profit = getProfitReport();
        
        return `
            <div class="summary">
                <h3>تقرير الأرباح</h3>
                <p>إجمالي المبيعات: ${utilsModule.formatCurrency(profit.sales)}</p>
                <p>إجمالي المشتريات: ${utilsModule.formatCurrency(profit.purchases)}</p>
                <p>التكلفة التقديرية: ${utilsModule.formatCurrency(profit.estimatedCost)}</p>
                <p>الربح الإجمالي: ${utilsModule.formatCurrency(profit.grossProfit)}</p>
                <p>هامش الربح: ${profit.profitMargin.toFixed(2)}%</p>
                <p>صافي الربح: ${utilsModule.formatCurrency(profit.netProfit)}</p>
            </div>
        `;
    }
    
    // ================== توليد HTML لتقرير شامل ==================
    function generateFullReportHTML() {
        const stats = getDashboardStats();
        const profit = getProfitReport();
        
        return `
            <div class="summary">
                <h3>إحصائيات عامة</h3>
                <p>عدد المنتجات: ${stats.products.count}</p>
                <p>عدد العملاء: ${stats.customers.count}</p>
                <p>عدد الموردين: ${stats.suppliers.count}</p>
                <p>إجمالي المبيعات: ${utilsModule.formatCurrency(stats.sales.total)}</p>
                <p>إجمالي المشتريات: ${utilsModule.formatCurrency(stats.purchases.total)}</p>
                <p>الربح: ${utilsModule.formatCurrency(profit.netProfit)}</p>
                <p>هامش الربح: ${profit.profitMargin.toFixed(2)}%</p>
            </div>
            <div class="summary">
                <h3>ملخص اليوم</h3>
                <p>مبيعات اليوم: ${utilsModule.formatCurrency(stats.sales.todayTotal)}</p>
                <p>فواتير اليوم: ${stats.sales.today}</p>
            </div>
            <div class="summary">
                <h3>ملخص الشهر</h3>
                <p>مبيعات الشهر: ${utilsModule.formatCurrency(stats.sales.monthTotal)}</p>
                <p>فواتير الشهر: ${stats.sales.thisMonth}</p>
            </div>
        `;
    }
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ reportsModule initialized - الرقم 25');
        console.log('   جميع التقارير جاهزة');
        
        // تحديث لوحة التحكم
        updateDashboard();
        
        // رسم بياني تجريبي
        const monthlyReport = getMonthlySalesReport(new Date().getFullYear());
        drawSalesChart('salesChart', {
            labels: monthlyReport.months.map(m => m.monthName),
            values: monthlyReport.months.map(m => m.total)
        });
    }
    
    // ================== واجهة الوحدة ==================
    return {
        // تقارير المبيعات
        getSalesReport,
        getMonthlySalesReport,
        getDailySalesReport,
        
        // تقارير المشتريات
        getPurchasesReport,
        
        // تقارير الأرباح
        getProfitReport,
        
        // تقارير المنتجات
        getTopProducts,
        getBottomProducts,
        getLowStockProducts,
        getExpiringProducts,
        
        // تقارير العملاء والموردين
        getTopCustomers,
        getTopSuppliers,
        
        // تقارير المخزون
        getInventoryReport,
        
        // تقارير الديون
        getDebtReport,
        
        // إحصائيات
        getDashboardStats,
        
        // تحديث
        updateDashboard,
        
        // رسوم بيانية
        drawSalesChart,
        
        // تصدير
        exportReportToCSV,
        printReport,
        
        // تهيئة
        init
    };
})();

// ================== تصدير للاستخدام العام ==================
window.reportsModule = reportsModule;

// ================== دوال مختصرة للاستخدام في HTML ==================
window.showReportTab = (tabId) => {
    document.querySelectorAll('.report-content').forEach(r => r.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
    
    if (tabId === 'report-summary') {
        reportsModule.updateDashboard();
    } else if (tabId === 'report-lowstock') {
        const lowStock = reportsModule.getLowStockProducts();
        // تحديث العرض
    } else if (tabId === 'report-top') {
        const topProducts = reportsModule.getTopProducts();
        // تحديث العرض
    }
};

window.printSalesReport = () => reportsModule.printReport('sales');
window.printInventoryReport = () => reportsModule.printReport('inventory');
window.printProfitReport = () => reportsModule.printReport('profit');

// ================== تهيئة تلقائية ==================
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        if (reportsModule && reportsModule.init) {
            reportsModule.init();
        }
    });
    
    document.addEventListener('html-loaded', function() {
        if (reportsModule && reportsModule.init) {
            reportsModule.init();
        }
    });
}
