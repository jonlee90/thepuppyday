# Task 0066: Create Deployment Checklist

**Phase**: 13 - Documentation and Deployment
**Task ID**: 13.3
**Status**: Pending

## Description

Create a comprehensive deployment checklist that covers pre-deployment preparation, deployment steps, post-deployment verification, and rollback procedures for the Google Calendar integration feature.

## Requirements

- Create `docs/deploy/calendar-integration-checklist.md`
- Document pre-deployment requirements
- Document deployment steps with feature flags
- Document post-deployment verification
- Include rollback instructions
- Include monitoring and alerting setup
- Provide success criteria

## Acceptance Criteria

- [ ] Deployment checklist created
- [ ] Pre-deployment section complete
- [ ] Deployment steps documented
- [ ] Post-deployment verification complete
- [ ] Rollback procedure documented
- [ ] Monitoring setup included
- [ ] Success criteria defined
- [ ] Risk mitigation strategies included

## Related Requirements

- Req 30: Documentation requirements
- General deployment best practices

## Deployment Checklist

Create comprehensive deployment documentation:

```markdown
# Google Calendar Integration - Deployment Checklist

## Overview

This checklist ensures a safe, successful deployment of the Google Calendar integration feature. Follow each section in order and check off items as completed.

**Deployment Strategy**: Phased rollout with feature flag control

**Estimated Time**: 2-3 hours (including verification)

---

## Pre-Deployment Checklist

### 1. Code Quality ✅

- [ ] All unit tests passing (`npm run test`)
- [ ] All integration tests passing (`npm run test:integration`)
- [ ] All E2E tests passing (`npm run test:e2e`)
- [ ] Code coverage >= 80%
- [ ] ESLint passing with no warnings (`npm run lint`)
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] Code reviewed and approved
- [ ] Security audit completed

### 2. Database ✅

- [ ] Database migration file created and tested
  - Location: `supabase/migrations/YYYYMMDD_calendar_integration.sql`
  - Tables: `calendar_connections`, `calendar_event_mapping`, `calendar_sync_log`, `calendar_sync_retry_queue`
  - Indexes verified
  - RLS policies created
- [ ] Migration tested on staging database
- [ ] Rollback migration prepared
- [ ] Database backup created
- [ ] Migration impact assessed (downtime required?)

### 3. Environment Variables ✅

- [ ] Google OAuth credentials created in Google Cloud Console
- [ ] `GOOGLE_CLIENT_ID` configured
- [ ] `GOOGLE_CLIENT_SECRET` configured
- [ ] `CALENDAR_TOKEN_ENCRYPTION_KEY` generated (32 bytes)
- [ ] `NEXT_PUBLIC_APP_URL` configured
- [ ] All variables set in production environment
- [ ] Variables validated with check script (`npm run check-env`)
- [ ] Backup of old environment variables saved

### 4. Google Cloud Setup ✅

- [ ] Google Cloud project created
- [ ] Google Calendar API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth client created with correct redirect URIs
- [ ] API quotas reviewed and sufficient
- [ ] Service account created (if needed)
- [ ] Billing configured and alerts set

### 5. External Dependencies ✅

- [ ] Google Calendar API accessible from production
- [ ] Network egress rules allow connections to Google APIs
- [ ] Firewall rules allow webhook callbacks (HTTPS)
- [ ] SSL/TLS certificates valid
- [ ] Webhook endpoint publicly accessible

### 6. Documentation ✅

- [ ] Architecture documentation updated
- [ ] User-facing help documentation complete
- [ ] Environment variable documentation complete
- [ ] Deployment checklist reviewed (this document)
- [ ] Runbook created for common issues
- [ ] On-call team briefed

### 7. Feature Flag ✅

- [ ] Feature flag created: `calendar_integration_enabled`
- [ ] Flag set to `false` initially
- [ ] Flag controls visibility of:
  - Calendar settings UI
  - Import button
  - Sync status badges
  - Auto-sync triggers
- [ ] Flag tested in staging

---

## Deployment Steps

### Phase 1: Deploy Code (Feature Flag OFF)

**Timing**: Off-hours (low traffic)

1. **Deploy Application** ⏱️ 15-20 minutes
   ```bash
   # Verify current version
   git log -1 --oneline

   # Deploy to production
   vercel deploy --prod
   # OR your deployment command

   # Wait for deployment to complete
   # Verify deployment successful
   ```

2. **Run Database Migration** ⏱️ 5-10 minutes
   ```bash
   # Connect to production database
   psql $DATABASE_URL

   # Run migration
   \i supabase/migrations/YYYYMMDD_calendar_integration.sql

   # Verify tables created
   \dt calendar_*

   # Verify indexes created
   \di calendar_*

   # Exit psql
   \q
   ```

3. **Smoke Test (Feature Flag OFF)** ⏱️ 10 minutes
   - [ ] App loads successfully
   - [ ] No errors in browser console
   - [ ] No errors in server logs
   - [ ] Existing features work normally
   - [ ] Database connection healthy
   - [ ] No calendar UI visible yet (flag still OFF)

**If smoke test fails**:
- Roll back deployment immediately (see Rollback section)
- Investigate errors
- Fix and redeploy

### Phase 2: Enable Feature Flag (Limited Rollout)

**Timing**: After smoke test passes

1. **Enable for Admin Only** ⏱️ 5 minutes
   ```sql
   -- Enable feature flag for specific admin user
   INSERT INTO feature_flags (flag_name, user_id, enabled)
   VALUES ('calendar_integration_enabled', 'admin-user-id', true);
   ```

2. **Admin Testing** ⏱️ 30 minutes
   - [ ] Log in as admin
   - [ ] Navigate to Settings → Calendar Integration
   - [ ] Connect Google Calendar
   - [ ] Verify OAuth flow works
   - [ ] Verify connection successful
   - [ ] Configure sync settings
   - [ ] Create test appointment
   - [ ] Verify auto-sync works
   - [ ] Check Google Calendar for event
   - [ ] Test import wizard
   - [ ] Import test event
   - [ ] Verify appointment created
   - [ ] Test manual sync
   - [ ] Test disconnect flow

**If admin testing fails**:
- Disable feature flag
- Investigate and fix issues
- Repeat admin testing

### Phase 3: Full Rollout

**Timing**: After successful admin testing (2-4 hours)

1. **Enable for All Admins** ⏱️ 2 minutes
   ```sql
   -- Enable feature flag globally
   UPDATE settings
   SET value = jsonb_set(value, '{calendar_integration_enabled}', 'true')
   WHERE key = 'feature_flags';
   ```

2. **Monitor Deployment** ⏱️ 1-2 hours
   - [ ] Monitor error logs for calendar-related errors
   - [ ] Monitor API quota usage
   - [ ] Monitor database performance
   - [ ] Monitor sync success rate
   - [ ] Check webhook registration success
   - [ ] Verify no performance degradation

---

## Post-Deployment Verification

### 1. Health Checks ✅

- [ ] All API endpoints responding (200 OK)
  - `/api/admin/calendar/connection`
  - `/api/admin/calendar/settings`
  - `/api/admin/calendar/sync/status`
- [ ] Database queries performant (<100ms)
- [ ] No error spikes in logs
- [ ] Memory usage normal
- [ ] CPU usage normal

### 2. Feature Verification ✅

- [ ] OAuth connection works
- [ ] Auto-sync creates events
- [ ] Manual sync works
- [ ] Import wizard completes successfully
- [ ] Webhook notifications received
- [ ] Sync status displays correctly
- [ ] Error recovery works

### 3. Performance Metrics ✅

- [ ] API response time < 500ms (p95)
- [ ] Sync operation time < 3s per appointment
- [ ] Import wizard < 10s for 10 events
- [ ] Database query time < 100ms
- [ ] No memory leaks detected

### 4. Security Verification ✅

- [ ] Tokens encrypted in database
- [ ] RLS policies enforced
- [ ] Admin-only access verified
- [ ] Webhook authentication working
- [ ] No sensitive data in logs

---

## Monitoring & Alerts

### 1. Set Up Dashboards 📊

Create monitoring dashboard with:
- Active connections count
- Successful syncs (last 24h)
- Failed syncs (last 24h)
- API quota usage
- Webhook registration status
- Error rates

### 2. Configure Alerts 🔔

Set up alerts for:

| Metric | Threshold | Action |
|--------|-----------|--------|
| Sync failure rate | >10% | Notify on-call |
| API quota usage | >80% | Notify admin |
| Webhook expiry | <24h | Auto-renew |
| Connection errors | >5/hour | Notify on-call |
| Database errors | Any | Page on-call |

### 3. Log Aggregation 📝

Ensure logs captured:
- Sync operations (success/failure)
- OAuth events
- Import operations
- Webhook notifications
- Error stack traces

---

## Rollback Procedure

### When to Rollback

Roll back if:
- Critical bugs discovered
- Data corruption detected
- Performance severely degraded
- Security vulnerability found
- User-impacting errors >5%

### Rollback Steps

**Option A: Feature Flag Rollback** (Preferred)

Fastest rollback - no redeployment needed:

```sql
-- Disable feature flag
UPDATE settings
SET value = jsonb_set(value, '{calendar_integration_enabled}', 'false')
WHERE key = 'feature_flags';
```

This immediately hides all calendar UI and stops auto-sync.

**Option B: Full Code Rollback**

If feature flag insufficient:

```bash
# Revert to previous deployment
vercel rollback
# OR redeploy previous Git commit
git revert HEAD
git push origin main
```

**Option C: Database Rollback**

If database issues:

```bash
# Run rollback migration
psql $DATABASE_URL
\i supabase/migrations/YYYYMMDD_calendar_integration_rollback.sql
```

### Post-Rollback

- [ ] Verify rollback successful
- [ ] Check error logs cleared
- [ ] Notify stakeholders
- [ ] Create incident report
- [ ] Schedule post-mortem
- [ ] Plan fix and redeployment

---

## Success Criteria

Deployment considered successful when:

✅ All pre-deployment checks passed
✅ Code deployed without errors
✅ Database migration completed
✅ Feature flag rollout successful
✅ All post-deployment verifications passed
✅ No critical errors in first 24 hours
✅ Sync success rate >95%
✅ No performance degradation
✅ User feedback positive

---

## Risk Mitigation

### High-Risk Areas

1. **OAuth Token Storage**
   - Risk: Token encryption failure
   - Mitigation: Comprehensive encryption tests, manual verification

2. **Auto-Sync Performance**
   - Risk: Database overload from frequent syncs
   - Mitigation: Rate limiting, batch processing, monitoring

3. **Webhook Reliability**
   - Risk: Missed notifications
   - Mitigation: Webhook renewal automation, fallback polling

4. **API Quota Limits**
   - Risk: Hitting Google API quotas
   - Mitigation: Quota monitoring, auto-throttling, alerts

### Contingency Plans

- Feature flag allows instant disable
- Database rollback script ready
- Previous deployment snapshot saved
- Support team briefed on common issues
- On-call engineer assigned

---

## Post-Deployment Tasks

### Day 1
- [ ] Monitor dashboards continuously
- [ ] Review error logs every 2 hours
- [ ] Check sync success rates
- [ ] Verify webhook renewals working
- [ ] Respond to user feedback

### Week 1
- [ ] Review all error logs
- [ ] Analyze performance metrics
- [ ] Gather user feedback
- [ ] Create known issues list
- [ ] Plan minor improvements

### Week 2
- [ ] Conduct post-mortem
- [ ] Document lessons learned
- [ ] Update runbook with new issues
- [ ] Plan next iteration
- [ ] Archive deployment artifacts

---

## Emergency Contacts

- **On-Call Engineer**: [Name] - [Phone]
- **Database Admin**: [Name] - [Phone]
- **Product Owner**: [Name] - [Phone]
- **Google Cloud Support**: [Support Plan]

## Additional Resources

- Architecture Documentation: `docs/architecture/ARCHITECTURE.md`
- User Guide: `docs/help/calendar-integration.md`
- Environment Setup: `docs/setup/google-calendar-setup.md`
- Runbook: `docs/runbook/calendar-integration.md`
```

## Testing Checklist

- [ ] Deployment checklist created
- [ ] All sections complete
- [ ] Steps tested in staging
- [ ] Rollback procedure tested
- [ ] Emergency contacts updated
- [ ] Success criteria validated
- [ ] Risk mitigation reviewed
