export const generateRegisterOtpEmailTemplate = (otp: string): string => `
  <div style="font-family:sans-serif; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; max-width: 420px; margin: 30px auto; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
    <h2 style="text-align: center; color: #2c3e50; margin-bottom: 20px;">Verify Your OTP</h2>
    <p style="font-size: 16px; color: #34495e; margin: 0 0 10px 0;">Hello,</p>
    <p style="font-size: 16px; color: #34495e; margin: 0 0 10px 0;">Your One Time Password (OTP) is:</p>
    <div style="text-align: center; margin: 20px 0;">
      <span style="display: inline-block; background: #ecf0f1; padding: 12px 24px; font-size: 24px; font-weight: bold; color: #2c3e50; letter-spacing: 2px; border-radius: 6px;">
        ${otp}
      </span>
    </div>
    <p style="font-size: 14px; color: #7f8c8d; margin-bottom: 0;">
      This OTP will expire in <strong>10 minutes</strong>. Please do not share this code with anyone.
    </p>
  </div>
`;

export const generateResetPasswordOtpEmailTemplate = (otp: string): string => `
  <div style="font-family:sans-serif; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; max-width: 420px; margin: 30px auto; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
    <h2 style="text-align: center; color: #2c3e50; margin-bottom: 20px;">Verify Your OTP</h2>
    <p style="font-size: 16px; color: #34495e; margin: 0 0 10px 0;">Hello,</p>
    <p style="font-size: 16px; color: #34495e; margin: 0 0 10px 0;">Your One Time Password (OTP) is:</p>
    <div style="text-align: center; margin: 20px 0;">
      <span style="display: inline-block; background: #ecf0f1; padding: 12px 24px; font-size: 24px; font-weight: bold; color: #2c3e50; letter-spacing: 2px; border-radius: 6px;">
        ${otp}
      </span>
    </div>
    <p style="font-size: 14px; color: #7f8c8d; margin-bottom: 0;">
      This OTP will expire in <strong>10 minutes</strong>. Please do not share this code with anyone.
    </p>
  </div>
`;

