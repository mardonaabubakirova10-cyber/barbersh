import crypto from 'crypto';

export interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  allows_write_to_pm?: boolean;
}

export interface ValidatedInitData {
  valid: boolean;
  user?: TelegramUserData;
  authDate?: number;
  queryId?: string;
  rawParams: Record<string, string>;
  isDev?: boolean;
}

/**
 * Validates Telegram Mini App initData string using the Bot Token.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramInitData(initDataStr: string, botToken?: string): ValidatedInitData {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;

  // If no initData string provided
  if (!initDataStr) {
    return { valid: false, rawParams: {} };
  }

  const params = new URLSearchParams(initDataStr);
  const hash = params.get('hash');
  const userStr = params.get('user');
  const authDateStr = params.get('auth_date');
  const queryId = params.get('query_id') || undefined;

  const rawParams: Record<string, string> = {};
  params.forEach((value, key) => {
    rawParams[key] = value;
  });

  let user: TelegramUserData | undefined;
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch {
      // Invalid user JSON
    }
  }

  const authDate = authDateStr ? parseInt(authDateStr, 10) : undefined;

  // In development / demo mode when bot token is not yet set
  if (!token || token === 'MOCK_BOT_TOKEN' || token.trim() === '') {
    return {
      valid: true,
      user,
      authDate,
      queryId,
      rawParams,
      isDev: true,
    };
  }

  if (!hash) {
    return { valid: false, rawParams, user };
  }

  // Build data_check_string
  const checkArr: string[] = [];
  params.forEach((value, key) => {
    if (key !== 'hash') {
      checkArr.push(`${key}=${value}`);
    }
  });
  checkArr.sort();
  const dataCheckString = checkArr.join('\n');

  // Compute secret key: HMAC_SHA256("WebAppData", botToken)
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(token)
    .digest();

  // Compute hash: HMAC_SHA256(secretKey, dataCheckString)
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  const isValid = calculatedHash === hash;

  return {
    valid: isValid,
    user: isValid ? user : undefined,
    authDate: isValid ? authDate : undefined,
    queryId: isValid ? queryId : undefined,
    rawParams,
  };
}
