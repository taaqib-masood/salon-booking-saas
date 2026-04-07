/**
 * Claude planner — UAE Salon Booking System
 * Falls back to a hardcoded plan when API credits are unavailable.
 */

const UAE_SALON_PLAN = [
  {
    step: "Stack: Node.js + Express + MongoDB (Mongoose). Auth via JWT. UAE VAT at 5%. Weekend is Friday–Saturday. Currency AED. WhatsApp notifications via Twilio.",
    type: "TEXT",
  },
  {
    step: "Create .env.example with: PORT, MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, STRIPE_SECRET_KEY, VAT_RATE=0.05",
    type: "CODE",
    file: ".env.example",
  },
  {
    step: "Create Mongoose model for Branch with fields: name, address (street, area, emirate, country), phone, email, workingHours (array of {day, open, close, isClosed}), holidays (array of dates), isActive, isDeleted. Add index on isDeleted.",
    type: "CODE",
    file: "models/Branch.js",
  },
  {
    step: "Create Mongoose model for Staff with fields: name, email, phone, passwordHash, role (enum: admin, manager, receptionist, stylist), specialties (array of strings), commissionRate (number, default 20), branch (ref Branch), workingDays (array of strings), isActive, isDeleted. Add indexes on email and branch.",
    type: "CODE",
    file: "models/Staff.js",
  },
  {
    step: "Create Mongoose model for ServiceCategory with fields: name_en, name_ar, icon (string), displayOrder (number), isActive.",
    type: "CODE",
    file: "models/ServiceCategory.js",
  },
  {
    step: "Create Mongoose model for Service with fields: name_en, name_ar, category (ref ServiceCategory), description_en, description_ar, duration (minutes), price (AED, number), vatInclusive (boolean, default true), branches (array ref Branch), isActive, isDeleted. Add indexes on category and isDeleted.",
    type: "CODE",
    file: "models/Service.js",
  },
  {
    step: "Create Mongoose model for Customer with fields: name, phone (unique, indexed), email, passwordHash (optional for guest), preferredLanguage (en/ar, default en), preferredStylist (ref Staff), loyaltyPoints (default 0), totalSpent (default 0), visitCount (default 0), notes, isDeleted. Index on phone.",
    type: "CODE",
    file: "models/Customer.js",
  },
  {
    step: "Create Mongoose model for Appointment with fields: customer (ref Customer or guest object with name+phone), staff (ref Staff), service (ref Service), branch (ref Branch), date (Date), timeSlot (string, e.g. '14:30'), endTime (string), status (enum: pending, confirmed, in_progress, completed, cancelled, no_show), subtotal, vatAmount, totalAmount, discountAmount, discountRef (string), paymentStatus (enum: pending, paid, partial, refunded), paymentMethod (cash/card/online), notes, cancellationReason, reminderSent (boolean), isGuest (boolean). Indexes on date, status, staff, customer, branch.",
    type: "CODE",
    file: "models/Appointment.js",
  },
  {
    step: "Create Mongoose model for Review with fields: appointment (ref Appointment, unique), customer (ref Customer), staff (ref Staff), service (ref Service), branch (ref Branch), rating (number 1-5), comment, isPublished (boolean, default true), createdAt. Index on staff and service.",
    type: "CODE",
    file: "models/Review.js",
  },
  {
    step: "Create Mongoose model for LoyaltyTransaction with fields: customer (ref Customer), points (number, can be negative for redemptions), type (enum: earn, redeem, expire, bonus), referenceType (string), referenceId (ObjectId), description, balance (points after transaction), createdAt. Index on customer.",
    type: "CODE",
    file: "models/LoyaltyTransaction.js",
  },
  {
    step: "Create Mongoose model for Package with fields: name, description, services (array of ref Service), totalSessions (number), price (AED), validityDays (number, e.g. 180), isActive. And CustomerPackage model with fields: customer (ref Customer), package (ref Package), sessionsLeft, purchasedAt, expiresAt, isActive. Index on customer in CustomerPackage.",
    type: "CODE",
    file: "models/Package.js",
  },
  {
    step: "Create Mongoose model for Offer with fields: name, code (unique, indexed), discountType (enum: percentage, fixed_aed), discountValue (number), minOrderAmount (number, default 0), maxUses (number), usedCount (default 0), validFrom (Date), validTo (Date), applicableServices (array ref Service, empty = all), isActive.",
    type: "CODE",
    file: "models/Offer.js",
  },
  {
    step: "Create Mongoose model for Notification with fields: customer (ref Customer), appointment (ref Appointment), type (enum: booking_confirmation, reminder, cancellation, waitlist_available, loyalty_update), channel (enum: whatsapp, sms, email), status (enum: pending, sent, failed), scheduledAt, sentAt, payload (Mixed), errorMessage. Index on status and scheduledAt.",
    type: "CODE",
    file: "models/Notification.js",
  },
  {
    step: "Create JWT authentication middleware at middleware/auth.js. Export two middlewares: authenticate (verifies Bearer JWT, attaches req.staff) and authorize(...roles) (checks req.staff.role is in allowed roles array). Return 401 for missing/invalid token, 403 for insufficient role.",
    type: "CODE",
    file: "middleware/auth.js",
  },
  {
    step: "Create centralized error handler middleware at middleware/errorHandler.js. Handle Mongoose ValidationError (400), Mongoose duplicate key error code 11000 (409 with field name), JWT errors (401), and generic errors (500). Return JSON {success:false, message, errors?}.",
    type: "CODE",
    file: "middleware/errorHandler.js",
  },
  {
    step: "Create validation middleware at middleware/validate.js. Export a validate(schema) function that takes an express-validator checkSchema result, runs validationResult, and returns 422 with array of errors if invalid. Also export common reusable validator chains: paginationQuery, mongoIdParam.",
    type: "CODE",
    file: "middleware/validate.js",
  },
  {
    step: "Create utils/vatCalculator.js. Export: calculateVAT(price, rate=0.05) returns {subtotal, vatAmount, totalAmount}. extractVAT(vatInclusivePrice, rate=0.05) returns {subtotal, vatAmount, totalAmount} for VAT-inclusive prices. formatAED(amount) returns string like 'AED 125.00'.",
    type: "CODE",
    file: "utils/vatCalculator.js",
  },
  {
    step: "Create utils/loyaltyEngine.js. Export: pointsEarned(totalAmountAED) returns integer points (1 point per AED 10). pointsToDiscount(points) returns AED discount (100 points = AED 10). applyLoyaltyEarn(customerId, appointmentId, totalAmount) updates customer points and creates LoyaltyTransaction. applyLoyaltyRedeem(customerId, points, appointmentId) validates sufficient points, deducts, creates transaction. getBalance(customerId) returns current points.",
    type: "CODE",
    file: "utils/loyaltyEngine.js",
  },
  {
    step: "Create utils/availability.js. Export: getAvailableSlots(staffId, branchId, date, serviceDuration) returns array of available time strings like ['09:00','09:30',...] by fetching staff working hours, branch hours, and existing appointments for that day, then computing free slots in 30-min intervals. isSlotAvailable(staffId, date, timeSlot, duration) returns boolean.",
    type: "CODE",
    file: "utils/availability.js",
  },
  {
    step: "Create utils/whatsapp.js using Twilio SDK. Export: sendBookingConfirmation(phone, {customerName, serviceName, staffName, date, timeSlot, totalAmount, branch}), sendReminder(phone, {customerName, serviceName, date, timeSlot}), sendCancellation(phone, {customerName, serviceName, date, refundAmount}). All send WhatsApp messages via Twilio WhatsApp sandbox. Handle errors gracefully.",
    type: "CODE",
    file: "utils/whatsapp.js",
  },
  {
    step: "Create auth routes at routes/auth.js. POST /auth/staff/login: validate email+password, compare bcrypt hash, return JWT. POST /auth/customer/register: create customer with hashed password. POST /auth/customer/login: validate phone+password, return JWT. POST /auth/customer/guest: create/find guest customer by phone, return token. All use express-validator.",
    type: "CODE",
    file: "routes/auth.js",
  },
  {
    step: "Create branch routes at routes/branches.js. GET /branches (public, paginated, filter by emirate). GET /branches/:id. POST /branches (admin only). PUT /branches/:id (admin/manager). DELETE /branches/:id soft delete (admin only). GET /branches/:id/availability?date=YYYY-MM-DD returns available slots.",
    type: "CODE",
    file: "routes/branches.js",
  },
  {
    step: "Create staff routes at routes/staff.js. GET /staff (manager+, paginated, filter by branch/role/specialty). GET /staff/:id (public — for customer to browse stylists). POST /staff (admin/manager — hash password with bcrypt). PUT /staff/:id. DELETE /staff/:id soft delete. GET /staff/:id/schedule?date= returns day schedule. GET /staff/:id/availability?date=&serviceId= returns available time slots.",
    type: "CODE",
    file: "routes/staff.js",
  },
  {
    step: "Create service category routes at routes/categories.js. GET /categories (public). GET /categories/:id. POST /categories (admin). PUT /categories/:id (admin). DELETE /categories/:id (admin).",
    type: "CODE",
    file: "routes/categories.js",
  },
  {
    step: "Create service routes at routes/services.js. GET /services (public, paginated, filter by category/branch/maxPrice, sort by price/duration). GET /services/:id (public). POST /services (admin/manager). PUT /services/:id (admin/manager). DELETE /services/:id soft delete. Each service response includes computed vatAmount and totalPrice.",
    type: "CODE",
    file: "routes/services.js",
  },
  {
    step: "Create appointment routes at routes/appointments.js. POST /appointments (public — customer or guest books): validate slot availability, calculate VAT, apply offer code if provided, create appointment, trigger WhatsApp confirmation, earn loyalty points. GET /appointments (staff — paginated, filter by date/status/branch/staff). GET /appointments/:id. PATCH /appointments/:id/status (staff — update to confirmed/in_progress/completed/no_show). POST /appointments/:id/reschedule (customer/staff). DELETE /appointments/:id cancel: enforce cancellation policy (free >24h, 50% <24h, 100% no-show).",
    type: "CODE",
    file: "routes/appointments.js",
  },
  {
    step: "Create customer routes at routes/customers.js. GET /customers (receptionist+, paginated, search by name/phone). GET /customers/:id (includes stats: totalSpent, visitCount, loyaltyPoints). GET /customers/:id/appointments (history, paginated). PUT /customers/:id (update profile, preferences). DELETE /customers/:id soft delete (admin). GET /customers/:id/loyalty returns loyalty balance and transaction history.",
    type: "CODE",
    file: "routes/customers.js",
  },
  {
    step: "Create review routes at routes/reviews.js. POST /reviews (authenticated customer, one per appointment, only after status=completed). GET /reviews?staffId=&serviceId=&branchId= (public, paginated, with averageRating summary). GET /reviews/:id. DELETE /reviews/:id (admin — unpublish). Calculate and return averageRating on GET list.",
    type: "CODE",
    file: "routes/reviews.js",
  },
  {
    step: "Create loyalty routes at routes/loyalty.js. GET /loyalty/balance (authenticated customer — returns points, AED equivalent). GET /loyalty/transactions (authenticated customer — paginated history). POST /loyalty/redeem (authenticated customer — validate points, apply to next appointment as discount).",
    type: "CODE",
    file: "routes/loyalty.js",
  },
  {
    step: "Create package routes at routes/packages.js. GET /packages (public). POST /packages (admin). PUT /packages/:id (admin). POST /packages/:id/purchase (authenticated customer — create CustomerPackage, charge payment). GET /packages/my (authenticated customer — list their active packages with sessionsLeft). POST /packages/use (authenticated customer — use one session from a package for an appointment).",
    type: "CODE",
    file: "routes/packages.js",
  },
  {
    step: "Create offer routes at routes/offers.js. GET /offers (admin/manager — full list with usedCount). POST /offers (admin). PUT /offers/:id (admin). DELETE /offers/:id (admin). POST /offers/validate (public — validate offer code for a given service and amount, returns discount details).",
    type: "CODE",
    file: "routes/offers.js",
  },
  {
    step: "Create analytics routes at routes/analytics.js (admin/manager only). GET /analytics/revenue?from=&to=&branchId= returns {total, vatCollected, byDay:[]}. GET /analytics/appointments?from=&to= returns {total, byStatus, byService:[{name,count,revenue}]}. GET /analytics/staff/:id/commission?from=&to= returns {totalRevenue, commissionRate, commissionOwed, appointments:[]}. GET /analytics/top-services?limit=10 returns top services by booking count. GET /analytics/customers/summary returns {total, newThisMonth, returning, topSpenders:[]}.",
    type: "CODE",
    file: "routes/analytics.js",
  },
  {
    step: "Create payment routes at routes/payments.js. POST /payments/intent (authenticated — create Stripe PaymentIntent in AED for an appointment, return clientSecret). POST /payments/webhook (Stripe webhook — verify signature, update appointment paymentStatus to paid on success). POST /payments/refund (admin — create Stripe refund for cancelled appointment based on cancellation policy).",
    type: "CODE",
    file: "routes/payments.js",
  },
  {
    step: "Create notification routes at routes/notifications.js. POST /notifications/send (internal/admin — manually trigger WhatsApp for an appointment). GET /notifications (admin — list all, filter by status/channel). POST /notifications/reminder-batch (admin — find all appointments in next 2 hours, send reminders, mark reminderSent=true).",
    type: "CODE",
    file: "routes/notifications.js",
  },
  {
    step: "Create main Express app at app.js. Import and mount all routes. Add: helmet, cors, express.json(), morgan for logging, rate limiter (express-rate-limit: 100 req/15min). Mount all routes under /api/v1. Add 404 handler. Mount errorHandler last.",
    type: "CODE",
    file: "app.js",
  },
  {
    step: "Create server.js entry point. Load dotenv, import app, connect to MongoDB with Mongoose (retry on failure, log connected URI). Start HTTP server on PORT. Handle unhandledRejection and uncaughtException with graceful shutdown.",
    type: "CODE",
    file: "server.js",
  },
  {
    step: "System is ready. Install dependencies: npm install express mongoose dotenv bcryptjs jsonwebtoken express-validator twilio stripe helmet cors morgan express-rate-limit. Start with: node server.js. All routes are under /api/v1/. Auth header: Bearer <token>.",
    type: "TEXT",
  },
];

export async function askClaude(task) {
  // Try real API first
  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

    const SYSTEM_PROMPT = `You are a software architect. Your ONLY job is to break tasks into a structured plan.

Rules:
- DO NOT generate any code
- Keep steps short and clear
- Mark each step as either CODE or TEXT
- For CODE steps, include a "file" field with the correct relative file path
- Return ONLY valid JSON — no explanations, no markdown, no code fences`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Task: ${task}\n\nReturn ONLY a JSON array of steps. No code. No markdown.`,
        },
      ],
    });

    const raw = response.content[0]?.text?.trim() ?? "";
    const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    const steps = JSON.parse(cleaned);

    if (!Array.isArray(steps)) throw new Error("Not an array");

    const CODE_SMELL = /^(const|let|var|function|import|export|class|if\s*\(|\/\/)/m;
    return steps.filter((s) => {
      if (typeof s.step !== "string") return false;
      if (CODE_SMELL.test(s.step)) {
        console.warn(`⚠️  Dropped step — looks like code: "${s.step.slice(0, 60)}..."`);
        return false;
      }
      return true;
    });
  } catch (err) {
    if (err.message?.includes("credit") || err.message?.includes("401") || err.status === 401) {
      console.warn("⚠️  Claude API unavailable — using built-in UAE salon plan.\n");
      return UAE_SALON_PLAN;
    }
    throw err;
  }
}
