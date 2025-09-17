// supabase/functions/create-payment/index.ts - ОБНОВЛЕННАЯ ВЕРСИЯ

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { v4 as uuidv4 } from 'https://deno.land/std@0.177.0/uuid/mod.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const yookassaShopId = Deno.env.get('YOOKASSA_SHOP_ID')
    const yookassaSecretKey = Deno.env.get('YOOKASSA_SECRET_KEY')

    if (!yookassaShopId || !yookassaSecretKey) {
      throw new Error('YooKassa credentials are not configured in environment variables.')
    }

    // Создаем аутентифицированный клиент для получения пользователя
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Получаем от клиента УЖЕ рассчитанную сумму и ID
    const { plan_id, promocode_id, amount } = await req.json()
    if (!plan_id || !amount || amount <= 0) {
      throw new Error('Invalid request: plan_id and a positive amount are required.')
    }

    const idempotenceKey = uuidv4()

    const paymentPayload = {
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB'
      },
      payment_method_data: {
        type: 'bank_card'
      },
      confirmation: {
        type: 'redirect',
        return_url: `chrome-extension://${Deno.env.get('CHROME_EXTENSION_ID')}/options/options.html?status=success`
      },
      capture: true,
      description: `Оплата подписки (plan: ${plan_id})`,
      metadata: {
        user_id: user.id,
        plan_id: plan_id,
        promocode_id: promocode_id || null
      }
    }
    
    // Отправляем запрос в ЮKassa
    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
        'Authorization': 'Basic ' + btoa(`${yookassaShopId}:${yookassaSecretKey}`),
      },
      body: JSON.stringify(paymentPayload),
    })

    const responseData = await response.json()

    if (!response.ok) {
        throw new Error(`YooKassa API Error: ${responseData.description || response.statusText}`);
    }

    return new Response(JSON.stringify({ confirmation_url: responseData.confirmation.confirmation_url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Error creating payment:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})