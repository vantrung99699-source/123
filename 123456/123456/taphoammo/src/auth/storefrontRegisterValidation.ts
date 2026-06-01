/**
 * Quy tắc đăng ký storefront (demo). Thông báo tiếng Việt cho alert / UI.
 */

/** 6–24 ký tự: 1 chữ cái đầu + 5–23 ký tự (chữ, số, _). */
const USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{5,23}$/;

/** Email thực dụng (đủ cho demo; cho phép + % trong phần local). */
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;

export function validateStorefrontRegister(fields: {
  username: string;
  email: string;
  password: string;
  password2: string;
}): { ok: true } | { ok: false; message: string } {
  const username = fields.username.trim();
  const email = fields.email.trim();
  const { password, password2 } = fields;

  if (!username) {
    return { ok: false, message: 'Vui lòng nhập tài khoản.' };
  }
  if (username.length < 6 || username.length > 24) {
    return { ok: false, message: 'Tài khoản phải dài từ 6 đến 24 ký tự.' };
  }
  if (!USERNAME_RE.test(username)) {
    return {
      ok: false,
      message:
        'Tài khoản chỉ gồm chữ cái (a-z, A-Z), số và dấu gạch dưới; phải bắt đầu bằng chữ cái.',
    };
  }

  if (!email) {
    return { ok: false, message: 'Vui lòng nhập email.' };
  }
  if (email.length > 254) {
    return { ok: false, message: 'Email quá dài.' };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, message: 'Email không đúng định dạng (ví dụ: ten@gmail.com).' };
  }

  if (!password) {
    return { ok: false, message: 'Vui lòng nhập mật khẩu.' };
  }
  if (password.length < 8) {
    return { ok: false, message: 'Mật khẩu tối thiểu 8 ký tự.' };
  }
  if (password.length > 64) {
    return { ok: false, message: 'Mật khẩu tối đa 64 ký tự.' };
  }
  if (!/\p{L}/u.test(password)) {
    return { ok: false, message: 'Mật khẩu phải có ít nhất một chữ cái (có thể có dấu).' };
  }

  if (password !== password2) {
    return { ok: false, message: 'Mật khẩu nhập lại không khớp.' };
  }

  return { ok: true };
}
