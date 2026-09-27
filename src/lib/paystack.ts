const PAYSTACK_BASE = 'https://api.paystack.co'

export function isPaystackConfigured(): boolean {
  const key = process.env.PAYSTACK_SECRET_KEY
  return !!key && !key.includes('replace_me')
}

export async function initializeTransaction(params: {
  email: string
  amountNaira: number
  reference: string
  callbackUrl: string
}) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amountNaira * 100), // kobo
      reference: params.reference,
      callback_url: params.callbackUrl,
    }),
  })

  const data = await res.json()
  if (!res.ok || !data.status) {
    throw new Error(data.message || 'Failed to initialize Paystack transaction')
  }
  return data.data as { authorization_url: string; access_code: string; reference: string }
}

export async function verifyTransaction(reference: string) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  })

  const data = await res.json()
  if (!res.ok || !data.status) {
    throw new Error(data.message || 'Failed to verify Paystack transaction')
  }
  return data.data as { status: string; reference: string; amount: number; gateway_response: string }
}
