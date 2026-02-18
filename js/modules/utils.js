// ================== نظام النسخ الاحتياطي المتكامل ==================
const backupModule = (function() {
    
    // ================== تصدير نسخة احتياطية ==================
    function exportBackup() {
        const backupData = {
            stock: JSON.parse(localStorage.getItem('ryan_stock')) || [],
            invoices: JSON.parse(localStorage.getItem('ryan_invoices')) || [],
            purchases: JSON.parse(localStorage.getItem('ryan_purchases')) || [],
            customers: JSON.parse(localStorage.getItem('ryan_customers')) || [],
            suppliers: JSON.parse(localStorage.getItem('ryan_suppliers')) || [],
            movements: JSON.parse(localStorage.getItem('ryan_movements')) || [],
            payments: JSON.parse(localStorage.getItem('payment_history')) || [],
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `نسخة_احتياطية_${new Date().toLocaleDateString('ar-DZ').replace(/\//g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Swal.fire({
            icon: 'success',
            title: 'نجاح',
            text: 'تم تحميل النسخة الاحتياطية',
            timer: 2000,
            showConfirmButton: false
        });
    }

    // ================== استيراد نسخة احتياطية ==================
    function importBackup(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const backupData = JSON.parse(e.target.result);
                
                if (backupData.stock) localStorage.setItem('ryan_stock', JSON.stringify(backupData.stock));
                if (backupData.invoices) localStorage.setItem('ryan_invoices', JSON.stringify(backupData.invoices));
                if (backupData.purchases) localStorage.setItem('ryan_purchases', JSON.stringify(backupData.purchases));
                if (backupData.customers) localStorage.setItem('ryan_customers', JSON.stringify(backupData.customers));
                if (backupData.suppliers) localStorage.setItem('ryan_suppliers', JSON.stringify(backupData.suppliers));
                if (backupData.movements) localStorage.setItem('ryan_movements', JSON.stringify(backupData.movements));
                if (backupData.payments) localStorage.setItem('payment_history', JSON.stringify(backupData.payments));
                
                Swal.fire({
                    icon: 'success',
                    title: 'نجاح',
                    text: 'تم استيراد النسخة الاحتياطية',
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    location.reload();
                });
                
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'خطأ',
                    text: 'الملف غير صالح',
                    timer: 2000,
                    showConfirmButton: false
                });
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

window.backupModule = backupModule;
