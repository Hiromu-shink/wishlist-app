# 自動削除 Edge Function

30日前に削除されたアイテムを自動的に完全削除するEdge Functionです。

## セットアップ

1. Supabase CLIでデプロイ:
```bash
supabase functions deploy auto-delete-trash
```

2. Supabase DashboardでCron Jobを設定:
   - Dashboard > Database > Cron Jobs
   - スケジュール: `0 0 * * *` (毎日0時)
   - SQL:
```sql
SELECT cron.schedule(
  'auto-delete-trash',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-delete-trash',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    )
  ) AS request_id;
  $$
);
```

## 手動実行

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-delete-trash \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

