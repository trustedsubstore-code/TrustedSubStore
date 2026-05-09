import { formatPrice } from './currency';

export function generateOrderText(items, totalAmount, currencyCode = 'USD') {
  let text = `Hello Mahmud! I would like to place an order from Trusted Sub Store.\n\n`;
  text += `*ORDER DETAILS:*\n\n`;
  
  items.forEach((item, index) => {
    text += `${index + 1}. *${item.name}*\n`;
    text += `   Plan: ${item.plan}\n`;
    text += `   Qty: ${item.quantity}\n`;
    text += `   Price: ${formatPrice(item.our_price.amount * item.quantity, currencyCode)}\n\n`;
  });
  
  text += `*Total Items:* ${items.reduce((sum, i) => sum + i.quantity, 0)}\n`;
  const formattedTotal = currencyCode === 'BDT' ? `BDT ${totalAmount.toFixed(0)}` : `USD ${totalAmount.toFixed(2)}`;
  text += `*Total Price:* ${formattedTotal}\n\n`;
  text += `Please let me know the payment details and next steps. Thank you!`;
  
  return encodeURIComponent(text);
}

// These should be configured to actual storefront numbers
export const WHATSAPP_NUMBER = "8801636790890";
export const TELEGRAM_HANDLE = "+8801636790890";

export function generateWhatsAppLink(items, totalAmount, currencyCode = 'USD') {
  const text = generateOrderText(items, totalAmount, currencyCode);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export function generateTelegramLink(items, totalAmount, currencyCode = 'USD') {
  const text = generateOrderText(items, totalAmount, currencyCode);
  return `https://t.me/${TELEGRAM_HANDLE}?text=${text}`;
}
