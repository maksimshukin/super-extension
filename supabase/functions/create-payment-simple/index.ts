import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Получаем plan_id из тела запроса
    const { plan_id } = await req.json();
    console.log('Получен plan_id:', plan_id);
    
    if (!plan_id) {
      throw new Error('Необходимо передать plan_id.');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Пользователь не найден.');

    console.log('Пользователь найден:', user.id);

    // Получаем информацию о тарифе
    const { data: plan, error: planError } = await supabaseClient.from('plans').select('*').eq('id', plan_id).single();
    if (planError || !plan) throw new Error('Выбранный тариф не найден.');

    console.log('Тариф найден:', plan);

    const finalPrice = plan.price_per_month * plan.duration_months;
    
    // Проверяем, настроены ли YooKassa
    const yookassaShopId = Deno.env.get('YOOKASSA_SHOP_ID');
    const yookassaSecretKey = Deno.env.get('YOOKASSA_SECRET_KEY');

    const isTestMode = !yookassaShopId || !yookassaSecretKey;
    if (isTestMode) {
      console.log('YooKassa credentials not configured - running in test mode');
    }
    
    // Если в тестовом режиме, возвращаем тестовую ссылку
    if (isTestMode) {
      return new Response(JSON.stringify({ 
        confirmation_url: 'https://yoomoney.ru/checkout/payments/v2/show?orderId=test_order_' + Date.now(),
        test_mode: true,
        message: 'Test mode - YooKassa credentials not configured',
        plan_name: plan.name,
        final_price: finalPrice
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Здесь был бы код для YooKassa, но пока возвращаем тестовую ссылку
    return new Response(JSON.stringify({ 
      confirmation_url: 'https://yoomoney.ru/checkout/payments/v2/show?orderId=test_order_' + Date.now(),
      test_mode: true,
      message: 'Test mode - YooKassa integration not implemented yet',
      plan_name: plan.name,
      final_price: finalPrice
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge Function Error:', error.message);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString()
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    });
  }
})
