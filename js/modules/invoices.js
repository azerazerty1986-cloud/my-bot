// ================== إدارة الفواتير الموحدة ==================
const invoicesModule = (function() {
    // ================== البيانات ==================
    let salesInvoices = JSON.parse(localStorage.getItem('sales_invoices')) || [];
    let purchaseInvoices = JSON.parse(localStorage.getItem('purchase_invoices')) || [];
    
    // ================== دوال مساعدة ==================
    function formatCurrency(amount) {
        return Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    function showNotification(title, message, type = 'success') {
        if (typeof Swal !== 'undefined') {
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
    }
    
    function showConfirmation(title, text, confirmCallback) {
        Swal.fire({
            title: title,
            text: text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'نعم',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) confirmCallback();
        });
    }
    
    // ================== فواتير المبيعات ==================
    
    function saveSalesInvoices() {
        localStorage.setItem('sales_invoices', JSON.stringify(salesInvoices));
    }
    
    function addSalesInvoice(invoiceData) {
        const invoice = {
            id: Date.now() + Math.random(),
            number: generateInvoiceNumber('SALE'),
            type: 'sale',
            date: new Date().toISOString(),
            customer: invoiceData.customer || 'زبون نقدي',
            items: invoiceData.items || [],
            subtotal: invoiceData.subtotal || 0,
            discount: invoiceData.discount || 0,
            total: invoiceData.total || 0,
            paymentMethod: invoiceData.paymentMethod || 'cash',
            paymentText: invoiceData.paymentMethod === 'cash' ? 'نقدي' : 
                        invoiceData.paymentMethod === 'card' ? 'بطاقة' : 'آجل',
            createdBy: 'admin',
            notes: invoiceData.notes || ''
        };
        
        salesInvoices.push(invoice);
        saveSalesInvoices();
        return invoice;
    }
    
    function getSalesInvoices() {
        return [...salesInvoices].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    function getSalesInvoice(id) {
        return salesInvoices.find(inv => inv.id == id);
    }
    
    function deleteSalesInvoice(id) {
        const index = salesInvoices.findIndex(inv => inv.id == id);
        if (index !== -1) {
            salesInvoices.splice(index, 1);
            saveSalesInvoices();
            return true;
        }
        return false;
    }
    
    function updateSalesInvoice(id, updatedData) {
        const index = salesInvoices.findIndex(inv => inv.id == id);
        if (index !== -1) {
            salesInvoices[index] = { ...salesInvoices[index], ...updatedData, updatedAt: new Date().toISOString() };
            saveSalesInvoices();
            return salesInvoices[index];
        }
        return null;
    }
    
    // ================== فواتير المشتريات ==================
    
    function savePurchaseInvoices() {
        localStorage.setItem('purchase_invoices', JSON.stringify(purchaseInvoices));
    }
    
    function addPurchaseInvoice(invoiceData) {
        const invoice = {
            id: Date.now() + Math.random(),
            number: generateInvoiceNumber('PUR'),
            type: 'purchase',
            date: new Date().toISOString(),
            supplier: invoiceData.supplier || 'مورد',
            items: invoiceData.items || [],
            subtotal: invoiceData.subtotal || 0,
            total: invoiceData.total || 0,
            paymentMethod: invoiceData.paymentMethod || 'cash',
            paymentText: invoiceData.paymentMethod === 'cash' ? 'نقدي' : 
                        invoiceData.paymentMethod === 'check' ? 'شيك' : 'تحويل',
            createdBy: 'admin',
            notes: invoiceData.notes || ''
        };
        
        purchaseInvoices.push(invoice);
        savePurchaseInvoices();
        return invoice;
    }
    
    function getPurchaseInvoices() {
        return [...purchaseInvoices].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    function getPurchaseInvoice(id) {
        return purchaseInvoices.find(inv => inv.id == id);
    }
    
    function deletePurchaseInvoice(id) {
        const index = purchaseInvoices.findIndex(inv => inv.id == id);
        if (index !== -1) {
            purchaseInvoices.splice(index, 1);
            savePurchaseInvoices();
            return true;
        }
        return false;
    }
    
    function updatePurchaseInvoice(id, updatedData) {
        const index = purchaseInvoices.findIndex(inv => inv.id == id);
        if (index !== -1) {
            purchaseInvoices[index] = { ...purchaseInvoices[index], ...updatedData, updatedAt: new Date().toISOString() };
            savePurchaseInvoices();
            return purchaseInvoices[index];
        }
        return null;
    }
    
    // ================== دوال مشتركة ==================
    
    function generateInvoiceNumber(prefix = 'INV') {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${year}${month}${day}-${random}`;
    }
    
    function getAllInvoices() {
        const all = [
            ...salesInvoices.map(inv => ({ ...inv, type: 'sale', typeText: 'مبيعات' })),
            ...purchaseInvoices.map(inv => ({ ...inv, type: 'purchase', typeText: 'مشتريات' }))
        ];
        return all.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    function searchInvoices(term) {
        term = term.toLowerCase();
        const all = getAllInvoices();
        
        return all.filter(inv => 
            inv.number.toLowerCase().includes(term) ||
            (inv.customer && inv.customer.toLowerCase().includes(term)) ||
            (inv.supplier && inv.supplier.toLowerCase().includes(term)) ||
            formatDate(inv.date).includes(term)
        );
    }
    
    function filterByDateRange(startDate, endDate) {
        const all = getAllInvoices();
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        
        return all.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= start && invDate <= end;
        });
    }
    
    function filterByType(type) {
        if (type === 'all') return getAllInvoices();
        if (type === 'sale') return getSalesInvoices();
        if (type === 'purchase') return getPurchaseInvoices();
        return [];
    }
    
    // ================== إحصائيات الفواتير ==================
    
    function getStats() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        
        const thisMonthSales = salesInvoices.filter(inv => new Date(inv.date) >= startOfMonth);
        const thisMonthPurchases = purchaseInvoices.filter(inv => new Date(inv.date) >= startOfMonth);
        
        const thisYearSales = salesInvoices.filter(inv => new Date(inv.date) >= startOfYear);
        const thisYearPurchases = purchaseInvoices.filter(inv => new Date(inv.date) >= startOfYear);
        
        return {
            total: {
                sales: salesInvoices.length,
                purchases: purchaseInvoices.length,
                all: salesInvoices.length + purchaseInvoices.length
            },
            thisMonth: {
                sales: thisMonthSales.length,
                purchases: thisMonthPurchases.length,
                salesTotal: thisMonthSales.reduce((sum, inv) => sum + inv.total, 0),
                purchasesTotal: thisMonthPurchases.reduce((sum, inv) => sum + inv.total, 0)
            },
            thisYear: {
                sales: thisYearSales.length,
                purchases: thisYearPurchases.length,
                salesTotal: thisYearSales.reduce((sum, inv) => sum + inv.total, 0),
                purchasesTotal: thisYearPurchases.reduce((sum, inv) => sum + inv.total, 0)
            },
            totals: {
                salesTotal: salesInvoices.reduce((sum, inv) => sum + inv.total, 0),
                purchasesTotal: purchaseInvoices.reduce((sum, inv) => sum + inv.total, 0)
            }
        };
    }
    
    function getTopCustomers(limit = 5) {
        const customerTotals = {};
        
        salesInvoices.forEach(inv => {
            const customer = inv.customer || 'زبون نقدي';
            if (!customerTotals[customer]) {
                customerTotals[customer] = {
                    name: customer,
                    count: 0,
                    total: 0
                };
            }
            customerTotals[customer].count++;
            customerTotals[customer].total += inv.total;
        });
        
        return Object.values(customerTotals)
            .sort((a, b) => b.total - a.total)
            .slice(0, limit);
    }
    
    function getTopSuppliers(limit = 5) {
        const supplierTotals = {};
        
        purchaseInvoices.forEach(inv => {
            const supplier = inv.supplier || 'مورد';
            if (!supplierTotals[supplier]) {
                supplierTotals[supplier] = {
                    name: supplier,
                    count: 0,
                    total: 0
                };
            }
            supplierTotals[supplier].count++;
            supplierTotals[supplier].total += inv.total;
        });
        
        return Object.values(supplierTotals)
            .sort((a, b) => b.total - a.total)
            .slice(0, limit);
    }
    
    // ================== تصدير الفواتير ==================
    
    function exportToPDF(invoiceId, type) {
        let invoice;
        if (type === 'sale') {
            invoice = getSalesInvoice(invoiceId);
        } else {
            invoice = getPurchaseInvoice(invoiceId);
        }
        
        if (!invoice) {
            showNotification('خطأ', 'الفاتورة غير موجودة', 'error');
            return;
        }
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>فاتورة ${invoice.number}</title>
                <style>
                    body { font-family: Arial; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .company-name { font-size: 24px; font-weight: bold; color: #333; }
                    .invoice-title { font-size: 20px; margin: 10px 0; }
                    .info { margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th { background: #f5f5f5; padding: 10px; border: 1px solid #ddd; }
                    td { padding: 8px; border: 1px solid #ddd; text-align: center; }
                    .total { font-size: 18px; font-weight: bold; text-align: left; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">سوبر - النظام المتكامل</div>
                    <div class="invoice-title">فاتورة ${invoice.type === 'sale' ? 'بيع' : 'شراء'}</div>
                </div>
                
                <div class="info">
                    <p><strong>رقم الفاتورة:</strong> ${invoice.number}</p>
                    <p><strong>التاريخ:</strong> ${formatDate(invoice.date)}</p>
                    <p><strong>${invoice.type === 'sale' ? 'العميل' : 'المورد'}:</strong> ${invoice.customer || invoice.supplier}</p>
                    <p><strong>طريقة الدفع:</strong> ${invoice.paymentText}</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>المنتج</th>
                            <th>الكمية</th>
                            <th>السعر</th>
                            ${invoice.type === 'sale' ? '<th>الخصم</th>' : ''}
                            <th>الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map((item, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${item.name}</td>
                                <td>${item.qty}</td>
                                <td>${formatCurrency(item.price)}</td>
                                ${invoice.type === 'sale' ? `<td>${item.discount || 0}%</td>` : ''}
                                <td>${formatCurrency(item.total)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="total">
                    <p>الإجمالي: ${formatCurrency(invoice.total)} دج</p>
                </div>
                
                <div style="text-align: center; margin-top: 50px; color: #666;">
                    <p>شكراً لتعاملكم معنا</p>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }
    
    function exportAllToCSV() {
        const all = getAllInvoices();
        
        if (all.length === 0) {
            showNotification('تنبيه', 'لا توجد فواتير للتصدير', 'warning');
            return;
        }
        
        const headers = ['رقم الفاتورة', 'النوع', 'التاريخ', 'الطرف', 'الإجمالي', 'طريقة الدفع'];
        const rows = all.map(inv => [
            inv.number,
            inv.type === 'sale' ? 'مبيعات' : 'مشتريات',
            formatDate(inv.date),
            inv.customer || inv.supplier || '-',
            inv.total,
            inv.paymentText
        ]);
        
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoices_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        
        showNotification('نجاح', 'تم تصدير الفواتير', 'success');
    }
    
    // ================== عرض الفواتير في HTML ==================
    
    function renderInvoicesTable(containerId, invoicesList = null) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const list = invoicesList || getAllInvoices();
        
        if (list.length === 0) {
            container.innerHTML = '<tr><td colspan="7" class="text-center p-4">لا توجد فواتير</td></tr>';
            return;
        }
        
        container.innerHTML = list.map(inv => {
            const party = inv.customer || inv.supplier || '-';
            const typeClass = inv.type === 'sale' ? 'badge-success' : 'badge-primary';
            const typeText = inv.type === 'sale' ? 'مبيعات' : 'مشتريات';
            
            return `
            <tr>
                <td>${inv.number}</td>
                <td><span class="${typeClass}">${typeText}</span></td>
                <td>${formatDate(inv.date)}</td>
                <td>${party}</td>
                <td>${formatCurrency(inv.total)}</td>
                <td>${inv.paymentText}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="invoicesModule.showInvoiceDetails('${inv.id}', '${inv.type}')">
                        عرض
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="invoicesModule.confirmDelete('${inv.id}', '${inv.type}')">
                        حذف
                    </button>
                </td>
            </tr>
        `}).join('');
    }
    
    function showInvoiceDetails(id, type) {
        let invoice;
        if (type === 'sale') {
            invoice = getSalesInvoice(id);
        } else {
            invoice = getPurchaseInvoice(id);
        }
        
        if (!invoice) return;
        
        let itemsHtml = '';
        invoice.items.forEach((item, i) => {
            itemsHtml += `
                <tr>
                    <td style="padding:5px; border:1px solid #ddd;">${i + 1}</td>
                    <td style="padding:5px; border:1px solid #ddd;">${item.name}</td>
                    <td style="padding:5px; border:1px solid #ddd;">${item.qty}</td>
                    <td style="padding:5px; border:1px solid #ddd;">${formatCurrency(item.price)}</td>
                    ${type === 'sale' ? `<td style="padding:5px; border:1px solid #ddd;">${item.discount || 0}%</td>` : ''}
                    <td style="padding:5px; border:1px solid #ddd;">${formatCurrency(item.total)}</td>
                </tr>
            `;
        });
        
        const party = type === 'sale' ? 'العميل' : 'المورد';
        const partyName = type === 'sale' ? invoice.customer : invoice.supplier;
        
        Swal.fire({
            title: `فاتورة ${invoice.number}`,
            html: `
                <div style="text-align:right; max-height:400px; overflow-y:auto;">
                    <p><strong>التاريخ:</strong> ${formatDate(invoice.date)}</p>
                    <p><strong>${party}:</strong> ${partyName}</p>
                    <p><strong>طريقة الدفع:</strong> ${invoice.paymentText}</p>
                    <hr>
                    <table style="width:100%; border-collapse:collapse; text-align:center;">
                        <thead>
                            <tr style="background:#f5f5f5;">
                                <th style="padding:5px; border:1px solid #ddd;">#</th>
                                <th style="padding:5px; border:1px solid #ddd;">المنتج</th>
                                <th style="padding:5px; border:1px solid #ddd;">الكمية</th>
                                <th style="padding:5px; border:1px solid #ddd;">السعر</th>
                                ${type === 'sale' ? '<th style="padding:5px; border:1px solid #ddd;">الخصم</th>' : ''}
                                <th style="padding:5px; border:1px solid #ddd;">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                    <hr>
                    <h4>الإجمالي: ${formatCurrency(invoice.total)} دج</h4>
                    ${invoice.notes ? `<p><strong>ملاحظات:</strong> ${invoice.notes}</p>` : ''}
                </div>
            `,
            width: '800px',
            showCancelButton: true,
            confirmButtonText: 'طباعة',
            cancelButtonText: 'إغلاق',
            cancelButtonColor: '#3085d6',
            confirmButtonColor: '#28a745'
        }).then((result) => {
            if (result.isConfirmed) {
                exportToPDF(id, type);
            }
        });
    }
    
    function confirmDelete(id, type) {
        let number = '';
        if (type === 'sale') {
            const inv = getSalesInvoice(id);
            number = inv?.number;
        } else {
            const inv = getPurchaseInvoice(id);
            number = inv?.number;
        }
        
        showConfirmation('تأكيد الحذف', `حذف الفاتورة ${number}؟`, () => {
            let deleted = false;
            if (type === 'sale') {
                deleted = deleteSalesInvoice(id);
            } else {
                deleted = deletePurchaseInvoice(id);
            }
            
            if (deleted) {
                showNotification('تم', 'تم حذف الفاتورة', 'success');
                const tableBody = document.getElementById('invoices-table-body');
                if (tableBody) renderInvoicesTable('invoices-table-body');
            }
        });
    }
    
    // ================== التهيئة ==================
    function init() {
        console.log('✅ invoicesModule initialized');
        console.log(`📊 إحصائيات: ${salesInvoices.length} فاتورة مبيعات, ${purchaseInvoices.length} فاتورة مشتريات`);
    }
    
    // ================== واجهة الوحدة ==================
    return {
        salesInvoices: salesInvoices,
        purchaseInvoices: purchaseInvoices,
        
        addSalesInvoice: addSalesInvoice,
        getSalesInvoices: getSalesInvoices,
        getSalesInvoice: getSalesInvoice,
        deleteSalesInvoice: deleteSalesInvoice,
        updateSalesInvoice: updateSalesInvoice,
        saveSalesInvoices: saveSalesInvoices,
        
        addPurchaseInvoice: addPurchaseInvoice,
        getPurchaseInvoices: getPurchaseInvoices,
        getPurchaseInvoice: getPurchaseInvoice,
        deletePurchaseInvoice: deletePurchaseInvoice,
        updatePurchaseInvoice: updatePurchaseInvoice,
        savePurchaseInvoices: savePurchaseInvoices,
        
        getAllInvoices: getAllInvoices,
        searchInvoices: searchInvoices,
        filterByDateRange: filterByDateRange,
        filterByType: filterByType,
        getStats: getStats,
        getTopCustomers: getTopCustomers,
        getTopSuppliers: getTopSuppliers,
        
        exportToPDF: exportToPDF,
        exportAllToCSV: exportAllToCSV,
        
        renderInvoicesTable: renderInvoicesTable,
        showInvoiceDetails: showInvoiceDetails,
        confirmDelete: confirmDelete,
        
        init: init
    };
})();

window.invoicesModule = invoicesModule;

window.showInvoiceDetails = (id, type) => invoicesModule.showInvoiceDetails(id, type);
window.deleteInvoice = (id, type) => invoicesModule.confirmDelete(id, type);
window.exportInvoices = () => invoicesModule.exportAllToCSV();

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            if (invoicesModule && invoicesModule.init) invoicesModule.init();
        }, 300);
    });
}
