# Graph Report - salon-booking-saas  (2026-11-05)

## Corpus Check
- 330 files · ~80,396 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 26 file(s) not represented in the graph (top: (none) 14, .css 4, .example 3)

## Summary
- 1369 nodes · 2183 edges · 162 communities (71 shown, 91 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 143 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7dc91092`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- salon-booking-demo/package.json
- frontend/package.json
- output/cron/reminders.js
- values.yaml
- customer.service.js
- output/frontend/package.json
- containers
- routes/staff.js
- app.js
- qatar
- ref_react
- spec
- supabase.js
- routes/index.js
- ref_express
- with
- annotations
- twilio.js
- routes/services.js
- steps
- frontend/src/App.jsx
- services
- executor.js
- appointmentsController.js
- compilerOptions
- ref_dotenv
- server.js
- mongoose
- followupWorker.js
- cron/backup.js
- askDeepSeek
- App.tsx
- frontend/src/pages/AdminDashboard.jsx
- dependencies
- routes/packages.js
- utils/loyaltyEngine.js
- output/utils/loyaltyEngine.js
- output/routes/reviews.js
- routes/branches.js
- frontend/src/main.jsx
- frontend/src/pages/ServiceBrowser.jsx
- utils/availability.js
- routes/analytics.js
- output/frontend/src/App.jsx
- dependencies
- output/utils/pos.js
- package.json
- queue.js
- output/package.json
- staffSchedules.js
- routes/offers.js
- webhooks.js
- manifest.json
- queueDashboard.js
- routes/pos.js
- routes/reports.js
- staffBreaks.js
- models/Appointment.js
- RedisCache
- appointmentNotes.js
- routes/notifications.js
- AIPerformancePage.jsx
- Chart.yaml
- output/frontend/src/contexts/LangContext.jsx
- output/utils/i18n.js
- logger.js
- RegionSyncService
- utils/i18n.js
- routes/metrics.js
- namespace.yaml
- auditLog.js
- models/Package.js
- output/models/Offer.js
- output/models/Package.js
- output/server.js
- utils/receipt.js
- cache.js
- ipWhitelist.js
- scripts
- claude.js
- models/Offer.js
- models/PosTerminal.js
- models/Service.js
- models/ServiceCategory.js
- output/frontend/tailwind.config.js
- output/models/Service.js
- output/models/ServiceCategory.js
- scripts
- i18n.config.js
- .mcp.json
- @aws-sdk/client-s3@^3.1025.0
- bcryptjs@^2.4.3
- @bull-board/api@^6.20.6
- @bull-board/express@^6.20.6
- bullmq@^5.73.0
- exceljs@^4.4.0
- express@^4.18.2
- express-rate-limit@^7.0.0
- express-validator@^7.0.0
- helmet@^7.0.0
- ioredis@^5.10.1
- morgan@^1.10.0
- node-cron@^4.2.1
- nodemailer@^8.0.4
- prom-client@^15.1.3
- twilio@^4.0.0
- winston@^3.19.0
- winston-daily-rotate-file@^5.0.0
- @aws-sdk/client-s3@^3.1025.0
- @aws-sdk/lib-storage@^3.1025.0
- @bull-board/api@^6.20.6
- @bull-board/express@^6.20.6
- bullmq@^5.73.0
- compression@^1.8.1
- cors@^2.8.6
- dotenv@^16.4.5
- exceljs@^4.4.0
- express@^4.19.2
- express-rate-limit@^8.3.2
- express-validator@^7.2.1
- handlebars@^4.7.9
- ioredis@^5.10.1
- node-cron@^4.2.1
- nodemailer@^8.0.4
- prom-client@^15.1.3
- puppeteer-core@^24.40.0
- rate-limit-redis@^4.3.1
- twilio@^5.13.1
- winston-daily-rotate-file@^5.0.0

## God Nodes (most connected - your core abstractions)
1. `supabase` - 47 edges
2. `mongoose` - 39 edges
3. `authenticate()` - 25 edges
4. `authorize()` - 19 edges
5. `compilerOptions` - 16 edges
6. `maskPhone()` - 15 edges
7. `useAuth()` - 14 edges
8. `AdminDashboard()` - 14 edges
9. `App()` - 11 edges
10. `services` - 10 edges

## Surprising Connections (you probably didn't know these)
- `worker` --calls--> `maskPhone()`  [EXTRACTED]
  workers/deadLetterWorker.js → utils/logger.js
- `start()` --calls--> `startBackupJob()`  [EXTRACTED]
  server.js → cron/backup.js
- `anonymizeCustomer()` --calls--> `encrypt()`  [EXTRACTED]
  services/customer.service.js → utils/encryption.js
- `followupWorker` --calls--> `canSendFollowup()`  [EXTRACTED]
  workers/followupWorker.js → services/leadQualification.js
- `followupWorker` --calls--> `maskPhone()`  [EXTRACTED]
  workers/followupWorker.js → utils/logger.js

## Import Cycles
- None detected.

## Communities (162 total, 91 thin omitted)

### Community 0 - "salon-booking-demo/package.json"
Cohesion: 0.05
Nodes (51): browserslist, development, production, dependencies, axios@^1.14.0, react@^19.2.4, react-dom@^19.2.4, react-router-dom@^7.14.0 (+43 more)

### Community 1 - "frontend/package.json"
Cohesion: 0.06
Nodes (47): dependencies, axios@^0.27.2, @headlessui/react@^1.6.0, html2canvas@^1.4.1, html-to-image@^1.11.13, jwt-decode@^4.0.0, @material-ui/core@^4.12.4, moment@^2.30.1 (+39 more)

### Community 2 - "output/cron/reminders.js"
Cohesion: 0.05
Nodes (18): startReminderJob(), authenticate(), AppointmentSchema, mongoose, branchSchema, mongoose, notificationSchema, mongoose (+10 more)

### Community 3 - "values.yaml"
Cohesion: 0.05
Nodes (38): autoscaling, enabled, maxReplicas, minReplicas, targetCPUUtilizationPercentage, targetMemoryUtilizationPercentage, image, pullPolicy (+30 more)

### Community 4 - "customer.service.js"
Cohesion: 0.13
Nodes (28): dec(), decAll(), deleteCustomer(), getAppointmentsByCustomerId(), getCustomerById(), getCustomers(), getLoyaltyBalance(), updateCustomerProfile() (+20 more)

### Community 5 - "output/frontend/package.json"
Cohesion: 0.08
Nodes (35): dependencies, axios@^0.27.2, @headlessui/react@^1.6.0, react@^17.0.2, react-datepicker@^4.8.0, react-dom@^17.0.2, react-hot-toast@^2.3.0, react-router-dom@^6.3.0 (+27 more)

### Community 6 - "containers"
Cohesion: 0.06
Nodes (34): env, image, livenessProbe, name, ports, readinessProbe, resources, apiVersion (+26 more)

### Community 7 - "routes/staff.js"
Cohesion: 0.07
Nodes (17): createStaff(), deleteStaff(), getPublicStaff(), getStaff(), getStaffById(), getStaffSchedule(), updateStaff(), mongoIdParam (+9 more)

### Community 8 - "app.js"
Cohesion: 0.09
Nodes (15): app, __dirname, limiter, httpLogger, requestId(), corsOptions, apiRateLimit, authRateLimit (+7 more)

### Community 9 - "qatar"
Cohesion: 0.07
Nodes (26): failover, enabled, failoverThreshold, healthCheckInterval, location, mongodb, name, primary (+18 more)

### Community 10 - "ref_react"
Cohesion: 0.11
Nodes (6): BookingConfirmation(), IcalLink(), AuthContext, localizer, ServiceBrowser(), useStyles

### Community 11 - "spec"
Cohesion: 0.08
Nodes (24): apiVersion, kind, metadata, name, namespace, name, pods, resource (+16 more)

### Community 12 - "supabase.js"
Cohesion: 0.20
Nodes (8): ReviewController, supabase, authenticate(), authenticateCustomer(), authorize(), resolveToken(), stripe, router

### Community 13 - "routes/index.js"
Cohesion: 0.10
Nodes (11): router, router, router, router, router, router, router, router (+3 more)

### Community 14 - "ref_express"
Cohesion: 0.10
Nodes (10): getAvailableSlots(), toMinutes(), toTimeStr(), router, router, router, router, router (+2 more)

### Community 15 - "with"
Cohesion: 0.09
Nodes (22): environment, runs-on, steps, jobs, deploy, name, on, push (+14 more)

### Community 16 - "annotations"
Cohesion: 0.09
Nodes (21): cert-manager.io/cluster-issuer, kubernetes.io/ingress.class, nginx.ingress.kubernetes.io/proxy-body-size, nginx.ingress.kubernetes.io/rate-limit, apiVersion, paths, kind, metadata (+13 more)

### Community 17 - "twilio.js"
Cohesion: 0.18
Nodes (16): getUpsell(), UPSELL_RULES, openai, conversationState, log, tools, cancelEnquiryFollowup(), canSendFollowup() (+8 more)

### Community 18 - "routes/services.js"
Cohesion: 0.15
Nodes (11): buildImageUrl(), createService(), deleteService(), getServiceById(), getServices(), updateService(), api, createAppointment() (+3 more)

### Community 19 - "steps"
Cohesion: 0.11
Nodes (19): runs-on, steps, strategy, jobs, build-and-push, sync-database, region, name (+11 more)

### Community 20 - "frontend/src/App.jsx"
Cohesion: 0.29
Nodes (12): App(), Header(), useAuth(), BookingFlow(), isUAEWeekend(), Spinner(), STEP_LABELS, TimeSelector() (+4 more)

### Community 21 - "services"
Cohesion: 0.11
Nodes (18): fromService, generateValue, key, sync, value, name, property, type (+10 more)

### Community 22 - "executor.js"
Cohesion: 0.24
Nodes (14): askClaude(), BASE_FOLDERS, DEFAULT_PACKAGE_JSON, __dirname, ensureOutputDir(), fileExists(), generateReadme(), OUTPUT_DIR (+6 more)

### Community 23 - "appointmentsController.js"
Cohesion: 0.22
Nodes (13): cancelAppointment(), createAppointment(), getAllAppointments(), getMyAppointments(), getOneAppointment(), publicCreateAppointment(), rescheduleAppointment(), updateStatus() (+5 more)

### Community 24 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, lib (+9 more)

### Community 25 - "ref_dotenv"
Cohesion: 0.15
Nodes (13): cloudinary@^2.9.0, cloudinary, FINAL, run(), upload(), RETRY_IMAGES, run(), uploadToCloudinary() (+5 more)

### Community 26 - "server.js"
Cohesion: 0.23
Nodes (11): client, sendDailySummary(), startDailySummaryJob(), startReminderJob(), start(), client, sendBookingConfirmation(), sendCancellation() (+3 more)

### Community 27 - "mongoose"
Cohesion: 0.12
Nodes (10): mongoose, reviewSchema, Tenant, tenantSchema, TenantSubscriptionSchema, PosTerminal, posTerminalSchema, mongoose (+2 more)

### Community 28 - "followupWorker.js"
Cohesion: 0.20
Nodes (9): createLogger(), bullConnection, cacheClient, isSecure, log, worker, followupWorker, log (+1 more)

### Community 29 - "cron/backup.js"
Cohesion: 0.20
Nodes (7): backupTable(), ensureBucket(), log, pruneOldBackups(), runBackup(), startBackupJob(), TABLES

### Community 30 - "askDeepSeek"
Cohesion: 0.22
Nodes (8): askDeepSeek(), client, run(), run(), args, daysArg, files, LOG_DIR

### Community 31 - "App.tsx"
Cohesion: 0.19
Nodes (8): web-vitals@^2.1.4, App(), BookingData, Service, Staff, root, reportWebVitals(), web-vitals

### Community 32 - "frontend/src/pages/AdminDashboard.jsx"
Cohesion: 0.30
Nodes (13): AdminDashboard(), BreakModal(), COLORS, KPICard(), localizer, Modal(), OfferModal(), ServiceModal() (+5 more)

### Community 33 - "dependencies"
Cohesion: 0.14
Nodes (14): dependencies, @anthropic-ai/sdk@^0.30.0, helmet@^8.1.0, jsonwebtoken@^9.0.2, openai@^4.104.0, @sparticuz/chromium@^143.0.4, @supabase/supabase-js@^2.49.0, winston@^3.19.0 (+6 more)

### Community 34 - "routes/packages.js"
Cohesion: 0.29
Nodes (8): createPackage(), getMyPackages(), getPackages(), purchasePackage(), updatePackage(), useSession(), router, router

### Community 35 - "utils/loyaltyEngine.js"
Cohesion: 0.18
Nodes (7): Customer, customerSchema, mongoose, LoyaltyTransactionSchema, mongoose, applyLoyaltyEarn(), pointsEarned()

### Community 36 - "output/utils/loyaltyEngine.js"
Cohesion: 0.18
Nodes (7): Customer, customerSchema, mongoose, LoyaltyTransactionSchema, mongoose, applyLoyaltyEarn(), pointsEarned()

### Community 37 - "output/routes/reviews.js"
Cohesion: 0.15
Nodes (5): router, router, generateReceipt(), Receipt, ReceiptSchema

### Community 38 - "routes/branches.js"
Cohesion: 0.33
Nodes (8): checkAvailability(), createBranch(), deleteBranch(), getBranchById(), getBranches(), updateBranch(), router, router

### Community 39 - "frontend/src/main.jsx"
Cohesion: 0.18
Nodes (5): AuthContext, AuthProvider(), decodeUser(), LangContext, LangProvider()

### Community 40 - "frontend/src/pages/ServiceBrowser.jsx"
Cohesion: 0.33
Nodes (9): useLang(), useScrollReveal(), useStaggerReveal(), REVIEWS, ServiceBrowser(), ServiceCard(), SkeletonCard(), StaffCard() (+1 more)

### Community 41 - "utils/availability.js"
Cohesion: 0.20
Nodes (7): branchSchema, mongoose, mongoose, Staff, staffSchema, getAvailableSlots(), isSlotAvailable()

### Community 42 - "routes/analytics.js"
Cohesion: 0.33
Nodes (9): getAIPerformance(), getAppointmentAnalytics(), getCustomerSummary(), getGuestConversion(), getRevenueAnalytics(), getStaffCommission(), getStaffPerformance(), getTopServices() (+1 more)

### Community 44 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, @aws-sdk/lib-storage@^3.1025.0, cors@^2.8.5, handlebars@^4.7.9, jsonwebtoken@^9.0.0, mongoose@^7.0.0, stripe@^14.0.0, @aws-sdk/lib-storage (+3 more)

### Community 46 - "package.json"
Cohesion: 0.20
Nodes (10): bcryptjs@^2.4.3, morgan@^1.10.0, devDependencies, daisyui@^4.12.10, bcryptjs, morgan, name, type (+2 more)

### Community 47 - "queue.js"
Cohesion: 0.18
Nodes (8): analyticsQueue, deadLetterQueue, defaultJobOptions, emailQueue, followupQueue, reportQueue, webhookRetryQueue, whatsappQueue

### Community 48 - "output/package.json"
Cohesion: 0.20
Nodes (9): dotenv@^16.0.0, rate-limit-redis@^4.3.1, description, dotenv, rate-limit-redis, main, name, type (+1 more)

### Community 49 - "staffSchedules.js"
Cohesion: 0.36
Nodes (7): DAYS, getAllSchedules(), getMySchedule(), getStaffSchedule(), updateMySchedule(), upsertStaffSchedule(), router

### Community 51 - "routes/offers.js"
Cohesion: 0.43
Nodes (6): createOffer(), deleteOffer(), getOffers(), updateOffer(), validateOffer(), router

### Community 52 - "webhooks.js"
Cohesion: 0.43
Nodes (6): createWebhook(), deleteWebhook(), getWebhookDeliveries(), getWebhooks(), updateWebhook(), router

### Community 53 - "manifest.json"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 54 - "queueDashboard.js"
Cohesion: 0.25
Nodes (5): redisConnection, remindersQueue, reportsQueue, router, serverAdapter

### Community 55 - "routes/pos.js"
Cohesion: 0.48
Nodes (5): createTerminal(), deleteTerminal(), getTerminals(), updateTerminal(), router

### Community 56 - "routes/reports.js"
Cohesion: 0.48
Nodes (5): createReport(), getReportById(), getReports(), updateReportStatus(), router

### Community 57 - "staffBreaks.js"
Cohesion: 0.48
Nodes (5): createBreak(), deleteBreak(), getBreaksByStaff(), getMyBreaks(), router

### Community 58 - "models/Appointment.js"
Cohesion: 0.29
Nodes (3): AppointmentSchema, mongoose, notificationSchema

### Community 60 - "appointmentNotes.js"
Cohesion: 0.53
Nodes (4): addNote(), deleteNote(), getNotes(), router

### Community 61 - "routes/notifications.js"
Cohesion: 0.53
Nodes (4): createNotification(), getNotifications(), markSent(), router

### Community 63 - "AIPerformancePage.jsx"
Cohesion: 0.53
Nodes (4): AIPerformancePage(), IntentRow(), StatCard(), api

### Community 64 - "Chart.yaml"
Cohesion: 0.33
Nodes (5): apiVersion, appVersion, description, name, version

### Community 66 - "output/utils/i18n.js"
Cohesion: 0.40
Nodes (3): getNestedValue(), locales, t()

### Community 67 - "logger.js"
Cohesion: 0.33
Nodes (3): consoleFormat, jsonFormat, rotateBase

### Community 69 - "utils/i18n.js"
Cohesion: 0.40
Nodes (3): getNestedValue(), locales, t()

### Community 72 - "namespace.yaml"
Cohesion: 0.40
Nodes (4): apiVersion, kind, metadata, name

### Community 73 - "auditLog.js"
Cohesion: 0.50
Nodes (3): audit(), sanitize(), SENSITIVE_FIELDS

### Community 74 - "models/Package.js"
Cohesion: 0.40
Nodes (4): CustomerPackage, CustomerPackageSchema, Package, PackageSchema

### Community 75 - "output/models/Offer.js"
Cohesion: 0.50
Nodes (3): Offer, offerSchema, router

### Community 76 - "output/models/Package.js"
Cohesion: 0.40
Nodes (4): CustomerPackage, CustomerPackageSchema, Package, PackageSchema

### Community 80 - "ipWhitelist.js"
Cohesion: 0.67
Nodes (3): ADMIN_IP_WHITELIST, ipWhitelistMiddleware(), isPrivateIp()

### Community 82 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, dev, healthcheck, start

### Community 95 - "scripts"
Cohesion: 0.67
Nodes (3): scripts, build, start

## Knowledge Gaps
- **2 isolated node(s):** `react-app`, `react-app/jest`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 534 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **91 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `mongoose` connect `mongoose` to `output/cron/reminders.js`, `routes/staff.js`, `utils/loyaltyEngine.js`, `output/utils/loyaltyEngine.js`, `output/routes/reviews.js`, `utils/availability.js`, `dependencies`, `output/package.json`, `models/Appointment.js`, `cron/loyaltyExpiry.js`, `RegionSyncService`, `models/Package.js`, `output/models/Offer.js`, `output/models/Package.js`, `output/server.js`, `utils/receipt.js`, `models/Offer.js`, `models/PosTerminal.js`, `models/Service.js`, `models/ServiceCategory.js`, `output/models/Service.js`, `output/models/ServiceCategory.js`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **What connects `react-app`, `react-app/jest` to the rest of the system?**
  _2 weakly-connected nodes found - possible missing edges._
- **Should `salon-booking-demo/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.050072568940493466 - nodes in this community are weakly interconnected._
- **Why does `supabase` connect `supabase.js` to `customer.service.js`, `routes/staff.js`, `routes/index.js`, `ref_express`, `twilio.js`, `routes/services.js`, `appointmentsController.js`, `ref_dotenv`, `server.js`, `followupWorker.js`, `cron/backup.js`, `routes/packages.js`, `routes/branches.js`, `routes/analytics.js`, `staffSchedules.js`, `routes/offers.js`, `webhooks.js`, `routes/pos.js`, `routes/reports.js`, `staffBreaks.js`, `appointmentNotes.js`, `routes/notifications.js`, `routes/metrics.js`, `auditLog.js`, `ipWhitelist.js`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Should `frontend/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05851063829787234 - nodes in this community are weakly interconnected._
- **Why does `@testing-library/react` connect `salon-booking-demo/package.json` to `App.tsx`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Should `output/cron/reminders.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05353535353535353 - nodes in this community are weakly interconnected._
## Build scope

AST-only extraction of 272 code files. Documents and media were not semantically extracted. Community names use deterministic hub labels. No LLM or paid API calls were made.

Graph health diagnostics: dangling_endpoint_edges=10, self_loop_edges=3, undirected_same_endpoint_collapsed_edges=179.
