import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate a PDF report from analytics data
 * @param {object} options - Report options
 * @param {object} options.summary - Summary stats { clicks, conversions, revenue }
 * @param {array} options.dailyStats - Daily breakdown data
 * @param {array} options.campaigns - Campaign performance data
 * @param {string} options.dateRange - Date range label
 * @param {string} options.reportTitle - Title for the report
 */
export function generatePDFReport({
    summary = {},
    dailyStats = [],
    campaigns = [],
    dateRange = 'Last 30 Days',
    reportTitle = 'Performance Report'
}) {
    // Create new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Colors
    const primaryColor = [99, 102, 241]; // Indigo
    const textColor = [55, 65, 81];
    const lightGray = [243, 244, 246];

    let yPosition = 20;

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(reportTitle, 14, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Period: ${dateRange}`, 14, 35);

    yPosition = 55;

    // Summary Cards
    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance Summary', 14, yPosition);

    yPosition += 10;

    const formatCurrency = (val) => `$${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatNumber = (val) => (val || 0).toLocaleString('en-US');

    // Summary boxes
    const boxWidth = (pageWidth - 42) / 4;
    const summaryData = [
        { label: 'Total Clicks', value: formatNumber(summary.clicks) },
        { label: 'Conversions', value: formatNumber(summary.conversions) },
        { label: 'Revenue', value: formatCurrency(summary.revenue) },
        { label: 'Conv. Rate', value: `${summary.clicks > 0 ? ((summary.conversions / summary.clicks) * 100).toFixed(2) : 0}%` },
    ];

    summaryData.forEach((item, i) => {
        const x = 14 + (i * (boxWidth + 4));

        doc.setFillColor(...lightGray);
        doc.roundedRect(x, yPosition, boxWidth, 25, 3, 3, 'F');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text(item.label.toUpperCase(), x + 5, yPosition + 8);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...textColor);
        doc.text(item.value, x + 5, yPosition + 20);
    });

    yPosition += 40;

    // Daily Stats Table
    if (dailyStats.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...textColor);
        doc.text('Daily Breakdown', 14, yPosition);

        yPosition += 5;

        doc.autoTable({
            startY: yPosition,
            head: [['Date', 'Clicks', 'Conversions', 'Revenue']],
            body: dailyStats.slice(0, 15).map(day => [
                day._id || day.date,
                formatNumber(day.clicks),
                formatNumber(day.conversions),
                formatCurrency(day.revenue)
            ]),
            styles: {
                fontSize: 9,
                cellPadding: 4,
            },
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251],
            },
            columnStyles: {
                0: { cellWidth: 40 },
                1: { halign: 'right' },
                2: { halign: 'right' },
                3: { halign: 'right' },
            },
            margin: { left: 14, right: 14 },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Check if we need a new page for campaigns
    if (yPosition > 200 && campaigns.length > 0) {
        doc.addPage();
        yPosition = 20;
    }

    // Campaign Performance Table
    if (campaigns.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...textColor);
        doc.text('Campaign Performance', 14, yPosition);

        yPosition += 5;

        doc.autoTable({
            startY: yPosition,
            head: [['Campaign', 'Clicks', 'Conv.', 'Rate', 'Revenue']],
            body: campaigns.slice(0, 10).map(camp => [
                camp.name || 'Unknown',
                formatNumber(camp.clicks),
                formatNumber(camp.conversions),
                `${(camp.conversionRate || 0).toFixed(1)}%`,
                formatCurrency(camp.revenue)
            ]),
            styles: {
                fontSize: 9,
                cellPadding: 4,
            },
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251],
            },
            columnStyles: {
                0: { cellWidth: 60 },
                1: { halign: 'right' },
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right' },
            },
            margin: { left: 14, right: 14 },
        });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(
            `Page ${i} of ${pageCount} | Affiliate Analytics Dashboard`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    // Save the PDF
    const filename = `report_${dateRange.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    return filename;
}
