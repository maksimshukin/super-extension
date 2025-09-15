import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  try {
    const { event, object: payment } = await req.json();

    // Обрабатываем только успешные платежи
    if (event === 'payment.succeeded' && payment.paid) {
      const { user_id, plan_id, promocode_id } = payment.metadata;

      const { data: plan } = await supabaseAdmin.from('plans').select('*').eq('id', plan_id).single();
      if (!plan) throw new Error(`Webhook Error: Plan with ID ${plan_id} not found.`);

      const { data: currentSubscription } = await supabaseAdmin.from('subscriptions').select('*').eq('user_id', user_id).single();

      let newEndDate;
      // Если у пользователя уже есть активная подписка, продлеваем её
      if (currentSubscription && new Date(currentSubscription.current_period_ends_at) > new Date()) {
        newEndDate = new Date(currentSubscription.current_period_ends_at);
      } else {
        // Иначе отсчитываем от текущей даты
        newEndDate = new Date();
      }
      newEndDate.setMonth(newEndDate.getMonth() + plan.duration_months);

      const subscriptionData = {
        user_id,
        plan_id,
        status: 'active',
        yookassa_payment_method_id: payment.payment_method.id,
        current_period_ends_at: newEndDate.toISOString(),
        trial_ends_at: null,
        used_promocode_id: promocode_id || null // Сохраняем ID промокода
      };

      const { error } = await supabaseAdmin
        .from('subscriptions')
        .upsert(subscriptionData, { onConflict: 'user_id' });

      if (error) throw error;

      // Если был использован промокод, увеличиваем счетчик его использования
      if (promocode_id) {
        await supabaseAdmin.rpc('increment_promocode_usage', { pid: promocode_id });
      }
    }

    return new Response('ok', { status: 200 });
  } catch (error) {
    console.error('Yookassa webhook error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
})