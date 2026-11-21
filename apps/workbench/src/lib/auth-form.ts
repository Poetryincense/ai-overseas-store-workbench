export interface LoginFormValues {
  readonly email: string;
  readonly password: string;
}

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 320;
const MAX_PASSWORD_LENGTH = 1024;

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};
  const email = values.email.trim();

  if (email.length === 0) {
    errors.email = "请输入邮箱。";
  } else if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    errors.email = "请输入有效的邮箱地址。";
  }

  if (values.password.length === 0) {
    errors.password = "请输入密码。";
  } else if (values.password.length > MAX_PASSWORD_LENGTH) {
    errors.password = "密码长度超出限制。";
  }

  return errors;
}

export function describeLoginFailure(status: number): string {
  switch (status) {
    case 401:
      return "邮箱或密码不正确。";
    case 403:
      return "安全校验未通过，请刷新页面后重试。";
    case 429:
      return "尝试次数过多，请 15 分钟后再试。";
    case 503:
      return "认证服务暂不可用，请稍后重试。";
    default:
      return "登录失败，请稍后重试。";
  }
}

export function describeLogoutFailure(): string {
  return "退出失败，请稍后重试。";
}
