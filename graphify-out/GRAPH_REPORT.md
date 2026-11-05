# Graph Report - salon-booking-saas  (2026-11-05)

## Corpus Check
- 256 files · ~71,522 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 25 file(s) not represented in the graph (top: (none) 14, .css 4, .example 2)

## Summary
- 1004 nodes · 1708 edges · 101 communities (all shown)
- Extraction: 93.5% EXTRACTED · 6.5% INFERRED · 0.0% AMBIGUOUS · INFERRED: 111 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `390eb36f`
- Source-aware freshness check (stale only if this command prints paths; documentation-only and graph-only commits do not count):

```sh
git diff --name-only 390eb36ff31091edc87bef1128c8879fb7ffd704 HEAD -- ':(glob)**/*.js' ':(glob)**/*.json' ':(glob)**/*.jsx' ':(glob)**/*.sql' ':(glob)**/*.tf' ':(glob)**/*.ts' ':(glob)**/*.tsx' ':(glob)**/*.yaml' ':(glob)**/*.yml' ':(exclude)graphify-out/**' ':(exclude)output/**'
```
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.jsx
- executor.js
- frontend/package.json
- values.yaml
- containers
- customer.service.js
- qatar
- spec
- supabase.js
- routes/index.js
- annotations
- server.js
- steps
- dependencies
- package.json
- queue.js
- services
- compilerOptions
- dependencies
- leadQualification.js
- app.js
- twilio.js
- salon-booking-demo/package.json
- loyaltyEngine.js
- appointmentsController.js
- tenantRateLimit.js
- utils/availability.js
- ref_mongoose
- analytics.js
- staff.js
- queueDashboard.js
- routes/branches.js
- routes/packages.js
- services.js
- staffSchedules.js
- offers.js
- webhooks.js
- App.tsx
- index.tsx
- manifest.json
- seed_luxury.js
- logger.js
- whatsappWorker.js
- routes/pos.js
- routes/reports.js
- staffBreaks.js
- Appointment.js
- RedisCache
- appointmentNotes.js
- availabilityController.js
- routes/notifications.js
- Chart.yaml
- validate.js
- RegionSyncService
- routes/metrics.js
- scripts
- namespace.yaml
- auditLog.js
- helmet
- Package.js
- receipt.js
- extends
- cache.js
- browserslist
- @testing-library/jest-dom
- Offer.js
- Review.js
- Tenant.js
- scripts
- react@^19.2.4
- react-router-dom@^7.14.0
- @testing-library/dom@^10.4.1
- i18n.config.js
- .mcp.json

## God Nodes (most connected - your core abstractions)
1. `supabase` - 47 edges
2. `express` - 34 edges
3. `authenticate()` - 25 edges
4. `authorize()` - 19 edges
5. `compilerOptions` - 16 edges
6. `dotenv` - 16 edges
7. `maskPhone()` - 15 edges
8. `useAuth()` - 14 edges
9. `AdminDashboard()` - 14 edges
10. `App()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `worker` --calls--> `maskPhone()`  [EXTRACTED]
  workers/deadLetterWorker.js → utils/logger.js
- `startReminderJob()` --calls--> `sendReminder()`  [EXTRACTED]
  cron/reminders.js → utils/whatsapp.js
- `anonymizeCustomer()` --calls--> `encrypt()`  [EXTRACTED]
  services/customer.service.js → utils/encryption.js
- `worker` --calls--> `maskPhone()`  [EXTRACTED]
  workers/whatsappWorker.js → utils/logger.js
- `updateStatus()` --calls--> `sendStaffCancellation()`  [EXTRACTED]
  controllers/appointmentsController.js → utils/whatsapp.js

## Import Cycles
- None detected.

## Communities (101 total; all shown)

### Community 0 - "App.jsx"
Cohesion: 0.07
Nodes (75): App.jsx, App(), Header(), frontend_src_contexts_ar, AuthContext.jsx, AuthContext, AuthProvider(), decodeUser() (+67 more)

### Community 1 - "executor.js"
Cohesion: 0.05
Nodes (64): @anthropic-ai/sdk, claude.js, askClaude(), UAE_SALON_PLAN, deepseek.js, askDeepSeek(), client, executor.js (+56 more)

### Community 2 - "frontend/package.json"
Cohesion: 0.06
Nodes (49): frontend/package.json, dependencies, axios@^0.27.2, @headlessui/react@^1.6.0, html2canvas@^1.4.1, html-to-image@^1.11.13, jwt-decode@^4.0.0, @material-ui/core@^4.12.4 (+41 more)

### Community 3 - "values.yaml"
Cohesion: 0.05
Nodes (39): values.yaml, autoscaling, enabled, maxReplicas, minReplicas, targetCPUUtilizationPercentage, targetMemoryUtilizationPercentage, image (+31 more)

### Community 4 - "containers"
Cohesion: 0.06
Nodes (35): deployment.yaml, env, image, livenessProbe, name, ports, readinessProbe, resources (+27 more)

### Community 5 - "customer.service.js"
Cohesion: 0.14
Nodes (33): customersController.js, dec(), decAll(), deleteCustomer(), getAppointmentsByCustomerId(), getCustomerById(), getCustomers(), getLoyaltyBalance() (+25 more)

### Community 6 - "qatar"
Cohesion: 0.07
Nodes (27): regions.yaml, failover, enabled, failoverThreshold, healthCheckInterval, location, mongodb, name (+19 more)

### Community 7 - "spec"
Cohesion: 0.08
Nodes (25): hpa.yaml, apiVersion, kind, metadata, name, namespace, name, pods (+17 more)

### Community 8 - "supabase.js"
Cohesion: 0.11
Nodes (24): controllers/loyalty.js, getBalance(), getTransactions(), redeemPoints(), reviewController.js, ReviewController, supabase.js, supabase (+16 more)

### Community 9 - "routes/index.js"
Cohesion: 0.22
Nodes (24): middleware/auth.js, authenticate(), authenticateCustomer(), authorize(), resolveToken(), express, ref_stripe, categories.js (+16 more)

### Community 10 - "annotations"
Cohesion: 0.09
Nodes (22): ingress.yaml, cert-manager.io/cluster-issuer, kubernetes.io/ingress.class, nginx.ingress.kubernetes.io/proxy-body-size, nginx.ingress.kubernetes.io/rate-limit, apiVersion, paths, kind (+14 more)

### Community 11 - "server.js"
Cohesion: 0.16
Nodes (21): cron/backup.js, backupTable(), ensureBucket(), log, pruneOldBackups(), runBackup(), startBackupJob(), TABLES (+13 more)

### Community 12 - "steps"
Cohesion: 0.11
Nodes (20): deploy-multiregion.yml, runs-on, steps, strategy, jobs, build-and-push, sync-database, region (+12 more)

### Community 13 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, @aws-sdk/client-s3@^3.1025.0, @aws-sdk/lib-storage@^3.1025.0, bcryptjs@^2.4.3, dotenv@^16.4.5, exceljs@^4.4.0, express@^4.19.2, jsonwebtoken@^9.0.2 (+12 more)

### Community 14 - "package.json"
Cohesion: 0.11
Nodes (19): package.json, @anthropic-ai/sdk@^0.30.0, compression@^1.8.1, handlebars@^4.7.9, nodemailer@^8.0.4, prom-client@^15.1.3, puppeteer-core@^24.40.0, devDependencies (+11 more)

### Community 15 - "queue.js"
Cohesion: 0.12
Nodes (19): bullmq@^5.73.0, bullmq, test-redis-connection.js, run(), queue.js, addToQueue(), analyticsQueue, closeQueues() (+11 more)

### Community 16 - "services"
Cohesion: 0.11
Nodes (19): render.yaml, fromService, generateValue, key, sync, value, name, property (+11 more)

### Community 17 - "compilerOptions"
Cohesion: 0.11
Nodes (18): tsconfig.json, compilerOptions, allowJs, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx (+10 more)

### Community 18 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, axios@^1.14.0, react-dom@^19.2.4, @testing-library/user-event@^13.5.0, @types/jest@^27.5.2, @types/node@^16.18.126, @types/react@^19.2.14, @types/react-dom@^19.2.3 (+9 more)

### Community 19 - "leadQualification.js"
Cohesion: 0.24
Nodes (16): twilio@^5.13.1, twilio, leadQualification.js, cancelEnquiryFollowup(), canSendFollowup(), classifyLead(), log, markLeadConverted() (+8 more)

### Community 20 - "app.js"
Cohesion: 0.16
Nodes (15): app.js, app, __dirname, limiter, logging.js, httpLogger, requestId(), skip() (+7 more)

### Community 21 - "twilio.js"
Cohesion: 0.18
Nodes (14): upsells.js, getUpsell(), UPSELL_RULES, defaults.js, DEFAULT_BRANCH_ID, DEFAULT_TENANT_ID, twilio.js, checkStaffAvailability() (+6 more)

### Community 22 - "salon-booking-demo/package.json"
Cohesion: 0.19
Nodes (13): salon-booking-demo/package.json, react-scripts@5.0.1, devDependencies, autoprefixer@^10.4.19, postcss@^8.4.38, tailwindcss@^3.4.17, autoprefixer, postcss (+5 more)

### Community 23 - "loyaltyEngine.js"
Cohesion: 0.18
Nodes (13): Customer.js, Customer, customerSchema, mongoose, LoyaltyTransaction.js, LoyaltyTransactionSchema, mongoose, loyaltyEngine.js (+5 more)

### Community 24 - "appointmentsController.js"
Cohesion: 0.32
Nodes (12): appointmentsController.js, cancelAppointment(), createAppointment(), getAllAppointments(), getMyAppointments(), getOneAppointment(), publicCreateAppointment(), rescheduleAppointment() (+4 more)

### Community 25 - "tenantRateLimit.js"
Cohesion: 0.18
Nodes (12): tenantRateLimit.js, apiRateLimit, authRateLimit, bookingRateLimit, createTenantRateLimit(), makeStore(), express-rate-limit@^8.3.2, ioredis@^5.10.1 (+4 more)

### Community 26 - "utils/availability.js"
Cohesion: 0.20
Nodes (12): models_appointment_appointment, Branch.js, models_branch_branch, branchSchema, mongoose, Staff.js, mongoose, Staff (+4 more)

### Community 27 - "ref_mongoose"
Cohesion: 0.17
Nodes (12): PosTerminal.js, PosTerminal, posTerminalSchema, Service.js, mongoose, serviceSchema, ServiceCategory.js, mongoose (+4 more)

### Community 28 - "analytics.js"
Cohesion: 0.33
Nodes (11): analyticsController.js, getAIPerformance(), getAppointmentAnalytics(), getCustomerSummary(), getGuestConversion(), getRevenueAnalytics(), getStaffCommission(), getStaffPerformance() (+3 more)

### Community 29 - "staff.js"
Cohesion: 0.36
Nodes (10): staffController.js, createStaff(), deleteStaff(), getPublicStaff(), getStaff(), getStaffById(), getStaffSchedule(), updateStaff() (+2 more)

### Community 30 - "queueDashboard.js"
Cohesion: 0.20
Nodes (10): @bull-board/api@^6.20.6, @bull-board/express@^6.20.6, @bull-board/api, @bull-board/express, queueDashboard.js, redisConnection, remindersQueue, reportsQueue (+2 more)

### Community 31 - "routes/branches.js"
Cohesion: 0.39
Nodes (9): controllers/branches.js, checkAvailability(), createBranch(), deleteBranch(), getBranchById(), getBranches(), updateBranch(), routes/branches.js (+1 more)

### Community 32 - "routes/packages.js"
Cohesion: 0.39
Nodes (9): controllers/packages.js, createPackage(), getMyPackages(), getPackages(), purchasePackage(), updatePackage(), useSession(), routes/packages.js (+1 more)

### Community 33 - "services.js"
Cohesion: 0.39
Nodes (9): serviceController.js, buildImageUrl(), createService(), deleteService(), getServiceById(), getServices(), updateService(), services.js (+1 more)

### Community 34 - "staffSchedules.js"
Cohesion: 0.36
Nodes (9): staffSchedulesController.js, DAYS, getAllSchedules(), getMySchedule(), getStaffSchedule(), updateMySchedule(), upsertStaffSchedule(), staffSchedules.js (+1 more)

### Community 35 - "offers.js"
Cohesion: 0.43
Nodes (8): offersController.js, createOffer(), deleteOffer(), getOffers(), updateOffer(), validateOffer(), offers.js, router

### Community 36 - "webhooks.js"
Cohesion: 0.43
Nodes (8): webhookController.js, createWebhook(), deleteWebhook(), getWebhookDeliveries(), getWebhooks(), updateWebhook(), webhooks.js, router

### Community 37 - "App.tsx"
Cohesion: 0.29
Nodes (8): @testing-library/react@^16.3.2, App.tsx, App(), BookingData, Service, Staff, App.test.tsx, @testing-library/react

### Community 38 - "index.tsx"
Cohesion: 0.32
Nodes (8): web-vitals@^2.1.4, index.tsx, root, reportWebVitals.ts, reportWebVitals(), ref_react_dom, web-vitals, web-vitals

### Community 39 - "manifest.json"
Cohesion: 0.25
Nodes (8): manifest.json, background_color, display, icons, name, short_name, start_url, theme_color

### Community 40 - "seed_luxury.js"
Cohesion: 0.25
Nodes (8): requestId.js, requestId(), @supabase/supabase-js@^2.49.0, ref_crypto, @supabase/supabase-js, seed_luxury.js, seedData(), supabase

### Community 41 - "logger.js"
Cohesion: 0.29
Nodes (8): logger.js, consoleFormat, createLogger(), jsonFormat, rotateBase, deadLetterWorker.js, log, worker

### Community 42 - "whatsappWorker.js"
Cohesion: 0.46
Nodes (8): whatsapp.js, client, sendBookingConfirmation(), sendCancellation(), sendReminder(), whatsappWorker.js, log, worker

### Community 43 - "routes/pos.js"
Cohesion: 0.48
Nodes (7): posController.js, createTerminal(), deleteTerminal(), getTerminals(), updateTerminal(), routes/pos.js, router

### Community 44 - "routes/reports.js"
Cohesion: 0.48
Nodes (7): controllers/reports.js, createReport(), getReportById(), getReports(), updateReportStatus(), routes/reports.js, router

### Community 45 - "staffBreaks.js"
Cohesion: 0.48
Nodes (7): staffBreaksController.js, createBreak(), deleteBreak(), getBreaksByStaff(), getMyBreaks(), staffBreaks.js, router

### Community 46 - "Appointment.js"
Cohesion: 0.29
Nodes (7): noShow.js, startNoShowJob(), Appointment.js, AppointmentSchema, mongoose, Notification.js, notificationSchema

### Community 47 - "RedisCache"
Cohesion: 0.33
Nodes (7): RedisCache, .del(), .get(), .invalidatePattern(), .ping(), .set(), .withCache()

### Community 48 - "appointmentNotes.js"
Cohesion: 0.53
Nodes (6): appointmentNotesController.js, addNote(), deleteNote(), getNotes(), appointmentNotes.js, router

### Community 49 - "availabilityController.js"
Cohesion: 0.53
Nodes (6): availabilityController.js, getAvailableSlots(), toMinutes(), toTimeStr(), routes/availability.js, router

### Community 50 - "routes/notifications.js"
Cohesion: 0.53
Nodes (6): controllers/notifications.js, createNotification(), getNotifications(), markSent(), routes/notifications.js, router

### Community 51 - "Chart.yaml"
Cohesion: 0.33
Nodes (6): Chart.yaml, apiVersion, appVersion, description, name, version

### Community 52 - "validate.js"
Cohesion: 0.33
Nodes (6): validate.js, mongoIdParam, paginationQuery, validate(), express-validator@^7.2.1, express-validator

### Community 53 - "RegionSyncService"
Cohesion: 0.40
Nodes (6): regionSync.js, RegionSyncService, .constructor(), .queueRetry(), .resolveConflict(), .syncAppointment()

### Community 54 - "routes/metrics.js"
Cohesion: 0.50
Nodes (5): metricsController.js, getHealth(), getMetrics(), routes/metrics.js, router

### Community 55 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, eject, start, test

### Community 56 - "namespace.yaml"
Cohesion: 0.40
Nodes (5): namespace.yaml, apiVersion, kind, metadata, name

### Community 57 - "auditLog.js"
Cohesion: 0.50
Nodes (5): auditLog.js, audit(), createSystemAuditLog(), sanitize(), SENSITIVE_FIELDS

### Community 58 - "helmet"
Cohesion: 0.40
Nodes (5): securityHeaders.js, configureSecurityHeaders(), corsOptions, helmet@^8.1.0, helmet

### Community 59 - "Package.js"
Cohesion: 0.40
Nodes (5): Package.js, CustomerPackage, CustomerPackageSchema, Package, PackageSchema

### Community 60 - "tenantFilter.js"
Cohesion: 0.40
Nodes (5): ref_http_errors, tenantFilter.js, addTenantFilter(), checkLimit(), requirePlanFeature()

### Community 61 - "receipt.js"
Cohesion: 0.40
Nodes (5): receipt.js, formatReceiptText(), generateReceipt(), Receipt, ReceiptSchema

### Community 62 - "loyaltyExpiry.js"
Cohesion: 0.50
Nodes (4): loyaltyExpiry.js, startLoyaltyExpiryJob(), ref_models_customer_js, ref_models_loyaltytransaction_js

### Community 63 - "extends"
Cohesion: 0.50
Nodes (4): eslintConfig, extends, react-app, react-app/jest

### Community 64 - "cache.js"
Cohesion: 0.50
Nodes (4): cache.js, cache, cacheInvalidate(), cacheResponse()

### Community 65 - "vatCalculator.js"
Cohesion: 0.50
Nodes (4): vatCalculator.js, calculateVAT(), extractVAT(), formatAED()

### Community 66 - "analyticsWorker.js"
Cohesion: 0.50
Nodes (4): analyticsWorker.js, TODO: Implement your logic here to aggregate daily revenue, TODO: Implement your logic here to aggregate tenant overview, TODO: Invalidate cached analytics data in Redis

### Community 67 - "browserslist"
Cohesion: 0.67
Nodes (3): browserslist, development, production

### Community 68 - "@testing-library/jest-dom"
Cohesion: 0.67
Nodes (3): @testing-library/jest-dom@^6.9.1, setupTests.ts, @testing-library/jest-dom

### Community 69 - "tailwindcss"
Cohesion: 0.67
Nodes (3): salon-booking-demo/tailwind.config.js, frontend/tailwind.config.js, tailwindcss

### Community 70 - "Offer.js"
Cohesion: 0.67
Nodes (3): Offer.js, Offer, offerSchema

### Community 71 - "Review.js"
Cohesion: 0.67
Nodes (3): Review.js, mongoose, reviewSchema

### Community 72 - "Tenant.js"
Cohesion: 0.67
Nodes (3): Tenant.js, Tenant, tenantSchema

### Community 73 - "scripts"
Cohesion: 0.67
Nodes (3): scripts, build, start

### Community 74 - "react@^19.2.4"
Cohesion: 1.00
Nodes (2): react@^19.2.4, react

### Community 75 - "react-router-dom@^7.14.0"
Cohesion: 1.00
Nodes (2): react-router-dom@^7.14.0, react-router-dom

### Community 76 - "@testing-library/dom@^10.4.1"
Cohesion: 1.00
Nodes (2): @testing-library/dom@^10.4.1, @testing-library/dom

### Community 77 - "i18n.config.js"
Cohesion: 1.00
Nodes (2): i18n.config.js, i18nConfig

### Community 78 - ".mcp.json"
Cohesion: 1.00
Nodes (2): .mcp.json, supabase

### Community 79 - "cron/reports.js"
Cohesion: 1.00
Nodes (1): cron/reports.js

### Community 80 - "salon-booking-demo/postcss.config.js"
Cohesion: 1.00
Nodes (1): salon-booking-demo/postcss.config.js

### Community 81 - "react-app-env.d.ts"
Cohesion: 1.00
Nodes (1): react-app-env.d.ts

### Community 82 - "frontend/postcss.config.js"
Cohesion: 1.00
Nodes (1): frontend/postcss.config.js

### Community 83 - "widget.js"
Cohesion: 1.00
Nodes (1): widget.js

### Community 84 - "AuditLog.js"
Cohesion: 1.00
Nodes (1): AuditLog.js

### Community 85 - "Report.js"
Cohesion: 1.00
Nodes (1): Report.js

### Community 86 - "Webhook.js"
Cohesion: 1.00
Nodes (1): Webhook.js

### Community 87 - "WebhookDelivery.js"
Cohesion: 1.00
Nodes (1): WebhookDelivery.js

### Community 88 - "init-shards.js"
Cohesion: 1.00
Nodes (1): init-shards.js

### Community 89 - "scripts/backup.js"
Cohesion: 1.00
Nodes (1): scripts/backup.js

### Community 90 - "healthCheck.js"
Cohesion: 1.00
Nodes (1): healthCheck.js

### Community 91 - "mongo-init.js"
Cohesion: 1.00
Nodes (1): mongo-init.js

### Community 92 - "verifyBackup.js"
Cohesion: 1.00
Nodes (1): verifyBackup.js

### Community 93 - "alerting.js"
Cohesion: 1.00
Nodes (1): alerting.js

### Community 94 - "utils/metrics.js"
Cohesion: 1.00
Nodes (1): utils/metrics.js

### Community 95 - "reportGenerator.js"
Cohesion: 1.00
Nodes (1): reportGenerator.js

### Community 96 - "sessionStore.js"
Cohesion: 1.00
Nodes (1): sessionStore.js

### Community 97 - "slowQueryPlugin.js"
Cohesion: 1.00
Nodes (1): slowQueryPlugin.js

### Community 98 - "webhookDispatcher.js"
Cohesion: 1.00
Nodes (1): webhookDispatcher.js

### Community 99 - "reportWorker.js"
Cohesion: 1.00
Nodes (1): reportWorker.js

### Community 100 - "webhookRetryWorker.js"
Cohesion: 1.00
Nodes (1): webhookRetryWorker.js

## Knowledge Gaps
- **2 isolated node(s):** `react-app`, `react-app/jest`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 364 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabase` connect `supabase.js` to `App.jsx`, `executor.js`, `customer.service.js`, `routes/index.js`, `server.js`, `leadQualification.js`, `twilio.js`, `appointmentsController.js`, `analytics.js`, `staff.js`, `routes/branches.js`, `routes/packages.js`, `services.js`, `staffSchedules.js`, `offers.js`, `webhooks.js`, `logger.js`, `whatsappWorker.js`, `routes/pos.js`, `routes/reports.js`, `staffBreaks.js`, `appointmentNotes.js`, `availabilityController.js`, `routes/notifications.js`, `routes/metrics.js`, `auditLog.js`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `authenticate()` (e.g. with `analytics.js` and `appointmentNotes.js`) actually correct?**
  _`authenticate()` has 23 INFERRED edges - model-reasoned connections that need verification._
- **What connects `react-app`, `react-app/jest` to the rest of the system?**
  _2 weakly-connected nodes found - possible missing edges._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06846846846846846 - nodes in this community are weakly interconnected._
- **Why does `node-cron` connect `server.js` to `Appointment.js`, `loyaltyExpiry.js`, `package.json`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Should `executor.js` be split into smaller, more focused modules?**
  _Cohesion score 0.053075396825396824 - nodes in this community are weakly interconnected._
- **Why does `dotenv` connect `executor.js` to `App.jsx`, `customer.service.js`, `supabase.js`, `routes/index.js`, `seed_luxury.js`, `server.js`, `dependencies`, `package.json`, `queue.js`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
## Build scope

AST-only extraction of 200 code files. Documents and media were not semantically extracted. Community names use deterministic hub labels. No LLM or paid API calls were made.

Raw pre-build extraction diagnostics (not exported-graph counts): dangling_endpoint_edges=6, self_loop_edges=3, undirected_same_endpoint_collapsed_edges=162. During build, endpoints may be resolved or external import stubs created; edges whose endpoints remain unresolved are dropped and are absent from `graph.json`. The exported graph has no dangling endpoints.
