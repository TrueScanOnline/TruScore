# Apple/Google Direct Billing vs Qonversion - Complete Comparison

## ⚠️ IMPORTANT CLARIFICATION

**Qonversion (and all subscription platforms) STILL USE Apple and Google's native payment systems.**

**The payment flow is the same for both options:**
- Apple/Google handle ALL credit card processing
- Apple/Google charge customers directly
- Apple/Google manage subscriptions (renewals, cancellations)
- Apple/Google collect 30% platform fee (15% after year 1)

**The difference is NOT who charges the customer - it's WHO MANAGES the subscription system.**

---

## 1. How Apple/Google Direct Billing Works

### What Apple/Google Handle:

✅ **Credit Card Processing**: Apple/Google handle all payment processing  
✅ **Customer Billing**: Apple/Google charge customers directly  
✅ **Subscription Renewals**: Apple/Google automatically renew subscriptions  
✅ **Cancellation Handling**: Apple/Google handle cancellations  
✅ **Refund Processing**: Apple/Google handle refunds  
✅ **Payment Security**: PCI compliance, fraud protection  
✅ **Customer Support**: Apple/Google handle payment issues  

### What YOU Must Handle (If Using Direct IAP):

❌ **Receipt Validation**: Server-side verification of purchase receipts  
❌ **Subscription Status Tracking**: Check if subscription is active  
❌ **Webhook Setup**: Receive subscription events (renewals, cancellations)  
❌ **Database Management**: Store subscription status in your backend  
❌ **Analytics**: Track MRR, churn, LTV, etc.  
❌ **A/B Testing**: Test different pricing/offers  
❌ **Platform-Specific Code**: Different APIs for iOS vs Android  
❌ **Error Handling**: Handle network issues, edge cases  
❌ **Testing**: Sandbox testing, receipt validation testing  

---

## 2. How Qonversion Works (With Apple/Google)

### What Qonversion Does:

✅ **Unified API**: Single codebase for iOS and Android  
✅ **Receipt Validation**: Server-side validation handled automatically  
✅ **Subscription Status**: Real-time subscription status checks  
✅ **Webhooks**: Automatic webhook handling  
✅ **Analytics Dashboard**: Built-in analytics (MRR, churn, LTV)  
✅ **A/B Testing**: Built-in experimentation tools  
✅ **Database Management**: Qonversion stores subscription data  
✅ **Error Handling**: Built-in error handling and retries  

### What Apple/Google STILL Handle (Same as Direct):

✅ **Credit Card Processing**: Apple/Google still handle payments  
✅ **Customer Billing**: Apple/Google still charge customers  
✅ **Subscription Renewals**: Apple/Google still manage renewals  
✅ **Payment Security**: PCI compliance still handled by Apple/Google  

### What Qonversion Adds:

➕ **Abstraction Layer**: Wraps Apple/Google APIs into one API  
➕ **Management Dashboard**: Visual subscription management  
➕ **Analytics**: Subscription metrics and insights  
➕ **Developer Tools**: Easier testing, debugging  

---

## 3. Side-by-Side Comparison

### Option A: Apple/Google Direct Billing (Native IAP)

**Payment Flow:**
```
User → Your App → Apple/Google IAP SDK → Apple/Google Payment
                                                  ↓
                                    Apple/Google Charges Customer
                                                  ↓
                                    Apple/Google Sends Receipt → Your Server
                                                  ↓
                                    Your Server Validates Receipt
                                                  ↓
                                    Your Database Updates Subscription Status
                                                  ↓
                                    Your App Checks Subscription Status
```

**Who Charges Customer:** ✅ Apple/Google  
**Platform Fee:** 30% (15% after year 1)  
**Your Development Cost:** 6-12 weeks  
**Monthly Maintenance:** $1,000 - $2,000/month  
**Backend Required:** ✅ Yes (receipt validation, webhooks)  
**Subscription Management:** ❌ You build it  
**Analytics:** ❌ You build it  
**A/B Testing:** ❌ You build it  

---

### Option B: Qonversion (With Apple/Google Underneath)

**Payment Flow:**
```
User → Your App → Qonversion SDK → Apple/Google IAP SDK → Apple/Google Payment
                                                                    ↓
                                                      Apple/Google Charges Customer
                                                                    ↓
                                                      Apple/Google Sends Receipt → Qonversion
                                                                    ↓
                                                      Qonversion Validates Receipt
                                                                    ↓
                                                      Qonversion Updates Subscription Status
                                                                    ↓
                                                      Your App Checks Subscription Status (via Qonversion)
```

**Who Charges Customer:** ✅ Apple/Google (same as Option A)  
**Platform Fee:** 30% (15% after year 1) - **SAME**  
**Qonversion Fee:** 0% up to $10K MRR, then 0.6% above  
**Your Development Cost:** 3-4 days  
**Monthly Maintenance:** $0 (Qonversion handles it)  
**Backend Required:** ❌ No (optional for webhooks)  
**Subscription Management:** ✅ Qonversion handles it  
**Analytics:** ✅ Qonversion provides it  
**A/B Testing:** ✅ Qonversion provides it  

---

## 4. Detailed Comparison Table

| Aspect | Apple/Google Direct | Qonversion | Winner |
|--------|-------------------|------------|--------|
| **Who Charges Customer** | Apple/Google | Apple/Google (via Qonversion) | Tie - Same |
| **Platform Fee (30%)** | Yes | Yes | Tie - Same |
| **Development Time** | 6-12 weeks | 3-4 days | ✅ Qonversion |
| **Backend Required** | Yes | No (optional) | ✅ Qonversion |
| **Receipt Validation** | You build | Included | ✅ Qonversion |
| **Webhook Setup** | You build | Included | ✅ Qonversion |
| **Analytics Dashboard** | You build | Included | ✅ Qonversion |
| **A/B Testing** | You build | Included | ✅ Qonversion |
| **Subscription Management** | You build | Included | ✅ Qonversion |
| **Platform-Specific Code** | Yes (iOS + Android) | No (unified API) | ✅ Qonversion |
| **Monthly Maintenance** | $1,000 - $2,000 | $0 (up to $10K MRR) | ✅ Qonversion |
| **Additional Fees** | $0 | 0.6% above $10K MRR | ✅ Direct (if cost is priority) |
| **Time to Market** | 2-3 months | 3-4 days | ✅ Qonversion |
| **Support & Community** | Stack Overflow | Qonversion Support + Community | ✅ Qonversion |
| **Testing Complexity** | High | Low | ✅ Qonversion |
| **Risk of Errors** | High (you build it) | Low (battle-tested) | ✅ Qonversion |

---

## 5. Cost Comparison

### Apple/Google Direct Billing

**Development Cost:**
- Initial Development: $15,000 - $30,000 (6-12 weeks)
- Backend Infrastructure: $5,000 - $10,000
- Testing & QA: $5,000 - $10,000
- **Total Initial:** $25,000 - $50,000

**Ongoing Costs:**
- Backend Maintenance: $1,000 - $2,000/month
- Server Costs: $200 - $500/month
- Developer Time: $2,000 - $4,000/month (20-40 hours)
- **Total Monthly:** $3,200 - $6,500/month

**Year 1 Total:** $63,400 - $128,000

### Qonversion

**Development Cost:**
- Initial Development: $2,000 - $4,000 (3-4 days)
- Configuration: $500 - $1,000
- Testing & QA: $1,000 - $2,000
- **Total Initial:** $3,500 - $7,000

**Ongoing Costs:**
- Qonversion Fee: $0 (up to $10K MRR), then $6 per $1K MRR
- Monthly Maintenance: $0 (Qonversion handles it)
- **Total Monthly:** $0 - $240/month (at $50K MRR)

**Year 1 Total:** $3,500 - $9,880

**💰 Savings: $53,900 - $118,120 in Year 1**

---

## 6. Platform Fee Explanation

### ⚠️ CRITICAL: Platform Fees Are the SAME

**Both options pay 30% to Apple/Google:**

| Monthly Revenue | Platform Fee (30%) | Your Net (Direct) | Your Net (Qonversion) |
|----------------|-------------------|------------------|----------------------|
| $10,000 | $3,000 | $7,000 | $7,000 (Qonversion free) |
| $25,000 | $7,500 | $17,500 | $17,410 (Qonversion: $90) |
| $50,000 | $15,000 | $35,000 | $34,760 (Qonversion: $240) |
| $100,000 | $30,000 | $70,000 | $69,460 (Qonversion: $540) |

**Key Point:** Platform fees (30%) are **mandatory** and **identical** for both options.

**Qonversion fees are ADDITIONAL but much smaller:**
- $10K MRR: $0 Qonversion fee
- $25K MRR: $90 Qonversion fee (0.36% of revenue)
- $50K MRR: $240 Qonversion fee (0.48% of revenue)
- $100K MRR: $540 Qonversion fee (0.54% of revenue)

---

## 7. What You Get With Each Option

### Apple/Google Direct: What You Must Build

1. **Receipt Validation Server**
   - Validate Apple receipts with Apple's servers
   - Validate Google receipts with Google's servers
   - Handle network errors, retries, rate limiting
   - Store receipt data securely
   - **Complexity:** High (2-3 weeks)

2. **Subscription Status Database**
   - Store subscription status for each user
   - Handle subscription lifecycle (active, expired, canceled, grace period)
   - Sync across devices
   - Handle edge cases (family sharing, refunds, etc.)
   - **Complexity:** High (1-2 weeks)

3. **Webhook Infrastructure**
   - Set up webhook endpoints
   - Verify webhook signatures (security)
   - Handle subscription events (renewal, cancellation, expiration)
   - Update database in real-time
   - **Complexity:** Medium (1 week)

4. **Analytics System**
   - Track MRR, churn, LTV, cohorts
   - Build dashboards
   - Generate reports
   - **Complexity:** Medium (1-2 weeks)

5. **A/B Testing System**
   - Build experimentation framework
   - Test different prices/offers
   - Track conversion rates
   - **Complexity:** Medium (1 week)

6. **Error Handling**
   - Handle network failures
   - Handle receipt validation errors
   - Handle subscription edge cases
   - **Complexity:** High (ongoing)

**Total Development Time:** 6-12 weeks  
**Ongoing Maintenance:** 20-40 hours/month  

---

### Qonversion: What You Get Included

1. **Receipt Validation Server** ✅ Included
2. **Subscription Status Database** ✅ Included (Qonversion stores it)
3. **Webhook Infrastructure** ✅ Included
4. **Analytics System** ✅ Included (Dashboard)
5. **A/B Testing System** ✅ Included
6. **Error Handling** ✅ Included (Built-in)

**Total Development Time:** 3-4 days  
**Ongoing Maintenance:** 0 hours/month (Qonversion handles it)  

---

## 8. Real-World Example: Subscription Purchase Flow

### Apple/Google Direct Flow:

```
1. User taps "Subscribe" in app
2. App calls Apple IAP SDK (iOS) or Google Billing SDK (Android)
3. User authenticates with Apple/Google
4. Apple/Google shows payment confirmation
5. User confirms payment
6. Apple/Google charges customer's credit card (30% fee to them)
7. Apple/Google sends receipt to your app
8. Your app sends receipt to YOUR server
9. YOUR server validates receipt with Apple/Google servers
10. YOUR server stores subscription status in YOUR database
11. YOUR server sends webhook to your app (optional)
12. Your app checks subscription status from YOUR database
13. App enables premium features
```

**Complexity:** 13 steps, backend required, you build steps 8-12

---

### Qonversion Flow:

```
1. User taps "Subscribe" in app
2. App calls Qonversion SDK (same for iOS and Android)
3. User authenticates with Apple/Google (via Qonversion)
4. Apple/Google shows payment confirmation
5. User confirms payment
6. Apple/Google charges customer's credit card (30% fee to them)
7. Apple/Google sends receipt to Qonversion
8. Qonversion validates receipt automatically
9. Qonversion stores subscription status in their database
10. Qonversion sends webhook to your server (optional)
11. Your app checks subscription status from Qonversion SDK
12. App enables premium features
```

**Complexity:** 12 steps, no backend required (optional for webhooks), Qonversion handles steps 7-9

---

## 9. When to Use Each Option

### Use Apple/Google Direct If:

✅ **You have a dedicated backend team**  
✅ **You want zero third-party fees** (except 30% platform fee)  
✅ **You have 2-3 months development time**  
✅ **You need complete control over subscription logic**  
✅ **You have ongoing developer resources** ($3K-6K/month)  
✅ **You're building a large-scale app** (millions of users)  

### Use Qonversion If:

✅ **You want fast time to market** (3-4 days vs 2-3 months)  
✅ **You don't have a backend team**  
✅ **You want built-in analytics** (MRR, churn, LTV)  
✅ **You want A/B testing** out of the box  
✅ **You want unified iOS/Android code**  
✅ **You want lower upfront cost** ($3.5K vs $25K-50K)  
✅ **You want zero maintenance** (Qonversion handles it)  
✅ **You're a startup or small team** (most TrueScan use case)  

---

## 10. Additional Considerations

### A. Can You Skip Apple/Google for Payments?

**❌ NO - This is NOT an option**

**Platform Requirements:**
- Apple App Store: **MANDATORY** - Must use Apple IAP for subscriptions
- Google Play Store: **MANDATORY** - Must use Google Play Billing for subscriptions

**If you try to use Stripe/PayPal directly:**
- ❌ App will be rejected from App Store
- ❌ App will be rejected from Play Store
- ❌ Violates platform policies
- ❌ Can't publish app

**Exception:** Physical goods or services consumed outside the app (food delivery, subscription boxes) can use external payment processors.

**For digital subscriptions (premium app features):**
- ✅ Must use Apple IAP (iOS)
- ✅ Must use Google Play Billing (Android)
- ✅ 30% platform fee is mandatory

---

### B. Platform Fee Breakdown

**Both options pay 30% to platforms:**

```
Customer pays: $4.99/month
Platform fee (30%): $1.50/month
Your net: $3.49/month (Direct)
Your net: $3.49/month (Qonversion - free tier)
            or
Your net: $3.45/month (Qonversion at scale - 0.6% fee)
```

**Key Insight:** Platform fee is the largest cost ($1.50/month) and is **identical for both options**.

**Qonversion fee is tiny** compared to platform fee:
- Platform fee: $1.50/month (30%)
- Qonversion fee: $0.03/month at $50K MRR (0.6% = $0.03)

---

### C. Total Cost of Ownership (3 Years)

### Scenario: App with $25K MRR

**Apple/Google Direct:**
- Year 1: $63,400 (development + maintenance)
- Year 2: $38,400 (maintenance only)
- Year 3: $38,400 (maintenance only)
- **Total 3 Years:** $140,200

**Qonversion:**
- Year 1: $4,500 (development + $90/month fees)
- Year 2: $1,080 ($90/month fees)
- Year 3: $1,080 ($90/month fees)
- **Total 3 Years:** $6,660

**💰 3-Year Savings: $133,540**

---

### D. Risk Comparison

**Apple/Google Direct:**
- ⚠️ High risk of bugs in your code
- ⚠️ High maintenance burden
- ⚠️ Platform API changes require updates
- ⚠️ Receipt validation errors
- ⚠️ Subscription status sync issues

**Qonversion:**
- ✅ Low risk (battle-tested platform)
- ✅ Qonversion handles platform changes
- ✅ Automatic receipt validation
- ✅ Subscription status always in sync
- ⚠️ Vendor dependency (can migrate if needed)

---

### E. Scalability Comparison

**Apple/Google Direct:**
- ✅ Unlimited scale (you control infrastructure)
- ❌ Requires scaling your backend
- ❌ Higher costs at scale (servers, maintenance)

**Qonversion:**
- ✅ Handles scale automatically
- ✅ No backend infrastructure needed
- ✅ Costs scale with revenue (0.6% fee)

---

## 11. Final Recommendation

### For TrueScan App: **Use Qonversion**

**Why:**

1. **Same Payment Flow:** Apple/Google still charge customers directly (same as direct IAP)
2. **Same Platform Fee:** 30% platform fee is identical (mandatory)
3. **Lower Total Cost:** $6,660 vs $140,200 over 3 years (95% savings)
4. **Faster Time to Market:** 3-4 days vs 2-3 months
5. **No Backend Required:** Save $3K-6K/month on maintenance
6. **Built-in Features:** Analytics, A/B testing included
7. **Lower Risk:** Battle-tested platform vs building from scratch

**Cost Breakdown at $25K MRR:**
- Platform Fee (30%): $7,500/month (both options)
- Your Net Revenue: $17,500/month
- Qonversion Fee: $90/month (0.6% of your net)
- **Your Final Net: $17,410/month**

**vs. Direct IAP:**
- Platform Fee (30%): $7,500/month
- Your Net Revenue: $17,500/month
- Your Backend Costs: $3,200/month (maintenance)
- **Your Final Net: $14,300/month**

**💰 Qonversion saves $3,110/month at $25K MRR**

---

## 12. Conclusion

**Key Takeaway:**

**Qonversion DOES NOT replace Apple/Google billing - it uses them!**

**Apple/Google still:**
- ✅ Charge customers directly
- ✅ Collect 30% platform fee
- ✅ Handle payment processing
- ✅ Manage subscriptions

**Qonversion adds:**
- ✅ Unified API (iOS + Android)
- ✅ Receipt validation (automatic)
- ✅ Subscription management (included)
- ✅ Analytics dashboard (built-in)
- ✅ A/B testing (included)
- ✅ Lower development cost (95% savings)

**Recommendation:** Use Qonversion unless you have a dedicated backend team and 2-3 months development time. The cost savings ($133K over 3 years) and time savings (3-4 days vs 2-3 months) far outweigh the 0.6% fee at scale.

---

**Document Version:** 1.0  
**Date:** 2025-01-XX  
**Prepared For:** TrueScan Premium Subscription Analysis

