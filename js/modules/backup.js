// ================== النسخ الاحتياطي ==================
const backupModule = (function() {
    function exportBackup() {
        const stock = inventoryModule.stock;
        const invoices = JSON.parse(localStorage.getItem('ryan_invoices')) || [];
        const purchases = JSON.parse(localStorage.getItem('ryan_purchases')) || [];
        const customers = customerModule.customers;
        const suppliers = supplierModule.suppliers;
        const movements = inventoryModule.movements;
        
        const backupData = {
            stock,
            invoices,
            purchases,
            customers,
            suppliers,
            movements,
            exportDate: new Date().toISOString()
        };
        const dataStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `سوبيرات_ريان_نسخة_احتياطية_${new Date().toLocaleDateString('ar-DZ').replace(/\//g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Swal.fire('نجاح', 'تم تحميل النسخة الاحتياطية بنجاح', 'success');
    }

    function importBackup(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const backupData = JSON.parse(e.target.result);
                if (backupData.stock && backupData.invoices && backupData.purchases) {
                    inventoryModule.stock = backupData.stock.map(p => ({ ...p, id: p.id || Date.now() }));
                    inventoryModule.saveStock();
                    
                    localStorage.setItem('ryan_invoices', JSON.stringify(backupData.invoices || []));
                    localStorage.setItem('ryan_purchases', JSON.stringify(backupData.purchases || []));
                    localStorage.setItem('ryan_customers', JSON.stringify(backupData.customers || []));
                    localStorage.setItem('ryan_suppliers', JSON.stringify(backupData.suppliers || []));
                    localStorage.setItem('ryan_movements', JSON.stringify(backupData.movements || []));

                    inventoryModule.renderStock();
                    customerModule.renderCustomers();
                    supplierModule.renderSuppliers();
                    reportsModule.renderReports();
                    
                    if (document.getElementById('sale-invoices').style.display !== 'none') 
                        salesModule.renderSaleInvoices();
                    if (document.getElementById('purchase-invoices').style.display !== 'none') 
                        purchasesModule.renderPurchaseInvoices();
                    
                    Swal.fire('نجاح', 'تم استيراد النسخة الاحتياطية بنجاح', 'success');
                } else {
                    Swal.fire('خطأ', 'الملف غير صالح أو تالف', 'error');
                }
            } catch (error) {
                Swal.fire('خطأ', 'حدث خطأ أثناء قراءة الملف', 'error');
            }
            document.getElementById('backup-file-input').value = '';
        };
        reader.readAsText(file);
    }

    return {
        exportBackup,
        importBackup
    };
})();
