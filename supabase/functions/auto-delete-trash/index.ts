import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Supabaseクライアントの作成
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 30日前の日付を計算
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const cutoffDate = thirtyDaysAgo.toISOString()

    // 30日前に削除されたアイテムを取得
    const { data: itemsToDelete, error: selectError } = await supabaseClient
      .from('wishlist')
      .select('id')
      .eq('deleted', true)
      .lte('deleted_at', cutoffDate)

    if (selectError) {
      throw selectError
    }

    if (!itemsToDelete || itemsToDelete.length === 0) {
      return new Response(
        JSON.stringify({ message: '削除対象のアイテムはありません', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // 完全削除
    const ids = itemsToDelete.map(item => item.id)
    const { error: deleteError } = await supabaseClient
      .from('wishlist')
      .delete()
      .in('id', ids)

    if (deleteError) {
      throw deleteError
    }

    return new Response(
      JSON.stringify({ 
        message: '自動削除が完了しました', 
        count: ids.length,
        deletedIds: ids 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

