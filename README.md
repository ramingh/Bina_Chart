# Bina_Chart

مخزن مستقل نمودارساز **BINA PivotChart**؛ کامپوننت Designer، Preview و Viewer با JavaScript/CSS/HTML و موتور SVG.

## وضعیت انتقال

- مخزن GitHub ساخته شده و مجوز نوشتن و Commit فعال است.
- **آخرین بسته تحویلی:** `BinaPivotChart_Designer_Viewer_v2.12.0.zip` (فایل در گفت‌وگو دریافت و بررسی شده است).
- **سورس اصلی هنوز در مخزن GitHub استخراج و منتشر نشده است.** ابزار واردسازی خودکار آماده شده و منتظر قرار گرفتن ZIP در پوشه `imports/` همین مخزن است.
- فایل‌های `scripts/import_chart_zip.py` و `.github/workflows/import-pivot-chart.yml` کدهای واقعی ابزار ورود هستند، نه سورس نمودارساز.

## ورود بسته اصلی به مخزن

**راهنما:** [docs/IMPORT_SOURCE_FA.md](docs/IMPORT_SOURCE_FA.md)

فایل `BinaPivotChart_Designer_Viewer_v2.12.0.zip` را در GitHub داخل پوشه `imports/` آپلود و Commit کنید. GitHub Actions تلاش می‌کند محتوای ZIP را بدون تغییر فایل‌های اصلی استخراج و روی شاخه `main` Commit کند. پس از اجرا باید وجود این فایل‌ها در ریشه مخزن را بررسی کنیم: `index.html`، `viewer.html`، `preview.html`، `js/BinaPivotChart.js`، `js/BinaPivotRenderer.js` و `css/BinaPivotChart.css`.

## قابلیت‌های بسته v2.12.0

- Designer و Viewer مستقل با قرارداد JSON (`schema: bina-pivotchart`, `version: 2`)
- محور X چندسطحی با Drag & Drop و فیلتر
- محاسبه شاخص‌های Y با SUM/AVG/COUNT و سایر تنظیمات نمودار
- نمایش‌های SVG دو‌بعدی و سه‌بعدی‌نما از جمله Pie
- تنظیم نمایش Series، رنگ، مقادیر، رگرسیون و R²
- SVG واکنش‌گرا و بدون اسکرول داخلی Chart Canvas
- نمونه سرویس ASP.NET ASMX، نیازمند پیکربندی احراز هویت/مجوز و تست جداگانه IIS

**نکته نسخه:** مقدار `COMPONENT_VERSION` در `js/BinaPivotChart.js` بسته دریافتی `2.12.0` است، ولی README داخلی و برخی سرآیندهای کد هنوز `2.10` را نشان می‌دهند. فایل‌های آرشیو بدون تغییر وارد خواهند شد.

## اجرای برنامه (پس از انتقال کامل)

1. `index.html` را برای Designer باز کنید.
2. `preview.html` از Designer داده پیش‌نمایش می‌گیرد.
3. `viewer.html` برای نمایش JSON ذخیره‌شده استفاده می‌شود.
4. برای استقرار سروری، `server/BinaPivotChartService.asmx` فقط نمونه است و باید قبل از استفاده عملیاتی تنظیم/بررسی شود.

## ساختار

- `js/`، `css/`، `samples/`، `server/`: فایل‌های سورس پس از ورود
- `docs/`: معماری، راهنمای انتقال و تاریخچه
- `scripts/`: واردکننده تأییدکننده ZIP
- `.github/workflows/`: اجرای ورود خودکار
- `imports/`: مسیر موقت بارگذاری آرشیو

پروژه مستقل از [Bina](https://github.com/ramingh/Bina) است؛ فایل `Bina_Bank.js` و سایر کامپوننت‌های اصلی BINA با این انتقال تغییر نمی‌کنند.
