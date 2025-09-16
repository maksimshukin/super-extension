import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { v4 as uuidv4 } from 'https://deno.land/std@0.177.0/uuid/mod.ts'

// Проверяем наличие переменных окружения при старте функции
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const yookassaShopId = Deno.env.get('YOOKASSA_SHOP_ID');
const yookassaSecretKey = Deno.env.get('YOOKASSA_SECRET_KEY');

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Отсутствуют необходимые переменные окружения Supabase.');
}

// YooKassa ключи могут отсутствовать для тестирования
const isTestMode = !yookassaShopId || !yookassaSecretKey;
if (isTestMode) {
  console.log('YooKassa credentials not configured - running in test mode');
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Получаем plan_id и promocode из тела запроса
    const { plan_id, promocode } = await req.json();
    console.log('Получены параметры:', { plan_id, promocode });
    
    if (!plan_id) {
      throw new Error('Необходимо передать plan_id.');
    }
    
    // Если есть промокод, проверяем его
    let promocodeInfo = null;
    if (promocode) {
      console.log('Проверяем промокод:', { promocode, user_id: user.id, plan_id });
      const { data: promocodeData, error: promocodeError } = await supabaseAdmin.rpc('apply_promocode', {
        promocode_text: promocode,
        user_uuid: user.id,
        plan_id: plan_id
      });
      
      if (promocodeError) {
        throw new Error(`Ошибка промокода: ${promocodeError.message}`);
      }
      
      if (!promocodeData.success) {
        throw new Error(promocodeData.message);
      }
      
      promocodeInfo = promocodeData;
      
      // Если это бесплатные месяцы, создаем подписку без оплаты
      if (promocodeData.promocode.type === 'free_months') {
        const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin.rpc('apply_promocode_to_subscription', {
          promocode_text: promocode,
          user_uuid: user.id,
          plan_id: plan_id
        });
        
        if (subscriptionError) {
          throw new Error(`Ошибка создания подписки: ${subscriptionError.message}`);
        }
        
        return new Response(JSON.stringify({ 
          success: true,
          subscription_created: true,
          message: subscriptionData.message,
          promocode_info: promocodeInfo
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { data: plan, error: planError } = await supabaseAdmin.from('plans').select('*').eq('id', plan_id).single();
    if (planError || !plan) throw new Error('Выбранный тариф не найден.');

    let finalPrice = plan.price_per_month * plan.duration_months;
    
    // Применяем скидку от промокода
    if (promocodeInfo && promocodeInfo.discount) {
      finalPrice = Math.max(0, finalPrice - promocodeInfo.discount.amount);
    }
    
    // Если в тестовом режиме, возвращаем тестовую ссылку
    if (isTestMode) {
      return new Response(JSON.stringify({ 
        confirmation_url: 'https://yoomoney.ru/checkout/payments/v2/show?orderId=test_order_' + Date.now(),
        test_mode: true,
        message: 'Test mode - YooKassa credentials not configured',
        plan_name: plan.name,
        original_price: plan.price_per_month * plan.duration_months,
        final_price: finalPrice,
        promocode_info: promocodeInfo
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const idempotenceKey = uuidv4();

    const yookassaResponse = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
        'Authorization': 'Basic ' + btoa(`${yookassaShopId}:${yookassaSecretKey}`),
      },
      body: JSON.stringify({
        amount: { value: finalPrice.toFixed(2), currency: 'RUB' },
        payment_method_data: { type: 'bank_card' },
        // Используем стандартный return_url для расширения
        confirmation: { 
          type: 'redirect', 
          return_url: 'chrome-extension://gaonojlhdifcjhbcjojoegmnlkhgkame/options/options.html?status=success'
        },
        capture: true,
        description: `Подписка на тариф "${plan.name}"`,
        save_payment_method: true,
        metadata: { user_id: user.id, plan_id: plan.id },
      }),
    });

    const paymentData = await yookassaResponse.json();
    if (!yookassaResponse.ok || !paymentData.confirmation?.confirmation_url) {
      console.error('Yookassa API Error:', paymentData);
      throw new Error(paymentData.description || 'Ошибка при создании платежа в ЮKassa.');
    }

    return new Response(JSON.stringify({ confirmation_url: paymentData.confirmation.confirmation_url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Edge Function Error:', error.message);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString(),
      stack: error.stack 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    });
  }
})