export function parseUTCDate(dateStr: string | null | undefined) {
  if (!dateStr) return new Date()
  // If the date string doesn't have a timezone indicator, assume it's UTC and append Z
  const normalized = (dateStr.includes('Z') || dateStr.includes('+')) ? dateStr : `${dateStr.replace(' ', 'T')}Z`
  return new Date(normalized)
}

export function buildReceiptHtml(order: any, template: any, excRate: number): string {
  const shopName = template?.shopName || 'My Shop'
  const address = template?.address || ''
  const phone1 = template?.phone1 || ''
  const phone1Provider = template?.phone1Provider || 'Cellcard'
  const phone2 = template?.phone2 || ''
  const phone2Provider = template?.phone2Provider || 'Smart'
  const bankAccountNo = template?.bankAccountNo || ''
  const bankAccountName = template?.bankAccountName || ''
  const bankQrImageUrl = template?.bankQrImageUrl || ''
  const bottomMessage = template?.bottomMessage || 'Thank you for shopping with us!'
  const logoUrl = template?.logoUrl || ''

  const subtotal = order.totalAmount + (order.discountAmount || 0) + (order.loyaltyPointsRedeemed ? order.loyaltyPointsRedeemed * 0.01 : 0) - (order.shippingFee || 0)
  const discount = order.discountAmount || 0
  const shipping = order.shippingFee || 0
  const total = order.totalAmount
  const totalRiel = (total * excRate).toFixed(0)
  const received = order.receivedAmount || total
  const change = order.change || 0
  const changeRiel = (change * excRate).toFixed(0)
  const date = parseUTCDate(order.createdAt).toLocaleString()
  const invoiceNo = (order.orderNumber || '').substring(0, 10).toUpperCase()

  const rows = (order.items || []).map((item: any, i: number) => `
    <tr>
      <td style="padding:3px 4px;border-bottom:1px solid #eee;vertical-align:top;">${i + 2}</td>
      <td style="padding:3px 4px;border-bottom:1px solid #eee;">
        <div class="bold">${item.name || item.sku || ''}</div>
        ${item.description ? `<div style="font-size:9px;color:#666;font-style:italic;">${item.description}</div>` : ''}
      </td>
      <td style="padding:3px 4px;border-bottom:1px solid #eee;text-align:center;vertical-align:top;">${item.quantity}</td>
      <td style="padding:3px 4px;border-bottom:1px solid #eee;text-align:right;vertical-align:top;">${Number(item.price).toFixed(2)}</td>
      <td style="padding:3px 4px;border-bottom:1px solid #eee;text-align:right;vertical-align:top;">${Number(item.price).toFixed(2)}</td>
      <td style="padding:3px 4px;border-bottom:1px solid #eee;text-align:right;vertical-align:top;">$${(item.quantity * item.price).toFixed(2)}</td>
    </tr>`).join('')

  const deliveryRow = (shipping >= 0) ? `
    <tr>
      <td style="padding:3px 4px;border-bottom:1px solid #eee;vertical-align:top;">1</td>
      <td style="padding:3px 4px;border-bottom:1px solid #eee;"><div class="bold">Delivery Fee / សេវាដឹកជញ្ជូន</div></td>
      <td style="padding:3px 4px;border-bottom:1px solid #eee;text-align:center;vertical-align:top;">1</td>
      <td style="padding:3px 4px;border-bottom:1px solid #eee;text-align:right;vertical-align:top;">${shipping.toFixed(2)}</td>
      <td style="padding:3px 4px;border-bottom:1px solid #eee;text-align:right;vertical-align:top;">${shipping.toFixed(2)}</td>
      <td style="padding:3px 4px;border-bottom:1px solid #eee;text-align:right;vertical-align:top;">$${shipping.toFixed(2)}</td>
    </tr>` : ''

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt</title>
<style>
  body{font-family:Arial,sans-serif;font-size:11px;width:300px;margin:0 auto;padding:8px;}
  .center{text-align:center;} .bold{font-weight:bold;} .gray{color:#555;}
  .big{font-size:14px;font-weight:bold;}
  table{width:100%;border-collapse:collapse;}
  th{background:#222;color:#fff;padding:4px;text-align:left;font-size:10px;}
  .total-row td{font-weight:bold;padding:3px 4px;background:#f5f5f5;}
  .grand-row td{font-weight:bold;padding:3px 4px;background:#222;color:#fff;}
  @media print{body{width:100%;}}
</style></head><body>
<div class="center">
  ${logoUrl ? `<img src="${logoUrl}" style="height:50px;margin-bottom:4px;" />` : ''}
  <div class="big">${shopName}</div>
  ${address ? `<div class="gray">${address}</div>` : ''}
  ${phone1 ? `<div>${phone1Provider}: ${phone1}${phone2 ? ` / ${phone2Provider}: ${phone2}` : ''}</div>` : ''}
</div>
<div style="background:#222;color:#fff;text-align:center;padding:4px;margin:8px 0;font-weight:bold;letter-spacing:1px;">វិក្កយបត្រ / INVOICE</div>
<table style="margin-bottom:6px;">
  <tr><td class="gray">Invoice No</td><td class="bold">: ${invoiceNo}</td></tr>
  <tr><td class="gray">Date</td><td>: ${date}</td></tr>
  <tr><td class="gray">Customer</td><td>: ${order.customer?.name || 'Walk-in'}</td></tr>
  ${order.customer?.phone ? `<tr><td class="gray">Phone</td><td>: ${order.customer.phone}</td></tr>` : ''}
</table>
<table>
  <thead><tr>
    <th>#</th><th>Description</th><th style="text-align:center;">Qty</th>
    <th style="text-align:right;">Price</th><th style="text-align:right;">After Disc</th><th style="text-align:right;">Amount</th>
  </tr></thead>
  <tbody>${deliveryRow}${rows}</tbody>
</table>
<div style="margin-top:8px;">
  <table>
    <tr><td colspan="2" style="padding:2px 4px;text-align:right;">Items Purchase: ${order.items?.length || 0} (Qty: ${(order.items || []).reduce((a: number, i: any) => a + i.quantity, 0)})</td></tr>
    <tr><td style="padding:2px 4px;">Sub-Total ($)</td><td style="text-align:right;">$${Number(subtotal).toFixed(2)}</td></tr>
    <tr><td style="padding:2px 4px;">Delivery Fee</td><td style="text-align:right;">$${shipping.toFixed(2)}</td></tr>
    ${discount > 0 ? `<tr><td style="padding:2px 4px;">Disc.</td><td style="text-align:right;">-$${discount.toFixed(2)}</td></tr>` : ''}
  </table>
  <table>
    <tr class="grand-row"><td style="padding:3px 4px;">Total ($)</td><td style="text-align:right;">$${total.toFixed(2)}</td></tr>
    <tr class="grand-row"><td style="padding:3px 4px;">Total (៛)</td><td style="text-align:right;">៛${Number(totalRiel).toLocaleString()}</td></tr>
    <tr class="total-row"><td style="padding:3px 4px;">Received ($)</td><td style="text-align:right;">$${Number(received).toFixed(2)}</td></tr>
    <tr class="total-row"><td style="padding:3px 4px;">Return ($)</td><td style="text-align:right;">$${Number(change).toFixed(2)}</td></tr>
    <tr class="total-row"><td style="padding:3px 4px;">Return (៛)</td><td style="text-align:right;">៛${Number(changeRiel).toLocaleString()}</td></tr>
  </table>
</div>
${bankQrImageUrl ? `
<div style="text-align:center;margin-top:10px;">
  <div style="font-weight:bold;font-size:10px;">***Scan here to pay by KHQR***</div>
  <img src="${bankQrImageUrl}" style="width:120px;height:120px;margin:6px auto;display:block;object-fit:contain;" />
  ${bankAccountNo ? `<div>Account #: ${bankAccountNo}</div>` : ''}
  ${bankAccountName ? `<div>Account Name: ${bankAccountName}</div>` : ''}
</div>` : ''}
<div style="text-align:center;margin-top:10px;font-size:10px;color:#555;font-style:italic;">${bottomMessage}</div>
</body></html>`
}
