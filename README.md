# LCM
Liberty Cargo Movers Logistics Platform is designed to bring transparency, efficiency, accountability, and professionalism to international cargo operations between the United States, Ghana, and other supported destinations.

You are a senior full-stack software engineer and product architect. Build a logistics management platform for Liberty Cargo Movers to manage a 6-month outsourced logistics arrangement with SEAL Logistics.

PROJECT NAME:
Liberty Cargo Movers Logistics Platform

BUSINESS CONTEXT:
Liberty Cargo Movers has developed a logistics app/platform. For the first 6 months, Liberty Cargo Movers will outsource cargo operations to SEAL Logistics. SEAL Logistics has a physical presence in Minnesota, USA, and will handle cargo operations to Ghana and from Ghana. During the same 6-month period, Liberty will gradually onboard other countries that SEAL already ships to and from.

SEAL Logistics will determine the pricing for the period. Liberty’s platform must therefore allow SEAL’s approved pricing to be uploaded, managed, used for invoices, and tracked by effective dates. Liberty will manage customer onboarding, customer communication, platform records, shipment tracking, reporting, and business expansion.

The platform must protect Liberty’s ownership of customer records, platform data, shipment history, and business intelligence, while allowing SEAL to perform operational tasks through controlled access.

CORE OBJECTIVE:
Build a professional logistics platform that allows Liberty Cargo Movers to:
1. Register customers.
2. Create shipments.
3. Apply SEAL’s approved pricing automatically.
4. Generate invoices.
5. Track packages from intake to delivery.
6. Allow SEAL to manage assigned operational tasks.
7. Generate shipment manifests.
8. Manage country routes.
9. Record payments.
10. Track Liberty’s commission or platform fee.
11. Monitor performance during the 6-month outsourcing period.
12. Onboard additional countries SEAL ships to and from.

TECH STACK:
Use a modern, scalable stack. Preferred:
- Frontend: React / Next.js
- Backend: Firebase / Firestore
- Authentication: Firebase Auth or secure custom auth
- Storage: Firebase Storage for package photos and documents
- Hosting: Firebase Hosting
- Database: Firestore
- Notifications: Email, SMS-ready structure, and WhatsApp-ready message templates
- Mobile-friendly PWA design

USER ROLES:
Create a role-based access control system.

1. Liberty Super Admin
Can:
- Manage all users.
- Manage SEAL account access.
- Approve rates.
- Approve country routes.
- View all customers.
- View all shipments.
- View all payments.
- View all reports.
- Lock completed shipment records.
- Export reports.
- Manage commission/platform fee settings.

2. Liberty Admin / Operations
Can:
- Register customers.
- Create shipments.
- Update shipment status.
- Generate invoices.
- Upload documents.
- View assigned reports.
- Communicate with customers.
- Prepare Ghana-side delivery records.

3. SEAL Admin
Can:
- View shipments assigned to SEAL.
- Add package intake information.
- Upload package photos.
- Enter weight and dimensions.
- Update package status.
- Generate manifests.
- Upload delivery proof.
- Provide operational updates.
Cannot:
- Delete shipment records.
- Change customer ownership.
- Export all Liberty customer data.
- Edit platform-wide settings.
- Change rates without approval.
- Access Liberty internal financial records beyond assigned operational invoices.

4. SEAL Staff
Can:
- Receive packages.
- Upload package photos.
- Enter weight.
- Enter dimensions.
- Update package intake status.
- View only assigned shipment batches.

5. Finance User
Can:
- View invoices.
- Mark payments.
- Record SEAL invoices.
- Record Liberty commission.
- Generate reconciliation reports.

6. Customer
Can:
- Register or be registered by admin.
- View shipment status.
- View invoices.
- Download receipts.
- Receive tracking updates.

MAIN MODULES:

1. Dashboard
Create separate dashboards for Liberty Admin, SEAL Admin, Finance, and Customer.

Liberty dashboard should show:
- Total shipments.
- Active shipments.
- Delivered shipments.
- Pending payments.
- Revenue.
- Liberty commission/platform fee.
- SEAL operational charges.
- Countries active.
- Complaints.
- Delayed shipments.
- 6-month pilot performance.

SEAL dashboard should show:
- Packages awaiting intake.
- Packages received.
- Packages ready for dispatch.
- Active manifests.
- Shipments in transit.
- Shipments delivered.
- Assigned routes.
- Outstanding operational updates.

2. Customer Management
Create a customer database with:
- Full name.
- Phone number.
- Email.
- Country.
- Address.
- Sender details.
- Receiver details.
- ID verification field where needed.
- Customer type: individual, trader, student, church, institution, business, online seller.
- Customer source: Liberty, SEAL, referral, walk-in, online, campaign.
- Notes.
- Shipment history.

3. SEAL Rate Card Module
This is very important. SEAL controls pricing for the first 6 months.

Create a rate card system with:
- Pricing name.
- Route.
- Country.
- Pricing type: item-based, weight-based, service fee, special handling.
- Currency.
- Effective date.
- Expiry/review date.
- Status: draft, pending approval, active, expired.
- Uploaded by.
- Approved by.
- Approval date.
- Audit log of changes.

Initial SEAL price list to enter:

Item-based pricing:
- New iPhone: $85
- Used iPhone: $55
- Other New Phone: $75
- Other Used Phone: $50
- New iPad: $85
- Used iPad: $50
- New Tablet: $75
- Used Tablet: $45
- New Mac Laptop: $100
- Used Mac Laptop: $85
- Other New Laptop: $85
- Other Used Laptop: $70
- New Apple Watch: $50
- Used Apple Watch: $35
- New Apple AirPods: $50
- Used Apple AirPods: $35

Weight-based pricing:
- Liberia / Ghana: $11.57 per lb
- Nigeria: $6.50 per lb
- Cameroon / Kenya / South Africa: $15 per lb

Service fee:
- $30 service fee.
- Service fee is included on all invoices generated except Nigeria.
- Build this as a configurable rule so admin can turn service fee on or off per route.

Important:
The system must not allow ordinary users to edit active SEAL prices. All rate changes must require approval and must be logged.

4. Shipment Creation Module
Shipment record should include:
- Tracking number generated automatically.
- Customer details.
- Sender details.
- Receiver details.
- Origin country.
- Destination country.
- Route.
- Package category.
- Item type.
- New or used status.
- Weight.
- Dimensions.
- Volumetric weight field.
- Declared value.
- Package description.
- Package condition.
- Photos.
- Payment status.
- Current status.
- SEAL handling status.
- Liberty handling status.
- Created by.
- Assigned SEAL office.
- Expected delivery date.
- Actual delivery date.

Shipment statuses:
- Draft
- Awaiting package
- Package received by SEAL
- Package inspected
- Invoice generated
- Payment pending
- Payment confirmed
- Added to manifest
- Ready for dispatch
- Dispatched
- In transit
- Arrived in Ghana
- Customs/clearing
- Ready for pickup
- Out for delivery
- Delivered
- Issue reported
- Cancelled

5. Invoice Module
Invoices must be generated using SEAL’s approved rate card.

Invoice should show:
- Invoice number.
- Customer name.
- Tracking number.
- Route.
- Item charge or weight charge.
- Service fee where applicable.
- Additional approved charges.
- Total amount.
- Payment status.
- Date generated.
- Rate card effective date.
- Generated by.
- Payment instructions.

The invoice should clearly show that prices are based on SEAL’s approved rate card for the outsourcing period.

6. Package Intake Module for SEAL
When SEAL receives a package, SEAL staff must:
- Search or create customer shipment.
- Confirm customer name.
- Upload package photos.
- Record weight.
- Record dimensions.
- Record package condition.
- Select package type.
- Confirm declared contents.
- Mark package as received.
- Generate or confirm tracking number.
- Add package to batch or manifest.

The system should prevent dispatch if:
- No package photo exists.
- No weight is entered.
- No customer record exists.
- No invoice exists.
- Payment status is not confirmed, unless admin overrides with reason.
- Package is not assigned to a manifest.

7. Manifest Module
Create a manifest system for shipment batches.

Manifest should include:
- Manifest number.
- Route.
- Origin.
- Destination.
- SEAL office.
- Dispatch date.
- Expected arrival date.
- Package list.
- Tracking numbers.
- Customer names.
- Package descriptions.
- Weights.
- Declared values.
- Payment status.
- Total packages.
- Total weight.
- Prepared by.
- Approved by Liberty.
- Confirmed by SEAL.

No package should move without being added to a manifest.

8. Country Route Onboarding Module
During the 6-month period, Liberty will onboard other countries SEAL ships to and from.

Create a country route setup form with:
- Country name.
- Route direction: USA to country, country to USA, Ghana to country, country to Ghana.
- Pricing type.
- Rate.
- Currency.
- Transit time.
- Prohibited items.
- Required documents.
- Customs process.
- Delivery coverage.
- SEAL confirmation.
- Liberty approval.
- Route status: draft, testing, active, suspended.

Suggested initial countries:
- Ghana
- Liberia
- Nigeria
- Cameroon
- Kenya
- South Africa

Do not make countries active until Liberty approves them.

9. Commission / Platform Fee Module
Since SEAL determines pricing, Liberty should earn through commission or platform fee.

Create settings for:
- Liberty commission percentage.
- Fixed platform fee per shipment.
- Monthly platform support fee.
- Commission based on customer source.
- Commission based on shipment route.
- Commission based on item category.
- Commission report.

Customer source rules:
- Liberty-sourced customer: Liberty commission applies.
- SEAL-sourced customer: commission can be lower or set to zero.
- Platform-only shipment: platform fee applies.

10. Payment and Reconciliation Module
Track:
- Customer invoice amount.
- Amount paid by customer.
- SEAL charge.
- Service fee.
- Liberty commission.
- Platform fee.
- Balance due.
- Payment date.
- Payment method.
- Reconciliation status.

Weekly reconciliation report should show:
- Total shipments.
- Total customer payments.
- Total SEAL charges.
- Total Liberty commission.
- Pending payments.
- Disputed invoices.
- Completed payments.

11. Claims and Complaints Module
Customers and staff should be able to log:
- Lost package.
- Damaged package.
- Delayed shipment.
- Wrong item.
- Wrong destination.
- Payment dispute.
- Customs issue.

Each complaint should have:
- Ticket number.
- Customer.
- Shipment tracking number.
- Issue type.
- Description.
- Photos or documents.
- Assigned officer.
- Status.
- Resolution notes.
- Date closed.

12. Notifications
Build notification templates for:
- Package received.
- Invoice generated.
- Payment confirmed.
- Package added to manifest.
- Shipment dispatched.
- Shipment in transit.
- Shipment arrived.
- Ready for pickup.
- Out for delivery.
- Delivered.
- Delay notice.
- Complaint update.

The system should support email notifications now and be ready for SMS/WhatsApp integration later.

13. Audit Log
Every important action must be logged:
- Rate changes.
- Shipment edits.
- Payment updates.
- Status changes.
- Manifest approvals.
- User logins.
- Deleted or cancelled records.
- Admin overrides.

Audit log should include:
- User.
- Action.
- Old value.
- New value.
- Date and time.
- Reason where required.

14. Six-Month Outsourcing Tracker
Create a dedicated section to track the 6-month pilot.

Fields:
- Start date.
- End date.
- Active routes.
- Total shipments.
- Delivery performance.
- Revenue.
- Liberty earnings.
- SEAL operational performance.
- Customer complaints.
- Delays.
- Countries onboarded.
- Recommendation: continue, renegotiate, expand, terminate.

15. Security Requirements
Implement:
- Role-based permissions.
- Firestore security rules.
- No public access to customer data.
- Restricted file access.
- Admin-only rate updates.
- Audit logs.
- Secure authentication.
- Password reset.
- Optional two-factor authentication later.
- Data export controlled by Liberty Super Admin only.

16. UI/UX Requirements
Design should be:
- Clean.
- Professional.
- Mobile-friendly.
- Suitable for logistics business.
- Easy for office staff to use.
- Dashboard-driven.
- Minimal clutter.
- Clear shipment status flow.
- Use cards, tables, status badges, and filters.

Use these main navigation items:
- Dashboard
- Customers
- Shipments
- Package Intake
- Invoices
- Payments
- Manifests
- Rate Cards
- Country Routes
- SEAL Operations
- Reports
- Complaints
- Settings
- Audit Logs

17. Important Business Rules
- SEAL determines pricing during the first 6 months.
- Liberty owns the platform and customer records.
- SEAL handles cargo operations to Ghana and from Ghana.
- All shipments must be entered into the Liberty platform.
- No shipment should move without a tracking number.
- No shipment should move without package photo and weight.
- No package should be dispatched without manifest approval.
- Other countries must be onboarded gradually and approved by Liberty.
- Rate changes must be approved and logged.
- Commission/platform fee must be calculated automatically.
- The platform must support both item-based and weight-based pricing.
- Service fee must be configurable by route.

18. Deliverables
Build:
- Full database schema.
- Firestore collections.
- Authentication and roles.
- Admin dashboard.
- SEAL operations dashboard.
- Customer management.
- Shipment management.
- Rate card module.
- Invoice generation.
- Manifest generation.
- Country onboarding module.
- Payment and reconciliation module.
- Reports.
- Complaints module.
- Audit log.
- Responsive UI.
- Deployment-ready Firebase configuration.

19. Firestore Collection Suggestions
Use collections such as:
- users
- roles
- customers
- shipments
- packages
- rateCards
- invoices
- payments
- manifests
- countryRoutes
- commissions
- complaints
- notifications
- auditLogs
- settings
- pilotTracker

20. Final Instruction
Build this as a serious production-ready logistics platform for Liberty Cargo Movers. The system must support the 6-month outsourcing arrangement with SEAL Logistics, allow SEAL to determine and manage pricing through approved rate cards, allow Liberty to control the platform and customer records, and support the gradual onboarding of other countries SEAL ships to and from.
