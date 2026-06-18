// LOGO URL
const LOGO_URL = 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/logo/logo.png';

export function depositInitiatedUserEmail(name: string, amount: number, network: string) {
  return `
    <div style="background-color: #0b0e14; padding: 40px 20px; font-family: 'Inter', Arial, sans-serif; color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #141a24; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.06);">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${LOGO_URL}" alt="SmartCodeNova" style="height: 48px; width: auto;" />
        </div>
        <h2 style="color: #6366f1; font-size: 24px; font-weight: 700; margin: 0 0 10px 0;">Deposit Request Received</h2>
        <p style="color: #8e96a3; font-size: 16px; margin: 0 0 20px 0;">We have received your deposit request.</p>
        
        <div style="background-color: #0b0e14; border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.05); margin: 20px 0;">
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">User:</strong> <span style="color: #8e96a3;">${name}</span></p>
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">Amount:</strong> <span style="color: #10b981; font-weight: 700; font-size: 18px;">${amount} USDT</span></p>
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">Network:</strong> <span style="color: #8e96a3;">${network}</span></p>
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">Status:</strong> <span style="color: #f59e0b; background-color: rgba(245,158,11,0.1); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">Pending Verification</span></p>
        </div>

        <p style="color: #8e96a3; font-size: 14px; margin-top: 20px;">Our admin team is currently verifying your transaction on the blockchain. You will receive a confirmation email once your deposit is approved and credited to your wallet.</p>
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.05); margin: 30px 0;">
        <p style="color: #8e96a3; font-size: 12px; text-align: center;">SmartCodeNova Support Team</p>
      </div>
    </div>
  `;
}

export function depositApprovedUserEmail(name: string, amount: number, newBalance: number) {
  return `
    <div style="background-color: #0b0e14; padding: 40px 20px; font-family: 'Inter', Arial, sans-serif; color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #141a24; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.06);">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${LOGO_URL}" alt="SmartCodeNova" style="height: 48px; width: auto;" />
        </div>
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="background-color: #10b981; color: white; font-size: 24px; padding: 12px; border-radius: 50%; display: inline-block;">✅</span>
        </div>
        <h2 style="color: #10b981; font-size: 24px; font-weight: 700; margin: 0 0 10px 0;">Deposit Approved!</h2>
        <p style="color: #8e96a3; font-size: 16px; margin: 0 0 20px 0;">Your deposit has been successfully verified and credited.</p>
        
        <div style="background-color: #0b0e14; border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.05); margin: 20px 0;">
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">User:</strong> <span style="color: #8e96a3;">${name}</span></p>
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">Credited Amount:</strong> <span style="color: #10b981; font-weight: 700; font-size: 20px;">+${amount} USDT</span></p>
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">New Funding Balance:</strong> <span style="color: #f3f4f6; font-weight: 700;">${newBalance.toFixed(2)} USDT</span></p>
        </div>

        <p style="color: #8e96a3; font-size: 14px; margin-top: 20px;">You can now activate a trading bot or start trading directly from your dashboard.</p>
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.05); margin: 30px 0;">
        <p style="color: #8e96a3; font-size: 12px; text-align: center;">SmartCodeNova Support Team</p>
      </div>
    </div>
  `;
}

export function adminDepositAlert(email: string, name: string, amount: number, txid: string, network: string) {
  return `
    <div style="background-color: #0b0e14; padding: 40px 20px; font-family: 'Inter', Arial, sans-serif; color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #141a24; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.06);">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${LOGO_URL}" alt="SmartCodeNova" style="height: 48px; width: auto;" />
        </div>
        <div style="text-align: center; margin-bottom: 10px;">
          <span style="background-color: #ef4444; color: white; font-size: 16px; padding: 10px 16px; border-radius: 20px; font-weight: 700;">🚨 ADMIN ALERT</span>
        </div>
        <h2 style="color: #f3f4f6; font-size: 22px; font-weight: 700; margin: 0 0 10px 0;">New Pending Deposit</h2>
        <p style="color: #8e96a3; font-size: 14px; margin: 0 0 20px 0;">A user has submitted a new deposit request. Please verify the TXID and approve it.</p>
        
        <div style="background-color: #0b0e14; border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.05); margin: 20px 0;">
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">User:</strong> <span style="color: #8e96a3;">${email}</span></p>
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">Amount:</strong> <span style="color: #10b981; font-weight: 700; font-size: 18px;">${amount} USDT</span></p>
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">Network:</strong> <span style="color: #8e96a3;">${network}</span></p>
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">TXID:</strong> <span style="color: #f59e0b; word-break: break-all; font-size: 12px;">${txid}</span></p>
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">Date/Time:</strong> <span style="color: #8e96a3;">${new Date().toLocaleString()}</span></p>
        </div>

        <p style="color: #8e96a3; font-size: 12px; margin-top: 20px;">Verify the TXID on the blockchain, then approve this deposit in the Admin Panel.</p>
      </div>
    </div>
  `;
}