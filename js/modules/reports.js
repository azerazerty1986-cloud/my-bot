// ================== reports.js - تقارير متقدمة 2026 ==================
// الرقم 25 في ترتيب الملفات - نسخة محسنة مع تحليلات متقدمة

const reportsModule = (function() {
    // ================== دوال مساعدة ==================
    function formatCurrency(amount) {
        return Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' دج';
    }
    
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    function formatDate(date) {
        return new Date(date).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }
    
    function showNotification(message, type = 'success') {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: type,
                title: type === 'success' ? 'نجاح' : 'تنبيه',
                text: message,
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        }
    }
    
    // ================== إحصائيات عامة متقدمة ==================
    function getDashboardStats() {
        // جمع البيانات من الوحدات المختلفة
        const products = window.productModule?.products || [];
        const customers = window.customerModule?.customers || [];
        const suppliers = window.supplierModule?.suppliers || [];
        const salesInvoices = window.salesModule?.invoices || [];
        const purchaseInvoices = window.purchasesModule?.invoices || [];
        const debts = window.debtModule?.debts || [];
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisYear = new Date(now.getFullYear(), 0, 1);
        
        // تصفية الفواتير حسب التاريخ
        const todaySales = salesInvoices.filter(inv => new Date(inv.date) >= today);
        const monthSales = salesInvoices.filter(inv => new Date(inv.date) >= thisMonth);
        const yearSales = salesInvoices.filter(inv => new Date(inv.date) >= thisYear);
        
        const todayPurchases = purchaseInvoices.filter(inv => new Date(inv.date) >= today);
        const monthPurchases = purchaseInvoices.filter(inv => new Date(inv.date) >= thisMonth);
        const yearPurchases = purchaseInvoices.filter(inv => new Date(inv.date) >= thisYear);
        
        // حساب إجمالي المبيعات والمشتريات
        const totalSales = salesInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
        const totalPurchases = purchaseInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
        
        // حساب قيمة المخزون
        const inventoryValue = products.reduce((sum, p) => sum + ((p.buyPrice || 0) * (p.quantity || 0)), 0);
        const inventorySellValue = products.reduce((sum, p) => sum + ((p.sellPrice || 0) * (p.quantity || 0)), 0);
        
        // حساب الديون
        const customerDebt = debts.filter(d => d.partyType === 'customer').reduce((sum, d) => sum + (d.remaining || 0), 0);
        const supplierDebt = debts.filter(d => d.partyType === 'supplier').reduce((sum, d) => sum + (d.remaining || 0), 0);
        
        // حساب الأرباح التقريبية
        const estimatedProfit = totalSales - totalPurchases;
        const potentialProfit = inventorySellValue - inventoryValue;
        
        return {
            products: {
                count: products.length,
                lowStock: products.filter(p => (p.quantity || 0) <= (p.minStock || 5)).length,
                outOfStock: products.filter(p => (p.quantity || 0) === 0).length,
                totalQuantity: products.reduce((sum, p) => sum + (p.quantity || 0), 0)
            },
            customers: {
                count: customers.length,
                withDebt: customers.filter(c => (c.totalDebt || 0) > 0).length,
                totalDebt: customerDebt
            },
            suppliers: {
                count: suppliers.length,
                withDebt: suppliers.filter(s => (s.totalDebt || 0) > 0).length,
                totalDebt: supplierDebt
            },
            sales: {
                count: salesInvoices.length,
                total: totalSales,
                today: todaySales.length,
                todayTotal: todaySales.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0),
                thisMonth: monthSales.length,
                monthTotal: monthSales.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0),
                thisYear: yearSales.length,
                yearTotal: yearSales.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0),
                average: salesInvoices.length ? totalSales / salesInvoices.length : 0
            },
            purchases: {
                count: purchaseInvoices.length,
                total: totalPurchases,
                today: todayPurchases.length,
                todayTotal: todayPurchases.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0),
                thisMonth: monthPurchases.length,
                monthTotal: monthPurchases.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0),
                thisYear: yearPurchases.length,
                yearTotal: yearPurchases.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0),
                average: purchaseInvoices.length ? totalPurchases / purchaseInvoices.length : 0
            },
            inventory: {
                value: inventoryValue,
                sellValue: inventorySellValue,
                potentialProfit: potentialProfit
            },
            profit: estimatedProfit,
            profitMargin: totalSales ? ((estimatedProfit / totalSales) * 100).toFixed(1) : 0,
            debts: {
                total: customerDebt + supplierDebt,
                customer: customerDebt,
                supplier: supplierDebt
            }
        };
    }
    
    // ================== تقرير المبيعات المتقدم ==================
    function getSalesReport(startDate = null, endDate = null) {
        const salesInvoices = window.salesModule?.invoices || [];
        
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        
        const filtered = salesInvoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= start && invDate <= end;
        });
        
        // تحليل المبيعات
        const totalAmount = filtered.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
        const totalDiscount = filtered.reduce((sum, inv) => sum + (inv.totalDiscount || 0), 0);
        const averagePerInvoice = filtered.length ? totalAmount / filtered.length : 0;
        const maxInvoice = filtered.length ? Math.max(...filtered.map(inv => inv.grandTotal || 0)) : 0;
        
        // المبيعات حسب طريقة الدفع
        const byPaymentMethod = {
            cash: filtered.filter(inv => inv.paymentMethod === 'cash').reduce((sum, inv) => sum + (inv.grandTotal || 0), 0),
            card: filtered.filter(inv => inv.paymentMethod === 'card').reduce((sum, inv) => sum + (inv.grandTotal || 0), 0),
            credit: filtered.filter(inv => inv.paymentMethod === 'credit').reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)
        };
        
        // المبيعات اليومية
        const dailySales = {};
        filtered.forEach(inv => {
            const date = formatDate(inv.date);
            dailySales[date] = (dailySales[date] || 0) + (inv.grandTotal || 0);
        });
        
        // المنتجات الأكثر مبيعاً
        const productSales = {};
        filtered.forEach(inv => {
            (inv.items || []).forEach(item => {
                if (!productSales[item.name]) {
                    productSales[item.name] = {
                        name: item.name,
                        quantity: 0,
                        total: 0,
                        count: 0
                    };
                }
                productSales[item.name].quantity += item.qty || 0;
                productSales[item.name].total += item.total || 0;
                productSales[item.name].count += 1;
            });
        });
        
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
        
        return {
            period: { start, end },
            summary: {
                count: filtered.length,
                total: totalAmount,
                discount: totalDiscount,
                average: averagePerInvoice,
                max: maxInvoice
            },
            byPaymentMethod,
            dailySales,
            topProducts,
            invoices: filtered
        };
    }
    
    // ================== تقرير المشتريات المتقدم ==================
    function getPurchasesReport(startDate = null, endDate = null) {
        const purchaseInvoices = window.purchasesModule?.invoices || [];
        
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        
        const filtered = purchaseInvoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= start && invDate <= end;
        });
        
        const totalAmount = filtered.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
        const averagePerInvoice = filtered.length ? totalAmount / filtered.length : 0;
        const maxInvoice = filtered.length ? Math.max(...filtered.map(inv => inv.grandTotal || 0)) : 0;
        
        // المشتريات حسب طريقة الدفع
        const byPaymentMethod = {
            cash: filtered.filter(inv => inv.paymentMethod === 'cash').reduce((sum, inv) => sum + (inv.grandTotal || 0), 0),
            check: filtered.filter(inv => inv.paymentMethod === 'check').reduce((sum, inv) => sum + (inv.grandTotal || 0), 0),
            transfer: filtered.filter(inv => inv.paymentMethod === 'transfer').reduce((sum, inv) => sum + (inv.grandTotal || 0), 0),
            credit: filtered.filter(inv => inv.paymentMethod === 'credit').reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)
        };
        
        // المنتجات الأكثر شراءً
        const productPurchases = {};
        filtered.forEach(inv => {
            (inv.items || []).forEach(item => {
                if (!productPurchases[item.name]) {
                    productPurchases[item.name] = {
                        name: item.name,
                        quantity: 0,
                        total: 0,
                        count: 0
                    };
                }
                productPurchases[item.name].quantity += item.qty || 0;
                productPurchases[item.name].total += item.total || 0;
                productPurchases[item.name].count += 1;
            });
        });
        
        const topProducts = Object.values(productPurchases)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
        
        return {
            period: { start, end },
            summary: {
                count: filtered.length,
                total: totalAmount,
                average: averagePerInvoice,
                max: maxInvoice
            },
            byPaymentMethod,
            topProducts,
            invoices: filtered
        };
    }
    
    // ================== تقرير الأرباح المتقدم ==================
    function getProfitReport(startDate = null, endDate = null) {
        const sales = getSalesReport(startDate, endDate);
        const purchases = getPurchasesReport(startDate, endDate);
        
        // حساب التكلفة المقدرة للمبيعات
        let estimatedCost = 0;
        sales.invoices.forEach(inv => {
            (inv.items || []).forEach(item => {
                const product = window.productModule?.products?.find(p => p.name === item.name);
                if (product) {
                    estimatedCost += (product.buyPrice || 0) * (item.qty || 0);
                }
            });
        });
        
        const grossProfit = sales.summary.total - estimatedCost;
        const profitMargin = sales.summary.total ? (grossProfit / sales.summary.total) * 100 : 0;
        
        // تحليل الأرباح الشهرية
        const monthlyProfit = {};
        const monthlyData = {};
        
        sales.invoices.forEach(inv => {
            const month = new Date(inv.date).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
            if (!monthlyData[month]) {
                monthlyData[month] = { sales: 0, cost: 0 };
            }
            monthlyData[month].sales += inv.grandTotal || 0;
            
            // تقدير التكلفة
            (inv.items || []).forEach(item => {
                const product = window.productModule?.products?.find(p => p.name === item.name);
                if (product) {
                    monthlyData[month].cost += (product.buyPrice || 0) * (item.qty || 0);
                }
            });
        });
        
        Object.entries(monthlyData).forEach(([month, data]) => {
            monthlyProfit[month] = data.sales - data.cost;
        });
        
        return {
            period: { start: sales.period.start, end: sales.period.end },
            sales: sales.summary.total,
            purchases: purchases.summary.total,
            estimatedCost,
            grossProfit,
            profitMargin,
            monthlyProfit,
            summary: {
                revenue: sales.summary.total,
                cost: estimatedCost,
                profit: grossProfit,
                margin: profitMargin
            }
        };
    }
    
    // ================== تقرير المخزون المتقدم ==================
    function getInventoryReport() {
        const products = window.productModule?.products || [];
        const inventoryLogs = window.inventoryModule?.inventoryLogs || [];
        
        // إحصائيات أساسية
        const totalProducts = products.length;
        const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
        const totalValue = products.reduce((sum, p) => sum + ((p.buyPrice || 0) * (p.quantity || 0)), 0);
        const totalSellValue = products.reduce((sum, p) => sum + ((p.sellPrice || 0) * (p.quantity || 0)), 0);
        
        // المنتجات حسب الحالة
        const lowStock = products.filter(p => (p.quantity || 0) <= (p.minStock || 5));
        const outOfStock = products.filter(p => (p.quantity || 0) === 0);
        const overStock = products.filter(p => (p.maxStock || 999999) && (p.quantity || 0) > (p.maxStock || 999999));
        
        // المخزون حسب التصنيف
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
            byCategory[cat].quantity += p.quantity || 0;
            byCategory[cat].value += (p.buyPrice || 0) * (p.quantity || 0);
        });
        
        // تحليل حركة المخزون
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        
        const recentLogs = inventoryLogs.filter(log => new Date(log.date) >= lastMonth);
        
        const inbound = recentLogs.filter(l => l.type === 'add').reduce((sum, l) => sum + (l.quantity || 0), 0);
        const outbound = recentLogs.filter(l => l.type === 'remove').reduce((sum, l) => sum + Math.abs(l.quantity || 0), 0);
        
        // معدل دوران المخزون
        const avgInventory = totalQuantity / (products.length || 1);
        const turnoverRate = outbound / (avgInventory || 1);
        
        return {
            summary: {
                totalProducts,
                totalQuantity,
                totalValue,
                totalSellValue,
                potentialProfit: totalSellValue - totalValue
            },
            status: {
                lowStock: lowStock.length,
                outOfStock: outOfStock.length,
                overStock: overStock.length,
                healthy: products.length - (lowStock.length + outOfStock.length + overStock.length)
            },
            movement: {
                inbound,
                outbound,
                netChange: inbound - outbound,
                turnoverRate: turnoverRate.toFixed(2)
            },
            byCategory: Object.values(byCategory),
            lowStockProducts: lowStock.slice(0, 10),
            outOfStockProducts: outOfStock.slice(0, 10)
        };
    }
    
    // ================== تقرير العملاء المتقدم ==================
    function getCustomersReport() {
        const customers = window.customerModule?.customers || [];
        const salesInvoices = window.salesModule?.invoices || [];
        const debts = window.debtModule?.debts || [];
        
        // تحليل مشتريات العملاء
        const customerAnalysis = customers.map(customer => {
            const customerInvoices = salesInvoices.filter(inv => inv.customerId === customer.id);
            const totalSpent = customerInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
            const frequency = customerInvoices.length;
            const lastPurchase = customerInvoices[0]?.date || null;
            
            let category = 'جديد';
            let score = 0;
            
            if (frequency > 10 && totalSpent > 100000) {
                category = 'VIP';
                score = 100;
            } else if (frequency > 5 && totalSpent > 50000) {
                category = 'ممتاز';
                score = 80;
            } else if (frequency > 2 && totalSpent > 10000) {
                category = 'جيد';
                score = 60;
            } else if (frequency > 0) {
                category = 'عادي';
                score = 40;
            }
            
            // حساب الديون
            const customerDebts = debts.filter(d => d.partyId === customer.id && d.partyType === 'customer');
            const totalDebt = customerDebts.reduce((sum, d) => sum + (d.remaining || 0), 0);
            
            return {
                id: customer.id,
                name: customer.name || customer.fullname,
                totalSpent,
                frequency,
                category,
                score,
                lastPurchase,
                totalDebt,
                avgPerPurchase: frequency ? totalSpent / frequency : 0
            };
        });
        
        // أفضل العملاء
        const topBySpending = [...customerAnalysis]
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10);
        
        const topByFrequency = [...customerAnalysis]
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 10);
        
        // العملاء غير النشطين
        const inactiveThreshold = new Date();
        inactiveThreshold.setMonth(inactiveThreshold.getMonth() - 1);
        
        const inactiveCustomers = customerAnalysis.filter(c => 
            c.lastPurchase && new Date(c.lastPurchase) < inactiveThreshold
        );
        
        // إحصائيات عامة
        const totalCustomers = customers.length;
        const activeCustomers = customerAnalysis.filter(c => c.frequency > 0).length;
        const customersWithDebt = customerAnalysis.filter(c => c.totalDebt > 0).length;
        const totalDebt = customerAnalysis.reduce((sum, c) => sum + c.totalDebt, 0);
        
        return {
            summary: {
                total: totalCustomers,
                active: activeCustomers,
                inactive: totalCustomers - activeCustomers,
                withDebt: customersWithDebt,
                totalDebt
            },
            categories: {
                vip: customerAnalysis.filter(c => c.category === 'VIP').length,
                excellent: customerAnalysis.filter(c => c.category === 'ممتاز').length,
                good: customerAnalysis.filter(c => c.category === 'جيد').length,
                regular: customerAnalysis.filter(c => c.category === 'عادي').length,
                new: customerAnalysis.filter(c => c.category === 'جديد').length
            },
            topBySpending,
            topByFrequency,
            inactive: inactiveCustomers.slice(0, 10)
        };
    }
    
    // ================== تقرير الموردين المتقدم ==================
    function getSuppliersReport() {
        const suppliers = window.supplierModule?.suppliers || [];
        const purchaseInvoices = window.purchasesModule?.invoices || [];
        const debts = window.debtModule?.debts || [];
        
        // تحليل مشتريات الموردين
        const supplierAnalysis = suppliers.map(supplier => {
            const supplierInvoices = purchaseInvoices.filter(inv => inv.supplierId === supplier.id);
            const totalPurchases = supplierInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
            const frequency = supplierInvoices.length;
            const lastPurchase = supplierInvoices[0]?.date || null;
            
            // حساب الديون
            const supplierDebts = debts.filter(d => d.partyId === supplier.id && d.partyType === 'supplier');
            const totalDebt = supplierDebts.reduce((sum, d) => sum + (d.remaining || 0), 0);
            
            return {
                id: supplier.id,
                name: supplier.company || supplier.name,
                totalPurchases,
                frequency,
                lastPurchase,
                totalDebt,
                avgPerPurchase: frequency ? totalPurchases / frequency : 0
            };
        });
        
        // أفضل الموردين
        const topBySpending = [...supplierAnalysis]
            .sort((a, b) => b.totalPurchases - a.totalPurchases)
            .slice(0, 10);
        
        // إحصائيات عامة
        const totalSuppliers = suppliers.length;
        const activeSuppliers = supplierAnalysis.filter(s => s.frequency > 0).length;
        const suppliersWithDebt = supplierAnalysis.filter(s => s.totalDebt > 0).length;
        const totalDebt = supplierAnalysis.reduce((sum, s) => sum + s.totalDebt, 0);
        
        return {
            summary: {
                total: totalSuppliers,
                active: activeSuppliers,
                withDebt: suppliersWithDebt,
                totalDebt
            },
            topBySpending,
            byCategory: {} // يمكن إضافته لاحقاً
        };
    }
    
    // ================== تحديث واجهة الملخص ==================
    function updateDashboard() {
        const stats = getDashboardStats();
        
        // تحديث العناصر في HTML
        const elements = {
            'total-sales': formatCurrency(stats.sales.total),
            'total-purchases': formatCurrency(stats.purchases.total),
            'total-inventory-value': formatCurrency(stats.inventory.value),
            'total-profit': formatCurrency(stats.profit),
            'total-invoices': formatNumber(stats.sales.count + stats.purchases.count),
            'total-products': formatNumber(stats.products.count),
            'total-customers': formatNumber(stats.customers.count),
            'total-suppliers': formatNumber(stats.suppliers.count),
            'low-stock-count': formatNumber(stats.products.lowStock),
            'debt-customers': formatNumber(stats.customers.withDebt),
            'today-sales': formatCurrency(stats.sales.todayTotal),
            'month-sales': formatCurrency(stats.sales.monthTotal),
            'year-sales': formatCurrency(stats.sales.yearTotal),
            'today-purchases': formatCurrency(stats.purchases.todayTotal),
            'month-purchases': formatCurrency(stats.purchases.monthTotal),
            'year-purchases': formatCurrency(stats.purchases.yearTotal),
            'today-profit': formatCurrency(stats.sales.todayTotal - stats.purchases.todayTotal),
            'month-profit': formatCurrency(stats.sales.monthTotal - stats.purchases.monthTotal),
            'year-profit': formatCurrency(stats.sales.yearTotal - stats.purchases.yearTotal),
            'profit-margin': stats.profitMargin + '%'
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
        
        // عرض المنتجات الناقصة
        const lowStock = getInventoryReport().lowStockProducts;
        updateLowStockDisplay(lowStock);
        
        // عرض أفضل المنتجات
        const salesReport = getSalesReport();
        updateTopProductsDisplay(salesReport.topProducts);
        
        // عرض أفضل العملاء
        const customersReport = getCustomersReport();
        updateTopCustomersDisplay(customersReport.topBySpending);
    }
    
    // ================== دوال التحديث المساعدة ==================
    function updateLowStockDisplay(products) {
        const container = document.getElementById('low-stock-list');
        if (!container) return;
        
        if (!products || products.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">لا توجد منتجات ناقصة</p>';
            return;
        }
        
        let html = '<table class="table-custom"><thead><tr><th>المنتج</th><th>الكمية</th><th>الحد الأدنى</th><th>النقص</th></tr></thead><tbody>';
        products.forEach(p => {
            const shortage = (p.minStock || 5) - (p.quantity || 0);
            html += `<tr><td>${p.name}</td><td>${p.quantity || 0}</td><td>${p.minStock || 5}</td><td class="text-danger">${shortage}</td></tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    }
    
    function updateTopProductsDisplay(products) {
        const container = document.getElementById('top-products-list');
        if (!container) return;
        
        if (!products || products.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="text-center p-4">لا توجد بيانات</td></tr>';
            return;
        }
        
        const total = products.reduce((sum, p) => sum + p.total, 0);
        
        let html = '';
        products.forEach((p, i) => {
            const percentage = ((p.total / total) * 100).toFixed(1);
            html += `<tr>
                <td>${i + 1}</td>
                <td>${p.name}</td>
                <td>${formatNumber(p.quantity)}</td>
                <td>${formatCurrency(p.total)}</td>
                <td>${percentage}%</td>
            </tr>`;
        });
        container.innerHTML = html;
    }
    
    function updateTopCustomersDisplay(customers) {
        const container = document.getElementById('top-customers-list');
        if (!container) return;
        
        if (!customers || customers.length === 0) {
            container.innerHTML = '<tr><td colspan="4" class="text-center p-4">لا توجد بيانات</td></tr>';
            return;
        }
        
        let html = '<table class="table-custom"><thead><tr><th>#</th><th>العميل</th><th>المشتريات</th><th>عدد الفواتير</th></tr></thead><tbody>';
        customers.forEach((c, i) => {
            html += `<tr>
                <td>${i + 1}</td>
                <td>${c.name}</td>
                <td>${formatCurrency(c.totalSpent)}</td>
                <td>${formatNumber(c.frequency)}</td>
            </tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    }
    
    // ================== تصدير التقارير ==================
    function exportReport(reportType, format = 'csv') {
        let data = [];
        let filename = '';
        let headers = [];
        
        switch(reportType) {
            case 'sales':
                const salesReport = getSalesReport();
                data = salesReport.invoices.map(inv => ({
                    'رقم الفاتورة': inv.number,
                    'التاريخ': formatDate(inv.date),
                    'العميل': inv.customer,
                    'المبلغ': inv.grandTotal,
                    'طريقة الدفع': inv.paymentText
                }));
                filename = 'sales_report';
                headers = ['رقم الفاتورة', 'التاريخ', 'العميل', 'المبلغ', 'طريقة الدفع'];
                break;
                
            case 'products':
                const products = window.productModule?.products || [];
                data = products.map(p => ({
                    'المنتج': p.name,
                    'التصنيف': p.category,
                    'الكمية': p.quantity,
                    'سعر البيع': p.sellPrice,
                    'سعر الشراء': p.buyPrice,
                    'القيمة': (p.buyPrice || 0) * (p.quantity || 0)
                }));
                filename = 'inventory_report';
                headers = ['المنتج', 'التصنيف', 'الكمية', 'سعر البيع', 'سعر الشراء', 'القيمة'];
                break;
                
            case 'customers':
                const customersReport = getCustomersReport();
                data = customersReport.topBySpending.map(c => ({
                    'العميل': c.name,
                    'إجمالي المشتريات': c.totalSpent,
                    'عدد الفواتير': c.frequency,
                    'الديون': c.totalDebt
                }));
                filename = 'customers_report';
                headers = ['العميل', 'إجمالي المشتريات', 'عدد الفواتير', 'الديون'];
                break;
        }
        
        if (format === 'csv') {
            exportToCSV(data, filename, headers);
        }
    }
    
    function exportToCSV(data, filename, headers) {
        if (!data || data.length === 0) {
            showNotification('لا توجد بيانات للتصدير', 'warning');
            return;
        }
        
        let csv = headers.join(',') + '\n';
        
        data.forEach(row => {
            const values = headers.map(h => {
                const val = row[h] || '';
                return typeof val === 'string' ? `"${val}"` : val;
            });
            csv += values.join(',') + '\n';
        });
        
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
        
        showNotification('تم تصدير التقرير بنجاح');
    }
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ reportsModule v2 initialized - الرقم 25');
        updateDashboard();
    }
    
    // ================== واجهة الوحدة ==================
    return {
        getDashboardStats,
        getSalesReport,
        getPurchasesReport,
        getProfitReport,
        getInventoryReport,
        getCustomersReport,
        getSuppliersReport,
        updateDashboard,
        exportReport,
        init
    };
})();

window.reportsModule = reportsModule;

// ================== دوال مختصرة للاستخدام في HTML ==================
window.filterSalesReport = () => {
    const start = document.getElementById('sales-start-date')?.value;
    const end = document.getElementById('sales-end-date')?.value;
    const report = reportsModule.getSalesReport(start, end);
    
    // تحديث واجهة المبيعات
    document.getElementById('sales-total').textContent = formatCurrency(report.summary.total);
    document.getElementById('sales-count').textContent = formatNumber(report.summary.count);
    document.getElementById('sales-average').textContent = formatCurrency(report.summary.average);
    document.getElementById('sales-max').textContent = formatCurrency(report.summary.max);
    
    reportsModule.updateTopProductsDisplay(report.topProducts);
};

window.filterPurchasesReport = () => {
    const start = document.getElementById('purchases-start-date')?.value;
    const end = document.getElementById('purchases-end-date')?.value;
    const report = reportsModule.getPurchasesReport(start, end);
    
    document.getElementById('purchases-total').textContent = formatCurrency(report.summary.total);
    document.getElementById('purchases-count').textContent = formatNumber(report.summary.count);
    document.getElementById('purchases-average').textContent = formatCurrency(report.summary.average);
    document.getElementById('purchases-max').textContent = formatCurrency(report.summary.max);
};

window.exportCurrentReport = () => {
    // تحديد التقرير النشط
    const activeTab = document.querySelector('.tab-item-modern.active span')?.textContent;
    if (activeTab?.includes('المبيعات')) reportsModule.exportReport('sales');
    else if (activeTab?.includes('المخزون')) reportsModule.exportReport('products');
    else if (activeTab?.includes('العملاء')) reportsModule.exportReport('customers');
    else showNotification('الرجاء اختيار تقرير أولاً', 'info');
};

// تهيئة تلقائية
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => reportsModule.init());
    document.addEventListener('html-loaded', () => reportsModule.init());
}
