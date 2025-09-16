import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { v4 as uuidv4 } from 'https://deno.land/std@0.177.0/uuid/mod.ts'

// Admin-клиент для доступа к защищенным данным
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { plan_id, promocode } = await req.json();
    
    // Создаем клиент от имени пользователя, который сделал запрос
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('User not found');

    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single();
    if (planError || !plan) throw new Error('Plan not found');

    let finalPrice = plan.price_per_month * plan.duration_months;
    let promocode_id = null;

    // --- ИСПРАВЛЕННАЯ ЛОГИКА ПРОВЕРКИ ПРОМОКОДА ---
    if (promocode) {
      // Используем supabaseAdmin для обхода RLS
      const { data: promoData, error: promoError } = await supabaseAdmin
        .from('promocodes')
        .select('*')
        .eq('code', promocode)
        .single();

      if (promoError) {
        throw new Error('Промокод не найден.');
      }
      
      if (promoData && promoData.is_active && new Date(promoData.expires_at) > new Date()) {
          const discountMultiplier = 1 - (promoData.discount_percent / 100);
          finalPrice *= discountMultiplier;
          promocode_id = promoData.id;
      } else {
          throw new Error('Промокод недействителен или истек.');
      }
    }
    // --- КОНЕЦ ИСПРАВЛЕННОЙ ЛОГИКИ ---

    const idempotenceKey = uuidv4();

    const yookassaResponse = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
        'Authorization': 'Basic ' + btoa(
          Deno.env.get('YOOKASSA_SHOP_ID') + ':' + Deno.env.get('YOOKASSA_SECRET_KEY')
        ),
      },
      body: JSON.stringify({
        amount: {
          value: finalPrice.toFixed(2),
          currency: 'RUB',
        },
        payment_method_data: { type: 'bank_card' },
        confirmation: {
          type: 'redirect',
          return_url: `chrome-extension://gaonojlhdifcjhbcjojoegmnlkhgkame/options/options.html?status=success`, 
        },
        capture: true,
        description: `Подписка на тариф "${plan.name}"`,
        save_payment_method: true,
        metadata: {
          user_id: user.id,
          plan_id: plan.id,
          promocode_id: promocode_id,
        },
      }),
    });

    const paymentData = await yookassaResponse.json();
    if (!paymentData.confirmation?.confirmation_url) {
        console.error('Yookassa response error:', paymentData);
        throw new Error('Failed to create Yookassa payment.');
    }

    return new Response(JSON.stringify({ confirmation_url: paymentData.confirmation.confirmation_url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})