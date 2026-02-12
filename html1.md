<div id="result-display" style="display:none; margin: 15px; padding: 15px; background: #111; border-radius: 10px; border: 1px solid #333;">
    <h4 style="color: #00ffa3; margin: 0 0 10px 0;">📊 نتائج الفحص المباشر:</h4>
    <div id="res-content" style="font-size: 14px; color: #ccc; line-height: 1.6;"></div>
</div>

<script>
    async function performAnalysis() {
        const caInput = document.getElementById('ca_input').value;
        const resBox = document.getElementById('result-display');
        const resContent = document.getElementById('res-content');

        if (!caInput || caInput.length < 20) {
            alert("يرجى إدخال عنوان عقد صحيح أولاً!");
            return;
        }

        // إظهار مربع النتائج وحالة التحميل
        resBox.style.display = "block";
        resContent.innerHTML = "⏳ جاري فحص الشبكة واستخراج البيانات...";

        try {
            // استبدل LOCALHOST_IP برقم IP جهازك أو الخادم إذا كنت ترفعه أونلاين
            const response = await fetch('http://localhost:5000/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ca: caInput })
            });
            
            const data = await response.json();
            
            // عرض النتائج النهائية في الواجهة
            resContent.innerHTML = `
                🔹 <b>الأمان:</b> ${data.security}<br>
                🔹 <b>السيولة:</b> ${data.liquidity}<br>
                🔹 <b>درجة الثقة:</b> <span style="color:#00ffa3">${data.trust}</span>
            `;
        } catch (error) {
            resContent.innerHTML = "❌ فشل الاتصال بالخادم. تأكد من تشغيل ملف Python.";
        }
    }
</script>
