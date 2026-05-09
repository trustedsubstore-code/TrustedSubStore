import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { convertPrice } from './currency';

function formatExportPrice(amount, currencyCode) {
  const converted = convertPrice(amount, currencyCode);
  return converted.toFixed((currencyCode === 'BDT' || currencyCode === 'KRW') ? 0 : 2);
}

export const downloadProductsPDF = async (products, includePrice = true, currency = 'USD', resellerName = '', resellerWhatsapp = '') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const brandColor = [147, 51, 234]; // Tailwind brand-600
  const darkTextColor = [17, 24, 39]; // slate-900
  const grayTextColor = [107, 114, 128]; // slate-500

  const brandName = "Trusted Subscription Store";

  let watermarkImgData = null;
  try {
    watermarkImgData = await fetch('/logo.png').then(res => res.blob()).then(blob => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    });
  } catch (err) { }

  // 1. Draw Header Banner
  doc.setFillColor(...brandColor);
  doc.rect(0, 0, pageWidth, 42, 'F');

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(brandName, 10, 16);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'italic');
  doc.text('"Cut the Cost, Keep the Premium"', 10, 24);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text("We strictly do NOT sell Shared Accounts", 10, 32);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text("Product Catalog", pageWidth - 10, 24, { align: 'right' });

  // 2. Date & Currency Meta
  const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  const formattedDate = new Intl.DateTimeFormat('en-GB', dateOptions).format(new Date());

  doc.setFontSize(10);
  doc.setTextColor(...grayTextColor);
  doc.text(`Generated: ${formattedDate}`, 10, 52);
  
  const currencyText = `Currency: ${currency === 'BDT' ? 'Taka' : currency === 'EUR' ? 'Euro' : currency === 'GBP' ? 'Pound' : currency === 'KRW' ? 'Won' : 'USD'}`;
  doc.text(currencyText, pageWidth - 10, 52, { align: 'right' });

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(10, 56, pageWidth - 10, 56);

  const loadedImages = {};
  await Promise.all(products.map(async (product, index) => {
    if (product.image) {
      try {
        let fetchUrl = product.image;
        if (fetchUrl.startsWith('http') && !fetchUrl.includes(window.location.host)) {
          fetchUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(fetchUrl)}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); 

        const blob = await fetch(fetchUrl, { signal: controller.signal }).then(res => res.blob());
        clearTimeout(timeoutId);

        const objectUrl = URL.createObjectURL(blob);
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = objectUrl;
        });

        const nw = img.naturalWidth || img.width || 512;
        const nh = img.naturalHeight || img.height || 512;

        const canvas = document.createElement('canvas');
        canvas.width = nw;
        canvas.height = nh;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, nw, nh);
        ctx.drawImage(img, 0, 0, nw, nh);

        loadedImages[index] = {
          data: canvas.toDataURL('image/jpeg', 0.85),
          w: nw,
          h: nh
        };
        URL.revokeObjectURL(objectUrl);
      } catch (err) { }
    }
  }));

  const tableColumn = ["S/N", "Logo", "Product Name", "Plan", "Category", "Duration"];
  if (includePrice) {
    tableColumn.push("Official Price", "Our Price", "Saved");
  }

  const tableRows = products.map((product, index) => {
    const row = [
      index + 1,
      '',
      product.name,
      product.plan,
      product.category,
      product.official_price?.duration || "N/A"
    ];
    if (includePrice) {
      const officialAmount = product.official_price ? parseFloat(product.official_price.amount) : 0;
      const official = officialAmount > 0 ? formatExportPrice(product.official_price.amount, currency) : "-";
      const ourPrice = formatExportPrice(product.our_price.amount, currency);
      const saved = (product.saved_amount && officialAmount > 0) ? formatExportPrice(product.saved_amount.amount, currency) : "-";
      row.push(official, ourPrice, saved);
    }
    return row;
  });

  autoTable(doc, {
    startY: 62,
    head: [tableColumn],
    body: tableRows,
    theme: 'plain',
    headStyles: { 
      fillColor: brandColor, 
      textColor: 255, 
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      textColor: darkTextColor,
      lineWidth: { bottom: 0.1 },
      lineColor: [229, 231, 235]
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { left: 10, right: 10 },
    styles: { 
      fontSize: 8, 
      cellPadding: { top: 4, right: 2, bottom: 4, left: 2 },
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center' },
      6: { halign: 'center' },
      7: { halign: 'center', fontStyle: 'bold', textColor: brandColor },
      8: { halign: 'center', textColor: [32, 189, 90], fontStyle: 'bold' }
    },
    didDrawCell: function (data) {
      if (data.column.index === 1 && data.cell.section === 'body') {
        const imgObj = loadedImages[data.row.index];
        if (imgObj && imgObj.data) {
          const maxDim = 8;
          let w = maxDim;
          let h = maxDim;
          if (imgObj.w > imgObj.h) {
            h = (imgObj.h / imgObj.w) * maxDim;
          } else if (imgObj.h > imgObj.w) {
            w = (imgObj.w / imgObj.h) * maxDim;
          }

          const x = data.cell.x + (data.cell.width - w) / 2;
          const y = data.cell.y + (data.cell.height - h) / 2;
          doc.addImage(imgObj.data, 'JPEG', x, y, w, h);
        }
      }
    },
    didDrawPage: function(data) {
      if (watermarkImgData) {
        doc.setGState(new doc.GState({ opacity: 0.05 }));
        // Center watermark (aspect ratio 1:1 assumed for logo)
        doc.addImage(watermarkImgData, 'PNG', (pageWidth - 100) / 2, (pageHeight - 100) / 2, 100, 100);
        doc.setGState(new doc.GState({ opacity: 1.0 }));
      }

      const str = "Page " + doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...grayTextColor);
      
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(10, pageHeight - 15, pageWidth - 10, pageHeight - 15);
      
      doc.text(str, pageWidth - 10, pageHeight - 8, { align: 'right' });
      doc.text("Honest Warranty: Guaranteed for as long as I am alive. (Fix, Replace or Refund)", 10, pageHeight - 8);
    }
  });

  let finalY = doc.lastAutoTable.finalY + 10;

  if (resellerName || resellerWhatsapp) {
    if (finalY > pageHeight - 50) {
      doc.addPage();
      finalY = 20;
    }

    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(10, finalY, pageWidth - 20, 36, 4, 4, 'FD');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkTextColor);
    doc.text("Need more details or ready to purchase?", 16, finalY + 10);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayTextColor);
    doc.text("Feel free to directly call or text us at the number below.", 16, finalY + 16);

    doc.setDrawColor(226, 232, 240);
    doc.line(16, finalY + 21, pageWidth - 16, finalY + 21);

    let currentY = finalY + 29;

    if (resellerName) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkTextColor);
      doc.text(resellerName, 16, currentY);
    } else {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkTextColor);
      doc.text("Contact Information", 16, currentY);
    }

    if (resellerWhatsapp) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkTextColor);

      let cleanNumber = resellerWhatsapp.replace(/[^\d+]/g, '');
      if (cleanNumber.startsWith('01') && cleanNumber.length === 11) {
        cleanNumber = `88${cleanNumber}`;
      } else if (cleanNumber.startsWith('1') && cleanNumber.length === 10) {
        cleanNumber = `880${cleanNumber}`;
      }
      const waUrl = `https://wa.me/${cleanNumber}`;

      doc.text(`Mobile: ${resellerWhatsapp}`, pageWidth / 2, currentY, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...brandColor);
      doc.textWithLink("WhatsApp Click Here", pageWidth - 16, currentY, { url: waUrl, align: 'right' });
    }
    
    finalY += 40;
  } else {
    // Also push down finalY if no reseller info to prevent overlap with footer notes
    finalY += 10;
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...grayTextColor);
  doc.text("* Pricing subject to change. Please verify the latest prices during inquiry.", 14, finalY);

  const fileNameDate = formattedDate.replace(/\s+/g, '_');
  doc.save(`TSS_Products_${fileNameDate}.pdf`);
}

export function downloadProductsText(products, includePrice = true, currency = 'USD', resellerName = '', resellerWhatsapp = '') {
  const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  const formattedDate = new Intl.DateTimeFormat('en-GB', dateOptions).format(new Date());

  let content = "Trusted Subscription Store\nProduct List\n";
  content += `Date: ${formattedDate} | Currency: ${currency === 'BDT' ? 'Taka' : currency === 'EUR' ? 'Euro' : currency === 'GBP' ? 'Pound' : currency === 'KRW' ? 'Won' : 'USD'}\n\n`;

  products.forEach((p, idx) => {
    content += `${idx + 1}. ${p.name} - ${p.plan}\n`;
    content += `   Category: ${p.category} | Duration: ${p.official_price?.duration || "N/A"}\n`;
    if (includePrice) {
      const officialAmount = p.official_price ? parseFloat(p.official_price.amount) : 0;
      const official = officialAmount > 0 ? formatExportPrice(p.official_price.amount, currency) : "-";
      const ourPrice = formatExportPrice(p.our_price.amount, currency);
      const saved = (p.saved_amount && officialAmount > 0) ? formatExportPrice(p.saved_amount.amount, currency) : "-";
      content += `   Official Price: ${official} | Our Price: ${ourPrice} | Saved: ${saved}\n`;
    }
    content += "\n";
  });

  if (resellerName || resellerWhatsapp) {
    content += "\nFeel free to call or text:\n";
    if (resellerName) content += `${resellerName}\n`;
    if (resellerWhatsapp) {
      let cleanNumber = resellerWhatsapp.replace(/[^\d+]/g, '');
      if (cleanNumber.startsWith('01') && cleanNumber.length === 11) {
        cleanNumber = `88${cleanNumber}`;
      } else if (cleanNumber.startsWith('1') && cleanNumber.length === 10) {
        cleanNumber = `880${cleanNumber}`;
      }
      content += `Mobile: ${resellerWhatsapp}\n`;
      content += `WhatsApp Link: https://wa.me/${cleanNumber}\n`;
    }
  }
  content += "\n*Price may vary\n";

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const fileNameDate = formattedDate.replace(/\s+/g, '_');
  link.download = `TSS_Products_${fileNameDate}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}
