| table_name                    | column_name              | data_type                | is_nullable | column_default           |
| ----------------------------- | ------------------------ | ------------------------ | ----------- | ------------------------ |
| addons                        | id                       | uuid                     | NO          | uuid_generate_v4()       |
| addons                        | name                     | text                     | NO          | null                     |
| addons                        | description              | text                     | YES         | null                     |
| addons                        | price                    | numeric                  | NO          | null                     |
| addons                        | upsell_prompt            | text                     | YES         | null                     |
| addons                        | upsell_breeds            | ARRAY                    | YES         | '{}'::uuid[]             |
| addons                        | is_active                | boolean                  | YES         | true                     |
| addons                        | display_order            | integer                  | YES         | 0                        |
| addons                        | created_at               | timestamp with time zone | YES         | now()                    |
| analytics_cache               | id                       | uuid                     | NO          | uuid_generate_v4()       |
| analytics_cache               | metric_key               | text                     | NO          | null                     |
| analytics_cache               | date_range_start         | date                     | NO          | null                     |
| analytics_cache               | date_range_end           | date                     | NO          | null                     |
| analytics_cache               | cached_value             | jsonb                    | NO          | null                     |
| analytics_cache               | expires_at               | timestamp with time zone | NO          | null                     |
| analytics_cache               | created_at               | timestamp with time zone | YES         | now()                    |
| appointment_addons            | id                       | uuid                     | NO          | uuid_generate_v4()       |
| appointment_addons            | appointment_id           | uuid                     | NO          | null                     |
| appointment_addons            | addon_id                 | uuid                     | NO          | null                     |
| appointment_addons            | price                    | numeric                  | NO          | null                     |
| appointments                  | id                       | uuid                     | NO          | uuid_generate_v4()       |
| appointments                  | customer_id              | uuid                     | NO          | null                     |
| appointments                  | pet_id                   | uuid                     | NO          | null                     |
| appointments                  | service_id               | uuid                     | NO          | null                     |
| appointments                  | groomer_id               | uuid                     | YES         | null                     |
| appointments                  | scheduled_at             | timestamp with time zone | NO          | null                     |
| appointments                  | duration_minutes         | integer                  | NO          | null                     |
| appointments                  | status                   | text                     | YES         | 'pending'::text          |
| appointments                  | payment_status           | text                     | YES         | 'pending'::text          |
| appointments                  | total_price              | numeric                  | NO          | null                     |
| appointments                  | notes                    | text                     | YES         | null                     |
| appointments                  | created_at               | timestamp with time zone | YES         | now()                    |
| appointments                  | updated_at               | timestamp with time zone | YES         | now()                    |
| appointments                  | booking_reference        | text                     | YES         | null                     |
| appointments                  | admin_notes              | text                     | YES         | null                     |
| appointments                  | cancellation_reason      | text                     | YES         | null                     |
| appointments                  | creation_method          | text                     | NO          | 'customer_booking'::text |
| appointments                  | created_by_admin_id      | uuid                     | YES         | null                     |
| breeds                        | id                       | uuid                     | NO          | uuid_generate_v4()       |
| breeds                        | name                     | text                     | NO          | null                     |
| breeds                        | grooming_frequency_weeks | integer                  | YES         | 6                        |
| breeds                        | reminder_message         | text                     | YES         | null                     |
| breeds                        | created_at               | timestamp with time zone | YES         | now()                    |
| calendar_connections          | id                       | uuid                     | NO          | uuid_generate_v4()       |
| calendar_connections          | admin_id                 | uuid                     | NO          | null                     |
| calendar_connections          | access_token             | text                     | YES         | null                     |
| calendar_connections          | refresh_token            | text                     | YES         | null                     |
| calendar_connections          | token_expiry             | timestamp with time zone | YES         | null                     |
| calendar_connections          | calendar_id              | text                     | NO          | 'primary'::text          |
| calendar_connections          | calendar_email           | text                     | NO          | null                     |
| calendar_connections          | webhook_channel_id       | text                     | YES         | null                     |
| calendar_connections          | webhook_resource_id      | text                     | YES         | null                     |
| calendar_connections          | webhook_expiration       | timestamp with time zone | YES         | null                     |
| calendar_connections          | is_active                | boolean                  | NO          | true                     |
| calendar_connections          | last_sync_at             | timestamp with time zone | YES         | null                     |
| calendar_connections          | created_at               | timestamp with time zone | NO          | now()                    |
| calendar_connections          | updated_at               | timestamp with time zone | NO          | now()                    |
| calendar_connections          | provider                 | text                     | NO          | 'google'::text           |
| calendar_connections          | service_account_email    | text                     | YES         | null                     |
| calendar_connections          | calendar_name            | text                     | YES         | null                     |
| calendar_connections          | credentials              | text                     | YES         | null                     |
| calendar_event_mapping        | id                       | uuid                     | NO          | uuid_generate_v4()       |
| calendar_event_mapping        | appointment_id           | uuid                     | NO          | null                     |
| calendar_event_mapping        | connection_id            | uuid                     | NO          | null                     |
| calendar_event_mapping        | google_event_id          | text                     | NO          | null                     |
| calendar_event_mapping        | last_synced_at           | timestamp with time zone | NO          | now()                    |
| calendar_event_mapping        | sync_direction           | text                     | NO          | null                     |
| calendar_event_mapping        | created_at               | timestamp with time zone | NO          | now()                    |
| calendar_event_mapping        | updated_at               | timestamp with time zone | NO          | now()                    |
| calendar_sync_log             | id                       | uuid                     | NO          | uuid_generate_v4()       |
| calendar_sync_log             | connection_id            | uuid                     | YES         | null                     |
| calendar_sync_log             | sync_type                | text                     | NO          | null                     |
| calendar_sync_log             | operation                | text                     | NO          | null                     |
| calendar_sync_log             | appointment_id           | uuid                     | YES         | null                     |
| calendar_sync_log             | google_event_id          | text                     | YES         | null                     |
| calendar_sync_log             | status                   | text                     | NO          | null                     |
| calendar_sync_log             | error_message            | text                     | YES         | null                     |
| calendar_sync_log             | error_code               | text                     | YES         | null                     |
| calendar_sync_log             | details                  | jsonb                    | YES         | null                     |
| calendar_sync_log             | duration_ms              | integer                  | YES         | null                     |
| calendar_sync_log             | created_at               | timestamp with time zone | NO          | now()                    |
| campaign_sends                | id                       | uuid                     | NO          | uuid_generate_v4()       |
| campaign_sends                | campaign_id              | uuid                     | YES         | null                     |
| campaign_sends                | customer_id              | uuid                     | NO          | null                     |
| campaign_sends                | notification_log_id      | uuid                     | YES         | null                     |
| campaign_sends                | variant                  | text                     | YES         | null                     |
| campaign_sends                | sent_at                  | timestamp with time zone | YES         | null                     |
| campaign_sends                | delivered_at             | timestamp with time zone | YES         | null                     |
| campaign_sends                | clicked_at               | timestamp with time zone | YES         | null                     |
| campaign_sends                | booking_id               | uuid                     | YES         | null                     |
| campaign_sends                | created_at               | timestamp with time zone | YES         | now()                    |
| campaign_sends                | channel                  | text                     | YES         | null                     |
| campaign_sends                | recipient                | text                     | YES         | null                     |
| campaign_sends                | status                   | text                     | YES         | 'pending'::text          |
| campaign_sends                | opened_at                | timestamp with time zone | YES         | null                     |
| campaign_sends                | error_message            | text                     | YES         | null                     |
| campaign_sends                | pet_id                   | uuid                     | YES         | null                     |
| campaign_sends                | tracking_id              | uuid                     | YES         | null                     |
| campaign_sends                | attempt_count            | integer                  | YES         | 1                        |
| customer_flags                | id                       | uuid                     | NO          | uuid_generate_v4()       |
| customer_flags                | customer_id              | uuid                     | NO          | null                     |
| customer_flags                | is_active                | boolean                  | YES         | true                     |
| customer_flags                | created_at               | timestamp with time zone | YES         | now()                    |
| customer_flags                | flag_type                | USER-DEFINED             | NO          | null                     |
| customer_flags                | description              | text                     | NO          | null                     |
| customer_flags                | color                    | USER-DEFINED             | NO          | null                     |
| customer_flags                | created_by               | uuid                     | YES         | null                     |
| customer_loyalty              | id                       | uuid                     | NO          | uuid_generate_v4()       |
| customer_loyalty              | customer_id              | uuid                     | NO          | null                     |
| customer_loyalty              | current_punches          | integer                  | NO          | 0                        |
| customer_loyalty              | threshold_override       | integer                  | YES         | null                     |
| customer_loyalty              | total_visits             | integer                  | NO          | 0                        |
| customer_loyalty              | free_washes_earned       | integer                  | NO          | 0                        |
| customer_loyalty              | free_washes_redeemed     | integer                  | NO          | 0                        |
| customer_loyalty              | created_at               | timestamp with time zone | YES         | now()                    |
| customer_loyalty              | updated_at               | timestamp with time zone | YES         | now()                    |
| customer_memberships          | id                       | uuid                     | NO          | uuid_generate_v4()       |
| customer_memberships          | customer_id              | uuid                     | NO          | null                     |
| customer_memberships          | membership_id            | uuid                     | NO          | null                     |
| customer_memberships          | status                   | text                     | YES         | 'active'::text           |
| customer_memberships          | stripe_subscription_id   | text                     | YES         | null                     |
| customer_memberships          | current_period_end       | timestamp with time zone | YES         | null                     |
| customer_memberships          | created_at               | timestamp with time zone | YES         | now()                    |
| customer_memberships          | grooms_remaining         | integer                  | YES         | 0                        |
| customer_memberships          | grooms_used              | integer                  | YES         | 0                        |
| gallery_images                | id                       | uuid                     | NO          | uuid_generate_v4()       |
| gallery_images                | image_url                | text                     | NO          | null                     |
| gallery_images                | dog_name                 | text                     | YES         | null                     |
| gallery_images                | breed                    | text                     | YES         | null                     |
| gallery_images                | caption                  | text                     | YES         | null                     |
| gallery_images                | tags                     | ARRAY                    | YES         | '{}'::text[]             |
| gallery_images                | is_before_after          | boolean                  | YES         | false                    |
| gallery_images                | before_image_url         | text                     | YES         | null                     |
| gallery_images                | display_order            | integer                  | YES         | 0                        |
| gallery_images                | is_published             | boolean                  | YES         | true                     |
| gallery_images                | created_at               | timestamp with time zone | YES         | now()                    |
| groomer_commission_earnings   | groomer_id               | uuid                     | YES         | null                     |
| groomer_commission_earnings   | groomer_name             | text                     | YES         | null                     |
| groomer_commission_earnings   | rate_type                | text                     | YES         | null                     |
| groomer_commission_earnings   | rate                     | numeric                  | YES         | null                     |
| groomer_commission_earnings   | include_addons           | boolean                  | YES         | null                     |
| groomer_commission_earnings   | total_appointments       | bigint                   | YES         | null                     |
| groomer_commission_earnings   | total_earnings           | numeric                  | YES         | null                     |
| inactive_customer_profiles    | id                       | uuid                     | YES         | null                     |
| inactive_customer_profiles    | email                    | text                     | YES         | null                     |
| inactive_customer_profiles    | first_name               | text                     | YES         | null                     |
| inactive_customer_profiles    | last_name                | text                     | YES         | null                     |
| inactive_customer_profiles    | phone                    | text                     | YES         | null                     |
| inactive_customer_profiles    | created_at               | timestamp with time zone | YES         | null                     |
| inactive_customer_profiles    | created_by_admin         | boolean                  | YES         | null                     |
| loyalty_points                | id                       | uuid                     | NO          | uuid_generate_v4()       |
| loyalty_points                | customer_id              | uuid                     | NO          | null                     |
| loyalty_points                | points_balance           | integer                  | YES         | 0                        |
| loyalty_points                | lifetime_points          | integer                  | YES         | 0                        |
| loyalty_punches               | id                       | uuid                     | NO          | uuid_generate_v4()       |
| loyalty_punches               | customer_loyalty_id      | uuid                     | NO          | null                     |
| loyalty_punches               | appointment_id           | uuid                     | NO          | null                     |
| loyalty_punches               | cycle_number             | integer                  | NO          | 1                        |
| loyalty_punches               | punch_number             | integer                  | NO          | null                     |
| loyalty_punches               | earned_at                | timestamp with time zone | NO          | now()                    |
| loyalty_punches               | created_at               | timestamp with time zone | YES         | now()                    |
| loyalty_redemptions           | id                       | uuid                     | NO          | uuid_generate_v4()       |
| loyalty_redemptions           | customer_loyalty_id      | uuid                     | NO          | null                     |
| loyalty_redemptions           | appointment_id           | uuid                     | YES         | null                     |
| loyalty_redemptions           | cycle_number             | integer                  | NO          | null                     |
| loyalty_redemptions           | redeemed_at              | timestamp with time zone | YES         | null                     |
| loyalty_redemptions           | status                   | text                     | NO          | 'pending'::text          |
| loyalty_redemptions           | created_at               | timestamp with time zone | YES         | now()                    |
| loyalty_settings              | id                       | uuid                     | NO          | uuid_generate_v4()       |
| loyalty_settings              | default_threshold        | integer                  | NO          | 9                        |
| loyalty_settings              | is_enabled               | boolean                  | NO          | true                     |
| loyalty_settings              | updated_at               | timestamp with time zone | YES         | now()                    |
| loyalty_transactions          | id                       | uuid                     | NO          | uuid_generate_v4()       |
| loyalty_transactions          | customer_id              | uuid                     | NO          | null                     |
| loyalty_transactions          | points                   | integer                  | NO          | null                     |
| loyalty_transactions          | type                     | text                     | YES         | null                     |
| loyalty_transactions          | reference_id             | uuid                     | YES         | null                     |
| loyalty_transactions          | reference_type           | text                     | YES         | null                     |
| loyalty_transactions          | notes                    | text                     | YES         | null                     |
| loyalty_transactions          | created_at               | timestamp with time zone | YES         | now()                    |
| marketing_campaigns           | id                       | uuid                     | NO          | uuid_generate_v4()       |
| marketing_campaigns           | name                     | text                     | NO          | null                     |
| marketing_campaigns           | type                     | text                     | NO          | null                     |
| marketing_campaigns           | status                   | text                     | YES         | 'draft'::text            |
| marketing_campaigns           | segment_criteria         | jsonb                    | YES         | '{}'::jsonb              |
| marketing_campaigns           | message_content          | jsonb                    | NO          | null                     |
| marketing_campaigns           | ab_test_config           | jsonb                    | YES         | null                     |
| marketing_campaigns           | scheduled_at             | timestamp with time zone | YES         | null                     |
| marketing_campaigns           | created_by               | uuid                     | YES         | null                     |
| marketing_campaigns           | created_at               | timestamp with time zone | YES         | now()                    |
| marketing_campaigns           | updated_at               | timestamp with time zone | YES         | now()                    |
| marketing_campaigns           | description              | text                     | YES         | null                     |
| marketing_campaigns           | channel                  | text                     | YES         | null                     |
| marketing_campaigns           | sent_at                  | timestamp with time zone | YES         | null                     |
| marketing_unsubscribes        | id                       | uuid                     | NO          | uuid_generate_v4()       |
| marketing_unsubscribes        | customer_id              | uuid                     | YES         | null                     |
| marketing_unsubscribes        | email                    | text                     | YES         | null                     |
| marketing_unsubscribes        | phone                    | text                     | YES         | null                     |
| marketing_unsubscribes        | unsubscribed_from        | ARRAY                    | YES         | '{}'::text[]             |
| marketing_unsubscribes        | reason                   | text                     | YES         | null                     |
| marketing_unsubscribes        | created_at               | timestamp with time zone | YES         | now()                    |
| memberships                   | id                       | uuid                     | NO          | uuid_generate_v4()       |
| memberships                   | name                     | text                     | NO          | null                     |
| memberships                   | description              | text                     | YES         | null                     |
| memberships                   | price                    | numeric                  | NO          | null                     |
| memberships                   | billing_frequency        | text                     | YES         | null                     |
| memberships                   | benefits                 | jsonb                    | YES         | '[]'::jsonb              |
| memberships                   | is_active                | boolean                  | YES         | true                     |
| memberships                   | created_at               | timestamp with time zone | YES         | now()                    |
| memberships                   | grooms_per_period        | integer                  | YES         | 4                        |
| notification_settings         | notification_type        | text                     | NO          | null                     |
| notification_settings         | email_enabled            | boolean                  | YES         | true                     |
| notification_settings         | sms_enabled              | boolean                  | YES         | true                     |
| notification_settings         | email_template_id        | uuid                     | YES         | null                     |
| notification_settings         | sms_template_id          | uuid                     | YES         | null                     |
| notification_settings         | schedule_cron            | text                     | YES         | null                     |
| notification_settings         | schedule_enabled         | boolean                  | YES         | false                    |
| notification_settings         | max_retries              | integer                  | NO          | 2                        |
| notification_settings         | retry_delays_seconds     | ARRAY                    | NO          | ARRAY[30, 300]           |
| notification_settings         | last_sent_at             | timestamp with time zone | YES         | null                     |
| notification_settings         | total_sent_count         | bigint                   | YES         | 0                        |
| notification_settings         | total_failed_count       | bigint                   | YES         | 0                        |
| notification_settings         | created_at               | timestamp with time zone | YES         | now()                    |
| notification_settings         | updated_at               | timestamp with time zone | YES         | now()                    |
| notification_template_history | id                       | uuid                     | NO          | uuid_generate_v4()       |
| notification_template_history | template_id              | uuid                     | NO          | null                     |
| notification_template_history | version                  | integer                  | NO          | null                     |
| notification_template_history | name                     | text                     | NO          | null                     |
| notification_template_history | description              | text                     | YES         | null                     |
| notification_template_history | type                     | text                     | NO          | null                     |
| notification_template_history | trigger_event            | text                     | NO          | null                     |
| notification_template_history | channel                  | text                     | NO          | null                     |
| notification_template_history | subject_template         | text                     | YES         | null                     |
| notification_template_history | html_template            | text                     | YES         | null                     |
| notification_template_history | text_template            | text                     | NO          | null                     |
| notification_template_history | variables                | jsonb                    | YES         | null                     |
| notification_template_history | changed_by               | uuid                     | YES         | null                     |
| notification_template_history | change_reason            | text                     | YES         | null                     |
| notification_template_history | created_at               | timestamp with time zone | YES         | now()                    |
| notification_template_stats   | id                       | uuid                     | YES         | null                     |
| notification_template_stats   | name                     | text                     | YES         | null                     |
| notification_template_stats   | type                     | text                     | YES         | null                     |
| notification_template_stats   | channel                  | text                     | YES         | null                     |
| notification_template_stats   | is_active                | boolean                  | YES         | null                     |
| notification_template_stats   | version                  | integer                  | YES         | null                     |
| notification_template_stats   | total_sent               | bigint                   | YES         | null                     |
| notification_template_stats   | successful_sent          | bigint                   | YES         | null                     |
| notification_template_stats   | failed_sent              | bigint                   | YES         | null                     |
| notification_template_stats   | last_used_at             | timestamp with time zone | YES         | null                     |
| notification_template_stats   | version_count            | bigint                   | YES         | null                     |
| notification_templates        | id                       | uuid                     | NO          | uuid_generate_v4()       |
| notification_templates        | name                     | text                     | NO          | null                     |
| notification_templates        | description              | text                     | YES         | null                     |
| notification_templates        | type                     | text                     | NO          | null                     |
| notification_templates        | trigger_event            | text                     | NO          | null                     |
| notification_templates        | channel                  | text                     | NO          | null                     |
| notification_templates        | subject_template         | text                     | YES         | null                     |
| notification_templates        | html_template            | text                     | YES         | null                     |
| notification_templates        | text_template            | text                     | NO          | null                     |
| notification_templates        | variables                | jsonb                    | YES         | '[]'::jsonb              |
| notification_templates        | is_active                | boolean                  | YES         | true                     |
| notification_templates        | version                  | integer                  | YES         | 1                        |
| notification_templates        | created_by               | uuid                     | YES         | null                     |
| notification_templates        | updated_by               | uuid                     | YES         | null                     |
| notification_templates        | created_at               | timestamp with time zone | YES         | now()                    |
| notification_templates        | updated_at               | timestamp with time zone | YES         | now()                    |
| notifications_log             | id                       | uuid                     | NO          | uuid_generate_v4()       |
| notifications_log             | customer_id              | uuid                     | YES         | null                     |
| notifications_log             | type                     | text                     | NO          | null                     |
| notifications_log             | channel                  | text                     | YES         | null                     |
| notifications_log             | recipient                | text                     | NO          | null                     |
| notifications_log             | subject                  | text                     | YES         | null                     |
| notifications_log             | content                  | text                     | YES         | null                     |
| notifications_log             | status                   | text                     | YES         | 'pending'::text          |
| notifications_log             | error_message            | text                     | YES         | null                     |
| notifications_log             | sent_at                  | timestamp with time zone | YES         | null                     |
| notifications_log             | created_at               | timestamp with time zone | YES         | now()                    |
| notifications_log             | campaign_id              | uuid                     | YES         | null                     |
| notifications_log             | campaign_send_id         | uuid                     | YES         | null                     |
| notifications_log             | tracking_id              | uuid                     | YES         | uuid_generate_v4()       |
| notifications_log             | clicked_at               | timestamp with time zone | YES         | null                     |
| notifications_log             | delivered_at             | timestamp with time zone | YES         | null                     |
| notifications_log             | cost_cents               | integer                  | YES         | null                     |
| notifications_log             | template_id              | uuid                     | YES         | null                     |
| notifications_log             | template_data            | jsonb                    | YES         | null                     |
| notifications_log             | retry_count              | integer                  | YES         | 0                        |
| notifications_log             | retry_after              | timestamp with time zone | YES         | null                     |
| notifications_log             | is_test                  | boolean                  | YES         | false                    |
| notifications_log             | message_id               | text                     | YES         | null                     |
| payments                      | id                       | uuid                     | NO          | uuid_generate_v4()       |
| payments                      | appointment_id           | uuid                     | YES         | null                     |
| payments                      | customer_id              | uuid                     | NO          | null                     |
| payments                      | stripe_payment_intent_id | text                     | YES         | null                     |
| payments                      | amount                   | numeric                  | NO          | null                     |
| payments                      | tip_amount               | numeric                  | YES         | 0                        |
| payments                      | status                   | text                     | YES         | 'pending'::text          |
| payments                      | payment_method           | text                     | YES         | null                     |
| payments                      | created_at               | timestamp with time zone | YES         | now()                    |
| pets                          | id                       | uuid                     | NO          | uuid_generate_v4()       |
| pets                          | owner_id                 | uuid                     | NO          | null                     |
| pets                          | name                     | text                     | NO          | null                     |
| pets                          | breed_id                 | uuid                     | YES         | null                     |
| pets                          | breed_custom             | text                     | YES         | null                     |
| pets                          | size                     | text                     | NO          | null                     |
| pets                          | weight                   | numeric                  | YES         | null                     |
| pets                          | birth_date               | date                     | YES         | null                     |
| pets                          | notes                    | text                     | YES         | null                     |
| pets                          | medical_info             | text                     | YES         | null                     |
| pets                          | photo_url                | text                     | YES         | null                     |
| pets                          | is_active                | boolean                  | YES         | true                     |
| pets                          | created_at               | timestamp with time zone | YES         | now()                    |
| pets                          | updated_at               | timestamp with time zone | YES         | now()                    |
| promo_banners                 | id                       | uuid                     | NO          | uuid_generate_v4()       |
| promo_banners                 | image_url                | text                     | NO          | null                     |
| promo_banners                 | alt_text                 | text                     | YES         | null                     |
| promo_banners                 | click_url                | text                     | YES         | null                     |
| promo_banners                 | start_date               | date                     | YES         | null                     |
| promo_banners                 | end_date                 | date                     | YES         | null                     |
| promo_banners                 | is_active                | boolean                  | YES         | true                     |
| promo_banners                 | display_order            | integer                  | YES         | 0                        |
| promo_banners                 | click_count              | integer                  | YES         | 0                        |
| promo_banners                 | created_at               | timestamp with time zone | YES         | now()                    |
| promo_banners                 | impression_count         | bigint                   | NO          | 0                        |
| referral_codes                | id                       | uuid                     | NO          | uuid_generate_v4()       |
| referral_codes                | customer_id              | uuid                     | NO          | null                     |
| referral_codes                | code                     | text                     | NO          | null                     |
| referral_codes                | uses_count               | integer                  | NO          | 0                        |
| referral_codes                | max_uses                 | integer                  | YES         | null                     |
| referral_codes                | is_active                | boolean                  | NO          | true                     |
| referral_codes                | created_at               | timestamp with time zone | YES         | now()                    |
| referrals                     | id                       | uuid                     | NO          | uuid_generate_v4()       |
| referrals                     | referrer_id              | uuid                     | NO          | null                     |
| referrals                     | referee_id               | uuid                     | NO          | null                     |
| referrals                     | referral_code_id         | uuid                     | NO          | null                     |
| referrals                     | status                   | text                     | NO          | 'pending'::text          |
| referrals                     | referrer_bonus_awarded   | boolean                  | NO          | false                    |
| referrals                     | referee_bonus_awarded    | boolean                  | NO          | false                    |
| referrals                     | completed_at             | timestamp with time zone | YES         | null                     |
| referrals                     | created_at               | timestamp with time zone | YES         | now()                    |
| report_cards                  | id                       | uuid                     | NO          | uuid_generate_v4()       |
| report_cards                  | appointment_id           | uuid                     | NO          | null                     |
| report_cards                  | mood                     | text                     | YES         | null                     |
| report_cards                  | coat_condition           | text                     | YES         | null                     |
| report_cards                  | behavior                 | text                     | YES         | null                     |
| report_cards                  | health_observations      | ARRAY                    | YES         | '{}'::text[]             |
| report_cards                  | groomer_notes            | text                     | YES         | null                     |
| report_cards                  | before_photo_url         | text                     | YES         | null                     |
| report_cards                  | after_photo_url          | text                     | YES         | null                     |
| report_cards                  | rating                   | integer                  | YES         | null                     |
| report_cards                  | feedback                 | text                     | YES         | null                     |
| report_cards                  | created_at               | timestamp with time zone | YES         | now()                    |
| report_cards                  | groomer_id               | uuid                     | YES         | null                     |
| report_cards                  | view_count               | integer                  | YES         | 0                        |
| report_cards                  | last_viewed_at           | timestamp with time zone | YES         | null                     |
| report_cards                  | sent_at                  | timestamp with time zone | YES         | null                     |
| report_cards                  | expires_at               | timestamp with time zone | YES         | null                     |
| report_cards                  | dont_send                | boolean                  | YES         | false                    |
| report_cards                  | is_draft                 | boolean                  | YES         | true                     |
| report_cards                  | updated_at               | timestamp with time zone | YES         | now()                    |
| reviews                       | id                       | uuid                     | NO          | uuid_generate_v4()       |
| reviews                       | report_card_id           | uuid                     | NO          | null                     |
| reviews                       | user_id                  | uuid                     | NO          | null                     |
| reviews                       | appointment_id           | uuid                     | NO          | null                     |
| reviews                       | rating                   | integer                  | NO          | null                     |
| reviews                       | feedback                 | text                     | YES         | null                     |
| reviews                       | is_public                | boolean                  | YES         | false                    |
| reviews                       | created_at               | timestamp with time zone | YES         | now()                    |
| reviews                       | updated_at               | timestamp with time zone | YES         | now()                    |
| reviews                       | destination              | text                     | YES         | null                     |
| reviews                       | google_review_url        | text                     | YES         | null                     |
| reviews                       | responded_at             | timestamp with time zone | YES         | null                     |
| reviews                       | response_text            | text                     | YES         | null                     |
| service_prices                | id                       | uuid                     | NO          | uuid_generate_v4()       |
| service_prices                | service_id               | uuid                     | NO          | null                     |
| service_prices                | size                     | text                     | NO          | null                     |
| service_prices                | price                    | numeric                  | NO          | null                     |
| service_prices                | created_at               | timestamp with time zone | YES         | now()                    |
| service_prices                | updated_at               | timestamp with time zone | YES         | now()                    |
| services                      | id                       | uuid                     | NO          | uuid_generate_v4()       |
| services                      | name                     | text                     | NO          | null                     |
| services                      | description              | text                     | YES         | null                     |
| services                      | image_url                | text                     | YES         | null                     |
| services                      | duration_minutes         | integer                  | NO          | null                     |
| services                      | is_active                | boolean                  | YES         | true                     |
| services                      | display_order            | integer                  | YES         | 0                        |
| services                      | created_at               | timestamp with time zone | YES         | now()                    |
| services                      | updated_at               | timestamp with time zone | YES         | now()                    |
| settings                      | id                       | uuid                     | NO          | uuid_generate_v4()       |
| settings                      | key                      | text                     | NO          | null                     |
| settings                      | value                    | jsonb                    | NO          | null                     |
| settings                      | updated_at               | timestamp with time zone | YES         | now()                    |
| settings_audit_log            | id                       | uuid                     | NO          | uuid_generate_v4()       |
| settings_audit_log            | admin_id                 | uuid                     | YES         | null                     |
| settings_audit_log            | setting_type             | text                     | NO          | null                     |
| settings_audit_log            | setting_key              | text                     | NO          | null                     |
| settings_audit_log            | old_value                | jsonb                    | YES         | null                     |
| settings_audit_log            | new_value                | jsonb                    | YES         | null                     |
| settings_audit_log            | created_at               | timestamp with time zone | YES         | now()                    |
| site_content                  | id                       | uuid                     | NO          | uuid_generate_v4()       |
| site_content                  | section                  | text                     | NO          | null                     |
| site_content                  | content                  | jsonb                    | NO          | null                     |
| site_content                  | updated_at               | timestamp with time zone | YES         | now()                    |
| staff_commissions             | id                       | uuid                     | NO          | uuid_generate_v4()       |
| staff_commissions             | groomer_id               | uuid                     | NO          | null                     |
| staff_commissions             | rate_type                | text                     | NO          | null                     |
| staff_commissions             | rate                     | numeric                  | NO          | null                     |
| staff_commissions             | include_addons           | boolean                  | NO          | false                    |
| staff_commissions             | service_overrides        | jsonb                    | YES         | null                     |
| staff_commissions             | created_at               | timestamp with time zone | YES         | now()                    |
| staff_commissions             | updated_at               | timestamp with time zone | YES         | now()                    |
| users                         | id                       | uuid                     | NO          | uuid_generate_v4()       |
| users                         | email                    | text                     | NO          | null                     |
| users                         | phone                    | text                     | YES         | null                     |
| users                         | first_name               | text                     | NO          | null                     |
| users                         | last_name                | text                     | NO          | null                     |
| users                         | role                     | text                     | YES         | 'customer'::text         |
| users                         | avatar_url               | text                     | YES         | null                     |
| users                         | preferences              | jsonb                    | YES         | '{}'::jsonb              |
| users                         | created_at               | timestamp with time zone | YES         | now()                    |
| users                         | updated_at               | timestamp with time zone | YES         | now()                    |
| users                         | is_active                | boolean                  | NO          | true                     |
| users                         | created_by_admin         | boolean                  | NO          | false                    |
| users                         | activated_at             | timestamp with time zone | YES         | null                     |
| waitlist                      | id                       | uuid                     | NO          | uuid_generate_v4()       |
| waitlist                      | customer_id              | uuid                     | NO          | null                     |
| waitlist                      | pet_id                   | uuid                     | NO          | null                     |
| waitlist                      | service_id               | uuid                     | NO          | null                     |
| waitlist                      | requested_date           | date                     | NO          | null                     |
| waitlist                      | time_preference          | text                     | YES         | 'any'::text              |
| waitlist                      | status                   | text                     | YES         | 'active'::text           |
| waitlist                      | notified_at              | timestamp with time zone | YES         | null                     |
| waitlist                      | created_at               | timestamp with time zone | YES         | now()                    |
| waitlist                      | priority                 | integer                  | YES         | 0                        |
| waitlist                      | notes                    | text                     | YES         | null                     |
| waitlist                      | offer_expires_at         | timestamp with time zone | YES         | null                     |
| waitlist                      | updated_at               | timestamp with time zone | YES         | now()                    |
| waitlist_slot_offers          | id                       | uuid                     | NO          | uuid_generate_v4()       |
| waitlist_slot_offers          | slot_date                | date                     | NO          | null                     |
| waitlist_slot_offers          | slot_time                | time without time zone   | NO          | null                     |
| waitlist_slot_offers          | service_id               | uuid                     | NO          | null                     |
| waitlist_slot_offers          | status                   | text                     | YES         | 'pending'::text          |
| waitlist_slot_offers          | discount_percent         | integer                  | YES         | 0                        |
| waitlist_slot_offers          | response_window_hours    | integer                  | YES         | 2                        |
| waitlist_slot_offers          | expires_at               | timestamp with time zone | NO          | null                     |
| waitlist_slot_offers          | created_by               | uuid                     | YES         | null                     |
| waitlist_slot_offers          | created_at               | timestamp with time zone | YES         | now()                    |
| waitlist_slot_offers          | updated_at               | timestamp with time zone | YES         | now()                    |
| waitlist_slot_offers          | waitlist_entry_id        | uuid                     | YES         | null                     |
| waitlist_slot_offers          | offered_slot_start       | timestamp with time zone | YES         | null                     |
| waitlist_slot_offers          | offered_slot_end         | timestamp with time zone | YES         | null                     |
| waitlist_slot_offers          | accepted_at              | timestamp with time zone | YES         | null                     |
| waitlist_slot_offers          | cancelled_at             | timestamp with time zone | YES         | null                     |
| waitlist_slot_offers          | cancellation_reason      | text                     | YES         | null                     |