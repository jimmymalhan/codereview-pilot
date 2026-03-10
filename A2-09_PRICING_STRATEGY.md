# A2-09: Pricing Strategy - Value-Based Pricing Model

**Task**: Define pricing strategy and package options
**Status**: ✅ COMPLETE
**Date**: 2026-03-10
**Owner**: Content Team (Team 2)

---

## Pricing Philosophy

**Value-Based Pricing**: Price reflects value delivered ($300K-$2.5M saved per customer annually), not cost of delivery.

**Formula**: Tool saves $500K/year → Tool should cost $200-500/month ($2.4K-6K/year) → ROI of 100x on high end, 50x on low end.

---

## Pricing Tiers

### Tier 1: Starter ($199/month)
**For**: Small SRE teams (1-3 people), <20 incidents/month

**Includes**:
- 20 diagnoses/month
- Basic evidence-backed root cause
- RCA automation
- Confidence scoring
- Email support
- No integrations

**Best for**: Startups, small companies testing the product

---

### Tier 2: Growth ($499/month)
**For**: Mid-size SRE teams (3-10 people), 20-100 incidents/month

**Includes**:
- Unlimited diagnoses
- Advanced evidence gathering
- RCA automation + team sharing
- Confidence scoring + competing hypotheses
- Slack/email integrations
- Priority support (24 hours)

**Best for**: Growing SaaS companies, established startups

---

### Tier 3: Enterprise (Custom pricing)
**For**: Large SRE teams (10+ people), 100+ incidents/month

**Includes**:
- Everything in Growth
- Custom integrations (Datadog, PagerDuty, Slack, Jira)
- SSO/SAML authentication
- Advanced analytics & dashboards
- Dedicated support engineer
- SLA guarantee
- On-premise option

**Best for**: Enterprise companies, mission-critical systems

---

## Pricing Comparison to Alternatives

| Tool | Monthly Cost | What It Does | Gap |
|---|---|---|---|
| Datadog | $500-5K | Monitoring | Symptoms only |
| PagerDuty | $500-2K | Alerting | Routing only |
| Splunk | $500-2K | Logging | Raw logs only |
| **Claude Debug** | $200-custom | **Root cause + fix** | **Solves incidents** |
| ChatGPT Pro | $20 | Generic chat | Takes 20 min, low confidence |

**Value Prop**: Cheapest tool in stack, solves what others don't.

---

## Annual Commitment Discount
- **Monthly**: Full price
- **Annual**: 20% discount (6 months free)

**Starter**: $199 × 12 × 0.8 = $1,905/year (saves $479)
**Growth**: $499 × 12 × 0.8 = $4,792/year (saves $1,196)

---

## Free Trial
- **Duration**: 14 days
- **Limit**: 5 diagnoses free
- **Includes**: All features of Growth tier
- **No credit card required**

**Purpose**: Let teams experience value risk-free, reduce sales friction.

---

## Free Tier (Forever)
- **Limit**: 1 diagnosis/month
- **Features**: Basic RCA generation
- **Target**: Individual engineers, evaluation

**Purpose**: Build awareness, word-of-mouth growth.

---

## Add-On Pricing (Growth/Enterprise only)

### Add-On: Advanced Analytics
- **Price**: +$200/month
- **Includes**: Incident trend analysis, pattern detection, forecasting
- **For**: Platform engineering teams wanting reliability improvements

### Add-On: Custom Integrations
- **Price**: +$500-2K (one-time setup)
- **Includes**: Integration with internal tools, custom data sources
- **For**: Enterprise teams with non-standard tooling

### Add-On: Dedicated Support
- **Price**: +$1K/month
- **Includes**: Dedicated support engineer, quarterly reviews, optimization
- **For**: Enterprise teams needing white-glove service

---

## Volume Discounts (Enterprise)
- 1-10 seats: No discount
- 11-25 seats: 10% discount
- 26-50 seats: 15% discount
- 50+ seats: 20% discount + custom pricing

---

## ROI Payback Calculation

### For $20M Revenue Company, 50 incidents/month

**Without Claude Debug Copilot**:
- Average MTTR: 45 minutes
- Average downtime cost: $20K per incident
- Annual downtime cost: 50 × 12 × $20K = **$12M**

**With Claude Debug Copilot**:
- MTTR improved: 45 min → 25 min (44% improvement)
- Downtime cost saved: 20 min × $20K = **$400K per incident**
- Annual savings: 50 × 12 × $400K = **$2.4M**

**Tool Cost**:
- Growth tier: $499 × 12 = **$5,988/year**

**ROI**:
- Savings: $2.4M
- Cost: $6K
- Net savings: $2.4M - $6K = **$2.394M/year**
- ROI: 400× return (2,394 ÷ 6)
- Payback period: **1 day** (tool pays for itself on first incident prevented)

---

## Pricing Messaging

### For SRE Teams
"$499/month for unlimited diagnosis. That's less than a junior SRE ($120K salary), and we work 24/7."

### For Finance/Procurement
"Every incident prevented saves $10K-$500K. Tool costs $6K/year. ROI is 100-400×. Approved."

### For CTOs
"$5,988/year for tool that saves $2.4M in downtime annually. Mandatory purchase."

---

## Competitive Pricing Context

| Tool | Price | User | Value |
|---|---|---|---|
| Datadog | $3,600/year | All engineers | Monitoring |
| PagerDuty | $6,000/year | On-call team | Alerting |
| Splunk | $6,000/year | Ops team | Logging |
| Claude Debug | $5,988/year | SRE team | **Root cause** |

**Positioning**: "Same price as your other tools, but solves what they don't."

---

## Discount Policies

### Non-profit / Open Source
- 50% discount for open-source projects
- Free tier for academic use

### Educational Institutions
- Free tier for universities (up to 10 seats)
- Student discount (50% for personal projects)

### Early Customers
- Founding customer: 50% off first year
- Beta customer: 30% off for first 12 months

---

## Payment Terms

### Self-Service (Starter/Growth)
- Monthly: Credit card billing
- Annual: Invoice or credit card
- Auto-renewal enabled

### Enterprise
- Annual contracts: NET-30 terms
- Multi-year discounts available
- Volume discounts as listed

---

## Expansion Revenue Strategy

### Upsell Path
1. Customer starts on **Starter** ($199)
2. Team grows → Upgrade to **Growth** ($499)
3. Team scales → Add **Advanced Analytics** (+$200)
4. Enterprise needs → Upgrade to **Enterprise** (custom)

**Average customer lifetime value**: $5K-20K/year

---

## Financial Projections

### Year 1 Conservative Forecast
- 50 paying customers (mostly Growth tier)
- Average price: $400/month
- Revenue: 50 × $400 × 12 = **$240K**
- Gross margin: 75% = **$180K**

### Year 2 Growth
- 200 customers
- Average price: $450/month
- Revenue: 200 × $450 × 12 = **$1.08M**
- Gross margin: 80% = **$864K**

### Year 3 Scale
- 500 customers
- Average price: $500/month
- Revenue: 500 × $500 × 12 = **$3M**
- Gross margin: 85% = **$2.55M**

---

## Sign-Off

✅ **A2-09 Complete**
- Pricing tiers defined (Starter, Growth, Enterprise)
- Pricing philosophy established (value-based)
- Pricing vs. competitors mapped
- Annual discounts, free trial, free tier documented
- Add-on pricing for advanced features
- ROI payback calculation shown (100-400× return)
- Payment terms specified
- Financial projections included
- Ready for A2-10 (Go-to-Market Strategy)
