import { Resend } from 'resend';
import { formatDate, formatTime } from './utils';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || 'Цаг Захиалга <onboarding@resend.dev>';

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY тохируулаагүй тул илгээгдсэнгүй: "${subject}" -> ${to}`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (error) {
    console.error('[email] Илгээхэд алдаа гарлаа:', error);
  }
}

function layout(title: string, bodyHtml: string) {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: #f8fafc; padding: 32px 16px;">
    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(135deg, #0ea5e9, #06b6d4); padding: 20px 24px;">
        <span style="color: #ffffff; font-size: 18px; font-weight: 700;">Цаг Захиалга</span>
      </div>
      <div style="padding: 24px;">
        <h1 style="font-size: 18px; color: #1e293b; margin: 0 0 16px;">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">Энэ мэйлийг Цаг Захиалга системээс автоматаар илгээв.</p>
      </div>
    </div>
  </div>`;
}

function detailRow(label: string, value: string) {
  return `<tr>
    <td style="padding: 6px 0; color: #64748b; font-size: 13px; width: 100px;">${label}</td>
    <td style="padding: 6px 0; color: #1e293b; font-size: 13px; font-weight: 600;">${value}</td>
  </tr>`;
}

interface ReservationEmailInfo {
  shopName: string;
  date: string;
  time: string;
  customerName: string;
}

export function reservationPendingEmail(info: ReservationEmailInfo) {
  return layout(
    'Захиалгын хүсэлт хүлээн авлаа',
    `<p style="color:#475569;font-size:14px;line-height:1.6;">Таны захиалгын хүсэлтийг хүлээн авлаа. Үйлчилгээний газраас баталгаажуулахыг хүлээнэ үү.</p>
     <table style="width:100%;margin-top:16px;">
       ${detailRow('Газар', info.shopName)}
       ${detailRow('Огноо', formatDate(info.date))}
       ${detailRow('Цаг', formatTime(info.time))}
     </table>`
  );
}

export function reservationConfirmedEmail(info: ReservationEmailInfo) {
  return layout(
    'Захиалга баталгаажлаа ✅',
    `<p style="color:#475569;font-size:14px;line-height:1.6;">Таны захиалга баталгаажлаа. Товлосон цагаасаа 5-10 минутын өмнө ирнэ үү.</p>
     <table style="width:100%;margin-top:16px;">
       ${detailRow('Газар', info.shopName)}
       ${detailRow('Огноо', formatDate(info.date))}
       ${detailRow('Цаг', formatTime(info.time))}
     </table>`
  );
}

export function reservationCancelledEmail(info: ReservationEmailInfo) {
  return layout(
    'Захиалга цуцлагдлаа',
    `<p style="color:#475569;font-size:14px;line-height:1.6;">Дараах захиалга цуцлагдсныг мэдэгдэж байна.</p>
     <table style="width:100%;margin-top:16px;">
       ${detailRow('Газар', info.shopName)}
       ${detailRow('Огноо', formatDate(info.date))}
       ${detailRow('Цаг', formatTime(info.time))}
     </table>`
  );
}

export function reservationCompletedEmail(info: ReservationEmailInfo & { pointsEarned?: number }) {
  const pointsLine = info.pointsEarned
    ? `<p style="color:#b45309;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:10px 14px;font-size:13px;margin-top:16px;">🎁 <b>${info.pointsEarned} оноо</b> хуримтлагдлаа. Оноогоо купон болгон ашиглаарай.</p>`
    : '';
  return layout(
    'Үйлчилгээ дууслаа, баярлалаа 🙏',
    `<p style="color:#475569;font-size:14px;line-height:1.6;">Таныг манай үйлчилгээг сонгосонд баярлалаа.</p>
     <table style="width:100%;margin-top:16px;">
       ${detailRow('Газар', info.shopName)}
       ${detailRow('Огноо', formatDate(info.date))}
       ${detailRow('Цаг', formatTime(info.time))}
     </table>
     ${pointsLine}`
  );
}

export function newReservationShopAlertEmail(info: ReservationEmailInfo) {
  return layout(
    'Шинэ захиалгын хүсэлт ирлээ',
    `<p style="color:#475569;font-size:14px;line-height:1.6;">Таны үйлчилгээний газарт шинэ захиалгын хүсэлт ирлээ. Удирдлагын хэсгээс баталгаажуулна уу.</p>
     <table style="width:100%;margin-top:16px;">
       ${detailRow('Захиалагч', info.customerName)}
       ${detailRow('Огноо', formatDate(info.date))}
       ${detailRow('Цаг', formatTime(info.time))}
     </table>`
  );
}
