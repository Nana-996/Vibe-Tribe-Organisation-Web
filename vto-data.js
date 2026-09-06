/**
 * VIBE TRIBE ORGANISATION (VTO) - CENTRAL DATA ENGINE
 * Handles dynamic services, lead bookings CRM, site settings, and portfolio data.
 * Features persistent LocalStorage, automated fallback seeding, and backup export/import.
 */

(function(global) {
  'use strict';

  const STORAGE_KEYS = {
    SERVICES: 'vto_services_data_v2',
    BOOKINGS: 'vto_bookings_crm_v2',
    SETTINGS: 'vto_site_settings_v2',
    PORTFOLIO: 'vto_portfolio_data_v2',
    DATA_BUNDLES: 'vto_data_bundles_v2',
    ADMIN_AUTH: 'vto_admin_auth_v2'
  };

  // Preset SVG Icon Library for versatile service creation
  const ICON_LIBRARY = {
    laptop: `<svg class="vto-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
    devices: `<svg class="vto-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`,
    design: `<svg class="vto-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.03442 19.1758 5.14375 19.4184 5.14375 19.6791C5.14375 20.9609 6.18285 22 7.46467 22H12Z"></path><circle cx="7.5" cy="10.5" r="1.5" fill="currentColor"></circle><circle cx="11.5" cy="7.5" r="1.5" fill="currentColor"></circle><circle cx="16.5" cy="9.5" r="1.5" fill="currentColor"></circle><circle cx="15.5" cy="14.5" r="1.5" fill="currentColor"></circle></svg>`,
    web: `<svg class="vto-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
    cv: `<svg class="vto-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    graduation: `<svg class="vto-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path></svg>`,
    car: `<svg class="vto-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 3c-.4.8-.1 1.7.5 2.2.4.3.9.5 1.4.5h1"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>`,
    cart: `<svg class="vto-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`,
    shield: `<svg class="vto-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 11 11 13 15 9"></polyline></svg>`,
    music: `<svg class="vto-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`,
    briefcase: `<svg class="vto-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
    tool: `<svg class="vto-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`,
    key: `<svg class="vto-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-1.5 1.5L14 9l-3 3-2-2-3 3 2 2-3 3-1.5-1.5L2 18v4h4l1.5-1.5-1.5-1.5 3-3 2 2 3-3-2-2 3.5-3.5L20 4l2-2z"></path><circle cx="17.5" cy="6.5" r="1.5"></circle></svg>`,
    dollar: `<svg class="vto-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
    star: `<svg class="vto-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    signal: `<svg class="vto-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h.01"></path><path d="M7 20v-4"></path><path d="M12 20v-8"></path><path d="M17 20V8"></path><path d="M22 4v16"></path></svg>`,
    wifi: `<svg class="vto-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`
  };

  // Default Seed Services Data
  const DEFAULT_SERVICES = [
    {
      id: 'laptop',
      title: 'Laptop Software Services',
      shortName: 'Laptops',
      category: 'Tech & Diagnostics',
      badge: 'Core Service',
      iconKey: 'laptop',
      price: 'Affordable Rates',
      summary: 'Is your machine running slow, crashing, or infected with malware? We offer premium software diagnostic, optimization, and installation services to restore peak productivity.',
      bullets: [
        'Windows Installation / Reinstallation',
        'Laptop Speed Optimization & Temp Cleaner',
        'Virus & Malware Deep Cleanup',
        'Pro Apps Setup (Office, SPSS, Creative Cloud)',
        'System Drivers Auditing & Refreshes',
        'Data Recovery & Safe Local Backups'
      ],
      customFields: [
        { label: 'Laptop Brand & Model', name: 'laptop_model', type: 'text', placeholder: 'e.g. HP Pavilion 15, Dell Inspiron', required: false },
        { label: 'Required Service Option', name: 'service_type', type: 'select', options: ['Windows Installation / Reinstallation', 'Speed Optimization & Cleanup', 'Virus & Malware Deep Clean', 'Professional Applications Setup', 'System Drivers & Updates', 'Data Backup & Recovery', 'Password / Account Unlock', 'Other / Diagnostics'], required: true },
        { label: 'Describe the Symptoms / Requirements', name: 'problem_description', type: 'textarea', placeholder: 'Specify if there are specific errors, blue screens, or specific apps needed.', required: true }
      ],
      isCore: true,
      active: true,
      featured: true,
      order: 1,
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'devices',
      title: 'Buy, Sell & Swap Devices',
      shortName: 'Buy & Sell',
      category: 'Gadgets & Hardware',
      badge: 'Guaranteed Authentic',
      iconKey: 'devices',
      price: 'Best Market Valuation',
      summary: 'Looking to upgrade your phone, tablet, or laptop? We facilitate reliable sales, purchase of used gear, and direct trade-in swaps. Receipts provided, screen protectors included.',
      bullets: [
        'Certified New & Used Smart Devices',
        'Transparent Value Evaluation for Sellers',
        'Hassle-Free Trade-In / Swap Options',
        'Premium Accessories & Screen Protection',
        'Safe Delivery Across Greater Accra'
      ],
      customFields: [
        { label: 'Transaction Intent', name: 'action_type', type: 'select', options: ['Buy a Device', 'Sell My Device', 'Swap / Trade-In', 'Device Repairs', 'Purchase Accessory', 'Phone Unlocking'], required: true },
        { label: 'Device Category', name: 'device_type', type: 'select', options: ['Smartphone', 'Laptop', 'Tablet', 'Smartwatch', 'Earbuds / Audio', 'Other'], required: false },
        { label: 'Device Name / Spec / Desired Model', name: 'device_model', type: 'text', placeholder: 'e.g. iPhone 14 Pro Max 256GB, MacBook Air M1', required: true },
        { label: 'Target Budget / Valuation', name: 'budget', type: 'text', placeholder: 'e.g. describe your budget range', required: false },
        { label: 'Current Physical Grade', name: 'condition', type: 'select', options: ['N/A - I am purchasing', 'Brand New Sealed', 'Grade A (Like new)', 'Grade B (Minor wear)', 'Grade C (Scratched/Faults)'], required: false },
        { label: 'Additional Notes', name: 'details', type: 'textarea', placeholder: 'Specify battery health, colors, box & original charger inclusions, etc.', required: false }
      ],
      isCore: true,
      active: true,
      featured: true,
      order: 2,
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'design',
      title: 'Graphic Design & Visual Branding',
      shortName: 'Graphics',
      category: 'Creative & Branding',
      badge: 'Elite Visuals',
      iconKey: 'design',
      price: 'Student Friendly',
      summary: 'Stand out with bold, memorable designs that respect heritage and grab attention. From event flyers and professional corporate logos to comprehensive digital branding kits.',
      bullets: [
        'Impactful Event Flyers & Posters',
        'Minimalist & Sophisticated Logos',
        'Cohesive Brand Kits & Color Systems',
        'Social Media Assets & Post Templates',
        'Event Brochures & Printed Collateral'
      ],
      customFields: [
        { label: 'Design Option', name: 'design_type', type: 'select', options: ['Flyer / Poster', 'Corporate Logo Design', 'Branding Identity Kit', 'Social Media Pack', 'Business Card Suite', 'Banner / Signage', 'Brochure / Event program', 'Custom Request'], required: true },
        { label: 'Required Deadline', name: 'deadline', type: 'date', required: false },
        { label: 'Purpose / Event / Company Name', name: 'event_name', type: 'text', placeholder: 'e.g. Corporate rebranding, Club flyers, Product Launch', required: false },
        { label: 'Visual Palette / Colors Preferred', name: 'colors', type: 'text', placeholder: 'e.g. Royal violet, gold gradient, clean white', required: false },
        { label: 'Raw Copy / Text Content to Include', name: 'content_text', type: 'textarea', placeholder: 'Paste titles, dates, locations, phone numbers, and speaker details.', required: true },
        { label: 'Reference Designs or Concept Links', name: 'inspiration', type: 'textarea', placeholder: 'Describe the aesthetic direction (e.g. minimal, afro-centric, corporate luxury)', required: false }
      ],
      isCore: true,
      active: true,
      featured: true,
      order: 3,
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'web',
      title: 'Website Design & Development',
      shortName: 'Websites',
      category: 'Engineering & Code',
      badge: 'High Conversion',
      iconKey: 'web',
      price: 'Custom Quotes',
      summary: 'Establish a world-class digital presence. We build lightning-fast, fully responsive, and SEO-optimized websites built for conversions, portfolios, or online commerce.',
      bullets: [
        'Bespoke Corporate & Portfolio Platforms',
        '100% Mobile & Tablet Responsive Engineering',
        'Integrated Contact Modules & Booking Pipelines',
        'Search Engine Optimization (SEO) Built-In',
        'Clean Code, Lightweight Back-ends, Faster Speeds'
      ],
      customFields: [
        { label: 'Company / Brand Name', name: 'business_name', type: 'text', placeholder: 'Name of business/organisation', required: true },
        { label: 'Website Structure', name: 'website_type', type: 'select', options: ['Business Brand Website', 'Professional Portfolio', 'Single-page Landing Page', 'Organisation Portal', 'E-commerce Store', 'Interactive Web Application'], required: true },
        { label: 'Target Launch Date', name: 'deadline', type: 'date', required: false },
        { label: 'Required Functional Scope', name: 'functionality', type: 'textarea', placeholder: 'What actions should users perform? (e.g. make bookings, purchase items)', required: true },
        { label: 'Artistic Theme Direction', name: 'design_style', type: 'select', options: ['Obsidian & Gold Dark Mode (VTO Signature)', 'Clean & Minimalist High-light', 'Modern Vibrant & High-Contrast', 'Classic Corporate Professional', 'Artistic & Fluid'], required: false },
        { label: 'Competitors / Reference Websites', name: 'references', type: 'text', placeholder: 'Paste URL addresses of designs you admire', required: false },
        { label: 'Scope Budget & Custom Features', name: 'extra_info', type: 'textarea', placeholder: 'Specify custom payment APIs, database setups, or specific integrations.', required: false }
      ],
      isCore: true,
      active: true,
      featured: true,
      order: 4,
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'cv',
      title: 'CV Expert Writing & Redesign',
      shortName: 'CV Expert',
      category: 'Career & Professional',
      badge: 'ATS Optimized',
      iconKey: 'cv',
      price: 'Fast Delivery',
      summary: 'Secure interviews at top-tier firms. We build high-impact, ATS-optimized resumes and matching cover letters formatted to modern recruiting standards.',
      bullets: [
        'Professional ATS-friendly Restructuring',
        'Industry-targeted Professional Keywords',
        'Persuasive Tailored Cover Letters',
        'LinkedIn Profile Optimisation Blueprint',
        'Delivered in Editable Word & Print-Ready PDF'
      ],
      customFields: [
        { label: 'Email Address', name: 'email', type: 'email', placeholder: 'your@email.com', required: false },
        { label: 'Selected Package', name: 'service_needed', type: 'select', options: ['New CV Drafting (from scratch)', 'Professional CV Refresh', 'Tailored Cover Letter', 'CV & Cover Letter Bundle', 'LinkedIn Optimization Roadmap'], required: true },
        { label: 'Job Hunting Field / Industry', name: 'industry', type: 'text', placeholder: 'e.g. Finance, Healthcare, Tech', required: true },
        { label: 'Current Educational Milestones', name: 'education', type: 'textarea', placeholder: 'List institutions attended, degrees, graduation months & honors.', required: false },
        { label: 'Work & Professional Milestones', name: 'experience', type: 'textarea', placeholder: 'List past roles, responsibilities, projects, and volunteer contributions.', required: false },
        { label: 'Core Technical & Soft Skills', name: 'skills', type: 'textarea', placeholder: 'e.g. Financial auditing, React.js, CRM software, leadership, etc.', required: false },
        { label: 'Formatting Direction', name: 'style', type: 'select', options: ['Clean Modern Corporate', 'Traditional / Classic Academic', 'Creative Visual Layout', 'Minimalist Single-Page Profile'], required: false },
        { label: 'Target Delivery Date', name: 'deadline', type: 'date', required: false }
      ],
      isCore: true,
      active: true,
      featured: true,
      order: 5,
      createdAt: '2026-01-01T00:00:00Z'
    },
    // Sample dynamically added services ready to use
    {
      id: 'results-checker',
      title: 'Exam Results Checker & Portal Assistance',
      shortName: 'Result Check',
      category: 'Academic & Portal',
      badge: 'Instant Support',
      iconKey: 'graduation',
      price: 'GH₵ 30 / Check',
      summary: 'Prompt, hassle-free checking and retrieval of semester results, WAEC/WASSCE checker cards, transcripts guidance, and student portal password resets.',
      bullets: [
        'Instant Result Voucher Card Generation & Processing',
        'Student Portal Password & Login Recovery',
        'Transcript & Statement of Results Guidance',
        'Print-Ready & PDF Delivery Directly to WhatsApp',
        '100% Confidential & Secure Student Verification'
      ],
      customFields: [
        { label: 'Institution / Exam Body', name: 'institution', type: 'select', options: ['Central University', 'University of Ghana (UG)', 'KNUST', 'UCC', 'WAEC / WASSCE / BECE', 'Other Institution'], required: true },
        { label: 'Student / Index ID Number', name: 'student_id', type: 'text', placeholder: 'e.g. 202401928 / Index Number', required: true },
        { label: 'Exam Year / Semester', name: 'exam_period', type: 'text', placeholder: 'e.g. 2025/2026 First Semester, Nov/Dec 2025', required: true },
        { label: 'Request Type', name: 'request_action', type: 'select', options: ['Check & Send PDF Results', 'Buy Checker Card / Scratch Voucher', 'Student Portal Password Reset', 'General Portal Assistance'], required: true },
        { label: 'Additional Details / Notes', name: 'notes', type: 'textarea', placeholder: 'Provide any portal specific login or requirements.', required: false }
      ],
      isCore: false,
      active: true,
      featured: true,
      order: 6,
      createdAt: '2026-02-15T00:00:00Z'
    },
    {
      id: 'auto-sales',
      title: 'Automobile & Car Dealership',
      shortName: 'Car Sales',
      category: 'Automotive & Trading',
      badge: 'Verified Clean Titles',
      iconKey: 'car',
      price: 'Negotiable / Inspection Ready',
      summary: 'Looking to buy, sell, or inspect a clean vehicle in Accra? We link buyers with verified unregistered and registered cars, complete with physical diagnostic checks.',
      bullets: [
        'Verified Clean Titles & Duty Clearance Papers',
        'Pre-Purchase Mechanical & OBD2 Computer Diagnostics',
        'Assisted Direct Trade-Ins & Consignment Sales',
        'Test Drives Scheduled with Full Safety Protocols',
        'Budget-Friendly Campus & Commuter Friendly Cars'
      ],
      customFields: [
        { label: 'Dealership Action', name: 'deal_action', type: 'select', options: ['I want to Buy a Car', 'I want to Sell My Car', 'Car Swap / Trade-In', 'Request Car Inspection / Diagnostic', 'Car Sourcing (Find specific model)'], required: true },
        { label: 'Target Make & Model', name: 'car_model', type: 'text', placeholder: 'e.g. Toyota Corolla 2018, Hyundai Elantra, Honda Civic', required: true },
        { label: 'Target Budget / Selling Price (GH₵)', name: 'car_budget', type: 'text', placeholder: 'e.g. GH₵ 75,000 - GH₵ 120,000', required: true },
        { label: 'Transmission & Fuel Preference', name: 'transmission', type: 'select', options: ['Automatic (Petrol)', 'Automatic (Hybrid)', 'Manual', 'Any'], required: false },
        { label: 'Vehicle Details / Inspection Location', name: 'car_details', type: 'textarea', placeholder: 'For sellers: mileage, condition, issues. For buyers: color, year range.', required: false }
      ],
      isCore: false,
      active: true,
      featured: true,
      order: 7,
      createdAt: '2026-02-20T00:00:00Z'
    }
  ];

  // Default Site Settings
  const DEFAULT_SETTINGS = {
    whatsappNumber: '233559024653',
    whatsappDisplay: '+233 559 024 653',
    voiceNumber: '233508318653',
    voiceDisplay: '+233 508 318 653',
    location: 'Central University campus, Accra, Ghana',
    tagline: '"Where design remembers the ancestors, and speaks to tomorrow."',
    brandTitle: 'VIBE TRIBE',
    brandSubtitle: 'ORGANISATION',
    announcementText: '🔥 New Services Available: Instant Result Checking & Automobile Sourcing!',
    announcementActive: true,
    agentReferralUrl: 'https://www.bigmaxservices.com?ref=AGENT-A8ADA9',
    agentReferralCode: 'AGENT-A8ADA9',
    dataStoreNotice: '⚡ Instant crediting within 5-15 mins. Direct automated Mobile Money delivery.'
  };

  // Default Seed Data Bundles for MTN, Telecel, and AT
  const DEFAULT_DATA_BUNDLES = [
    // MTN Ghana Bundles
    {
      id: 'mtn-1gb',
      network: 'MTN',
      title: 'MTN 1 GB',
      dataSize: '1 GB',
      validity: 'Non-Expiry',
      price: 5.50,
      badge: 'Starter',
      description: 'Instant 4G/5G data credited to your MTN number. Does not expire.',
      active: true,
      order: 1,
      createdAt: '2026-03-01T00:00:00Z'
    },
    {
      id: 'mtn-2-5gb',
      network: 'MTN',
      title: 'MTN 2.5 GB',
      dataSize: '2.5 GB',
      validity: 'Non-Expiry',
      price: 13.00,
      badge: 'Popular',
      description: 'High-speed internet bundle with non-expiry validity.',
      active: true,
      order: 2,
      createdAt: '2026-03-01T00:00:00Z'
    },
    {
      id: 'mtn-5gb',
      network: 'MTN',
      title: 'MTN 5 GB',
      dataSize: '5 GB',
      validity: 'Non-Expiry',
      price: 24.00,
      badge: 'Best Value',
      description: 'Top seller! Perfect for streaming, campus work and social apps.',
      active: true,
      order: 3,
      createdAt: '2026-03-01T00:00:00Z'
    },
    {
      id: 'mtn-10gb',
      network: 'MTN',
      title: 'MTN 10 GB',
      dataSize: '10 GB',
      validity: 'Non-Expiry',
      price: 45.00,
      badge: 'Pro Tier',
      description: 'Substantial monthly data reserve for power users and creators.',
      active: true,
      order: 4,
      createdAt: '2026-03-01T00:00:00Z'
    },
    {
      id: 'mtn-15gb',
      network: 'MTN',
      title: 'MTN 15 GB',
      dataSize: '15 GB',
      validity: 'Non-Expiry',
      price: 65.00,
      badge: '',
      description: 'Superfast uninterrupted connection. No expiry limit.',
      active: true,
      order: 5,
      createdAt: '2026-03-01T00:00:00Z'
    },
    {
      id: 'mtn-20gb',
      network: 'MTN',
      title: 'MTN 20 GB',
      dataSize: '20 GB',
      validity: 'Non-Expiry',
      price: 85.00,
      badge: 'Max Pack',
      description: 'Executive tier bundle for heavy research, downloading and hotspots.',
      active: true,
      order: 6,
      createdAt: '2026-03-01T00:00:00Z'
    },
    // Telecel (Vodafone) Bundles
    {
      id: 'telecel-1-5gb',
      network: 'Telecel',
      title: 'Telecel 1.5 GB',
      dataSize: '1.5 GB',
      validity: '30 Days',
      price: 7.00,
      badge: 'Starter',
      description: 'Reliable 4G data for Telecel users with 30-day validity.',
      active: true,
      order: 7,
      createdAt: '2026-03-01T00:00:00Z'
    },
    {
      id: 'telecel-3gb',
      network: 'Telecel',
      title: 'Telecel 3 GB',
      dataSize: '3 GB',
      validity: '30 Days',
      price: 14.00,
      badge: 'Popular',
      description: 'Great for browsing, WhatsApp, Instagram, and daily tasks.',
      active: true,
      order: 8,
      createdAt: '2026-03-01T00:00:00Z'
    },
    {
      id: 'telecel-6gb',
      network: 'Telecel',
      title: 'Telecel 6 GB',
      dataSize: '6 GB',
      validity: '30 Days',
      price: 27.00,
      badge: 'Best Value',
      description: 'Solid data allocation for streaming and academic work.',
      active: true,
      order: 9,
      createdAt: '2026-03-01T00:00:00Z'
    },
    {
      id: 'telecel-12gb',
      network: 'Telecel',
      title: 'Telecel 12 GB',
      dataSize: '12 GB',
      validity: '30 Days',
      price: 52.00,
      badge: 'Pro Tier',
      description: 'Generous quota for remote work, gaming and HD videos.',
      active: true,
      order: 10,
      createdAt: '2026-03-01T00:00:00Z'
    },
    {
      id: 'telecel-25gb',
      network: 'Telecel',
      title: 'Telecel 25 GB',
      dataSize: '25 GB',
      validity: '30 Days',
      price: 98.00,
      badge: 'Max Pack',
      description: 'Maximum capacity data bundle for Telecel subscribers.',
      active: true,
      order: 11,
      createdAt: '2026-03-01T00:00:00Z'
    },
    // AT (AirtelTigo) Bundles
    {
      id: 'at-2gb',
      network: 'AT',
      title: 'AT 2 GB',
      dataSize: '2 GB',
      validity: 'Non-Expiry',
      price: 8.50,
      badge: 'Budget Pack',
      description: 'Big allocation at minimal cost on the AT network. Non-expiry.',
      active: true,
      order: 12,
      createdAt: '2026-03-01T00:00:00Z'
    },
    {
      id: 'at-4-5gb',
      network: 'AT',
      title: 'AT 4.5 GB',
      dataSize: '4.5 GB',
      validity: 'Non-Expiry',
      price: 18.00,
      badge: 'Popular',
      description: 'Generous mid-tier AT bundle with zero expiration worries.',
      active: true,
      order: 13,
      createdAt: '2026-03-01T00:00:00Z'
    },
    {
      id: 'at-7gb',
      network: 'AT',
      title: 'AT 7 GB',
      dataSize: '7 GB',
      validity: 'Non-Expiry',
      price: 28.00,
      badge: 'Best Value',
      description: 'High performance data for streaming and downloads.',
      active: true,
      order: 14,
      createdAt: '2026-03-01T00:00:00Z'
    },
    {
      id: 'at-15gb',
      network: 'AT',
      title: 'AT 15 GB',
      dataSize: '15 GB',
      validity: 'Non-Expiry',
      price: 55.00,
      badge: 'Pro Tier',
      description: 'Massive AT volume. Excellent value per gigabyte.',
      active: true,
      order: 15,
      createdAt: '2026-03-01T00:00:00Z'
    },
    {
      id: 'at-30gb',
      network: 'AT',
      title: 'AT 30 GB',
      dataSize: '30 GB',
      validity: 'Non-Expiry',
      price: 105.00,
      badge: 'Max Pack',
      description: 'Ultra heavy data bundle for intensive connectivity.',
      active: true,
      order: 16,
      createdAt: '2026-03-01T00:00:00Z'
    }
  ];

  // Seed sample initial bookings for demonstration in CRM
  const DEFAULT_BOOKINGS = [
    {
      id: 'lead-1001',
      name: 'Kwame Osei',
      phone: '+233 55 902 4653',
      serviceId: 'results-checker',
      serviceTitle: 'Exam Results Checker & Portal Assistance',
      status: 'new',
      date: new Date(Date.now() - 3600000 * 2).toISOString(),
      details: {
        institution: 'Central University',
        student_id: 'CU2024-8841',
        exam_period: 'Semester 1 2025/2026',
        request_action: 'Check & Send PDF Results'
      },
      notes: 'Client requested results sent to WhatsApp directly before 5pm.',
      source: 'Website Booking Drawer'
    },
    {
      id: 'lead-1002',
      name: 'Abena Frimpong',
      phone: '+233 24 411 2233',
      serviceId: 'auto-sales',
      serviceTitle: 'Automobile & Car Dealership',
      status: 'in_progress',
      date: new Date(Date.now() - 3600000 * 24).toISOString(),
      details: {
        deal_action: 'I want to Buy a Car',
        car_model: 'Toyota Corolla 2017/2018',
        car_budget: 'GH₵ 85,000 max',
        transmission: 'Automatic (Petrol)'
      },
      notes: 'Shared 2 verified listings on WhatsApp. Inspection pending for Saturday.',
      source: 'Website Booking Drawer'
    },
    {
      id: 'lead-1003',
      name: 'Emmanuel Mensah',
      phone: '+233 50 123 4567',
      serviceId: 'laptop',
      serviceTitle: 'Laptop Software Services',
      status: 'completed',
      date: new Date(Date.now() - 3600000 * 48).toISOString(),
      details: {
        laptop_model: 'HP Pavilion x360',
        service_type: 'Windows Installation / Reinstallation',
        problem_description: 'Bootloop error, needs clean Windows 11 + MS Office 2024'
      },
      notes: 'Completed and delivered on campus. Client satisfied.',
      source: 'Website Booking Drawer'
    }
  ];

  // Default Portfolio Showcase Data
  const DEFAULT_PORTFOLIO = [
    {
      id: 'port-1',
      title: 'Modern Branding Assets',
      category: 'Graphics',
      tag: 'Graphics',
      description: 'Complete logo redesign, social kits, and flyers using obsidian black and champagne gold.',
      serviceId: 'design',
      visualClass: 'mock-design-visual',
      createdAt: '2026-01-10T00:00:00Z'
    },
    {
      id: 'port-2',
      title: 'Landing Page Systems',
      category: 'Websites',
      tag: 'Websites',
      description: 'High-conversion responsive landing pages with full SEO setups and integrated lead triggers.',
      serviceId: 'web',
      visualClass: 'mock-web-visual',
      createdAt: '2026-01-12T00:00:00Z'
    },
    {
      id: 'port-3',
      title: 'Executive ATS Resume',
      category: 'Career Development',
      tag: 'Career Development',
      description: 'Full overhaul of resume and LinkedIn profiles with recruiters keywords for corporate interviews.',
      serviceId: 'cv',
      visualClass: 'mock-cv-visual',
      createdAt: '2026-01-15T00:00:00Z'
    }
  ];

  // Main VTOData Controller Object
  const VTOData = {
    
    // ICON LIBRARY ACCESS
    getIcons() {
      return ICON_LIBRARY;
    },

    getIcon(key) {
      return ICON_LIBRARY[key] || ICON_LIBRARY.briefcase;
    },

    // SERVICES CRUD
    getServices(filterActiveOnly = false) {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.SERVICES);
        let services = raw ? JSON.parse(raw) : null;
        if (!services || !Array.isArray(services) || services.length === 0) {
          services = JSON.parse(JSON.stringify(DEFAULT_SERVICES));
          this.saveServices(services);
        }
        if (filterActiveOnly) {
          return services.filter(s => s.active !== false);
        }
        return services;
      } catch (e) {
        console.error('Error reading services:', e);
        return DEFAULT_SERVICES;
      }
    },

    getServiceById(id) {
      const services = this.getServices();
      return services.find(s => s.id === id) || null;
    },

    saveServices(services) {
      try {
        localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
        this._notifyListeners('services_updated', services);
        this._persistToServer('services', services);
        return true;
      } catch (e) {
        console.error('Error saving services:', e);
        return false;
      }
    },

    addService(serviceData) {
      const services = this.getServices();
      
      // Generate unique ID
      const baseId = serviceData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'service';
      let uniqueId = baseId;
      let counter = 1;
      while (services.some(s => s.id === uniqueId)) {
        uniqueId = `${baseId}-${counter++}`;
      }

      const newService = {
        id: uniqueId,
        title: serviceData.title || 'Untitled Service',
        shortName: serviceData.shortName || serviceData.title.split(' ')[0] || 'Service',
        category: serviceData.category || 'Specialized Service',
        badge: serviceData.badge || 'New Offering',
        iconKey: serviceData.iconKey || 'briefcase',
        price: serviceData.price || 'Contact for Quote',
        summary: serviceData.summary || 'Professional high-quality service tailored to your needs.',
        bullets: Array.isArray(serviceData.bullets) ? serviceData.bullets : (serviceData.bullets ? serviceData.bullets.split('\n').map(b => b.trim()).filter(Boolean) : []),
        customFields: Array.isArray(serviceData.customFields) ? serviceData.customFields : [],
        isCore: false,
        active: serviceData.active !== undefined ? serviceData.active : true,
        featured: serviceData.featured !== undefined ? serviceData.featured : true,
        order: services.length + 1,
        createdAt: new Date().toISOString()
      };

      services.push(newService);
      this.saveServices(services);
      return newService;
    },

    updateService(id, updatedData) {
      const services = this.getServices();
      const index = services.findIndex(s => s.id === id);
      if (index === -1) return null;

      // Clean bullets if given as string
      if (typeof updatedData.bullets === 'string') {
        updatedData.bullets = updatedData.bullets.split('\n').map(b => b.trim()).filter(Boolean);
      }

      services[index] = {
        ...services[index],
        ...updatedData,
        id: services[index].id, // preserve id
        isCore: services[index].isCore, // preserve isCore flag
        updatedAt: new Date().toISOString()
      };

      this.saveServices(services);
      return services[index];
    },

    toggleServiceStatus(id) {
      const services = this.getServices();
      const service = services.find(s => s.id === id);
      if (service) {
        service.active = !service.active;
        this.saveServices(services);
        return service.active;
      }
      return false;
    },

    deleteService(id) {
      let services = this.getServices();
      const target = services.find(s => s.id === id);
      if (!target) return false;
      
      // Filter out
      services = services.filter(s => s.id !== id);
      this.saveServices(services);
      return true;
    },

    reorderServices(orderedIds) {
      const services = this.getServices();
      const map = new Map(services.map(s => [s.id, s]));
      const newOrder = [];
      
      orderedIds.forEach((id, idx) => {
        if (map.has(id)) {
          const item = map.get(id);
          item.order = idx + 1;
          newOrder.push(item);
          map.delete(id);
        }
      });

      // Append any remaining
      map.forEach(item => {
        item.order = newOrder.length + 1;
        newOrder.push(item);
      });

      this.saveServices(newOrder);
      return newOrder;
    },

    // BOOKINGS & LEADS CRM
    getBookings() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
        let bookings = raw ? JSON.parse(raw) : null;
        if (!bookings || !Array.isArray(bookings)) {
          bookings = JSON.parse(JSON.stringify(DEFAULT_BOOKINGS));
          this.saveBookings(bookings);
        }
        return bookings;
      } catch (e) {
        console.error('Error reading bookings:', e);
        return DEFAULT_BOOKINGS;
      }
    },

    saveBookings(bookings) {
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
        this._notifyListeners('bookings_updated', bookings);
        this._persistToServer('bookings', bookings);
        return true;
      } catch (e) {
        console.error('Error saving bookings:', e);
        return false;
      }
    },

    addBooking(bookingData) {
      const bookings = this.getBookings();
      const newBooking = {
        id: 'lead-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000),
        name: bookingData.name || 'Client',
        phone: bookingData.phone || '',
        email: bookingData.email || '',
        serviceId: bookingData.serviceId || 'general',
        serviceTitle: bookingData.serviceTitle || 'General Request',
        status: bookingData.status || 'new', // new, in_progress, completed, cancelled
        date: new Date().toISOString(),
        details: bookingData.details || {},
        notes: bookingData.notes || '',
        source: bookingData.source || 'Website Form'
      };

      bookings.unshift(newBooking);
      this.saveBookings(bookings);
      return newBooking;
    },

    updateBookingStatus(id, newStatus) {
      const bookings = this.getBookings();
      const booking = bookings.find(b => b.id === id);
      if (booking) {
        booking.status = newStatus;
        booking.updatedAt = new Date().toISOString();
        this.saveBookings(bookings);
        return booking;
      }
      return null;
    },

    updateBookingNotes(id, notes) {
      const bookings = this.getBookings();
      const booking = bookings.find(b => b.id === id);
      if (booking) {
        booking.notes = notes;
        this.saveBookings(bookings);
        return booking;
      }
      return null;
    },

    deleteBooking(id) {
      let bookings = this.getBookings();
      bookings = bookings.filter(b => b.id !== id);
      this.saveBookings(bookings);
      return true;
    },

    // SITE SETTINGS
    getSettings() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        let settings = raw ? JSON.parse(raw) : null;
        if (!settings) {
          settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
          this.saveSettings(settings);
        } else {
          // Ensure agent referral settings are present
          let updated = false;
          if (!settings.agentReferralUrl) {
            settings.agentReferralUrl = DEFAULT_SETTINGS.agentReferralUrl;
            updated = true;
          }
          if (!settings.agentReferralCode) {
            settings.agentReferralCode = DEFAULT_SETTINGS.agentReferralCode;
            updated = true;
          }
          if (updated) {
            this.saveSettings(settings);
          }
        }
        return settings;
      } catch (e) {
        console.error('Error reading settings:', e);
        return DEFAULT_SETTINGS;
      }
    },

    saveSettings(settings) {
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        this._notifyListeners('settings_updated', settings);
        this._persistToServer('settings', settings);
        return true;
      } catch (e) {
        console.error('Error saving settings:', e);
        return false;
      }
    },

    // PORTFOLIO
    getPortfolio() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
        let port = raw ? JSON.parse(raw) : null;
        if (!port || !Array.isArray(port)) {
          port = JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO));
          this.savePortfolio(port);
        }
        return port;
      } catch (e) {
        console.error('Error reading portfolio:', e);
        return DEFAULT_PORTFOLIO;
      }
    },

    savePortfolio(portfolio) {
      try {
        localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(portfolio));
        this._notifyListeners('portfolio_updated', portfolio);
        this._persistToServer('portfolio', portfolio);
        return true;
      } catch (e) {
        console.error('Error saving portfolio:', e);
        return false;
      }
    },

    addPortfolioItem(item) {
      const port = this.getPortfolio();
      const newItem = {
        id: 'port-' + Date.now().toString(36),
        title: item.title || 'Untitled Showcase',
        category: item.category || 'Design',
        tag: item.tag || item.category || 'Work',
        description: item.description || '',
        serviceId: item.serviceId || 'general',
        visualClass: item.visualClass || 'mock-design-visual',
        createdAt: new Date().toISOString()
      };
      port.push(newItem);
      this.savePortfolio(port);
      return newItem;
    },

    deletePortfolioItem(id) {
      let port = this.getPortfolio();
      port = port.filter(p => p.id !== id);
      this.savePortfolio(port);
      return true;
    },

    // DATA BUNDLES RESELLER CRUD
    getDataBundles(filterActiveOnly = false) {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.DATA_BUNDLES);
        let bundles = raw ? JSON.parse(raw) : null;
        if (!bundles || !Array.isArray(bundles) || bundles.length === 0) {
          bundles = JSON.parse(JSON.stringify(DEFAULT_DATA_BUNDLES));
          this.saveDataBundles(bundles);
        }
        if (filterActiveOnly) {
          return bundles.filter(b => b.active !== false);
        }
        return bundles;
      } catch (e) {
        console.error('Error reading data bundles:', e);
        return DEFAULT_DATA_BUNDLES;
      }
    },

    saveDataBundles(bundles) {
      try {
        localStorage.setItem(STORAGE_KEYS.DATA_BUNDLES, JSON.stringify(bundles));
        this._notifyListeners('data_bundles_updated', bundles);
        this._persistToServer('dataBundles', bundles);
        return true;
      } catch (e) {
        console.error('Error saving data bundles:', e);
        return false;
      }
    },

    getDataBundleById(id) {
      const bundles = this.getDataBundles();
      return bundles.find(b => b.id === id) || null;
    },

    addDataBundle(bundleData) {
      const bundles = this.getDataBundles();
      const network = bundleData.network || 'MTN';
      const netSlug = network.toLowerCase().replace(/[^a-z0-9]/g, '');
      const sizeSlug = (bundleData.dataSize || 'bundle').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const baseId = `${netSlug}-${sizeSlug}`;
      let uniqueId = baseId;
      let counter = 1;
      while (bundles.some(b => b.id === uniqueId)) {
        uniqueId = `${baseId}-${counter++}`;
      }

      const newBundle = {
        id: uniqueId,
        network: network,
        title: bundleData.title || `${network} ${bundleData.dataSize || 'Data'}`,
        dataSize: bundleData.dataSize || '1 GB',
        validity: bundleData.validity || 'Non-Expiry',
        price: parseFloat(bundleData.price) || 5.00,
        badge: bundleData.badge || '',
        description: bundleData.description || `Instant ${network} data crediting.`,
        active: bundleData.active !== undefined ? bundleData.active : true,
        order: bundles.length + 1,
        createdAt: new Date().toISOString()
      };

      bundles.push(newBundle);
      this.saveDataBundles(bundles);
      return newBundle;
    },

    updateDataBundle(id, updatedData) {
      const bundles = this.getDataBundles();
      const index = bundles.findIndex(b => b.id === id);
      if (index === -1) return null;

      bundles[index] = {
        ...bundles[index],
        ...updatedData,
        id: bundles[index].id,
        price: updatedData.price !== undefined ? parseFloat(updatedData.price) : bundles[index].price,
        updatedAt: new Date().toISOString()
      };

      this.saveDataBundles(bundles);
      return bundles[index];
    },

    toggleBundleStatus(id) {
      const bundles = this.getDataBundles();
      const bundle = bundles.find(b => b.id === id);
      if (bundle) {
        bundle.active = !bundle.active;
        this.saveDataBundles(bundles);
        return bundle.active;
      }
      return false;
    },

    deleteDataBundle(id) {
      let bundles = this.getDataBundles();
      const initialLen = bundles.length;
      bundles = bundles.filter(b => b.id !== id);
      if (bundles.length !== initialLen) {
        this.saveDataBundles(bundles);
        return true;
      }
      return false;
    },

    // AUTHENTICATION SECURITY
    getAdminPin() {
      return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) || '1234';
    },

    setAdminPin(newPin) {
      if (newPin && newPin.length >= 4) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, newPin);
        return true;
      }
      return false;
    },

    verifyAdminPin(enteredPin) {
      const currentPin = this.getAdminPin();
      return enteredPin.trim() === currentPin.trim();
    },

    // ANALYTICS & METRICS
    getMetrics() {
      const services = this.getServices();
      const bookings = this.getBookings();
      const activeServices = services.filter(s => s.active !== false);
      const newBookings = bookings.filter(b => b.status === 'new');
      const inProgressBookings = bookings.filter(b => b.status === 'in_progress');
      const completedBookings = bookings.filter(b => b.status === 'completed');

      // Distribution by service
      const distribution = {};
      bookings.forEach(b => {
        const title = b.serviceTitle || 'Other';
        distribution[title] = (distribution[title] || 0) + 1;
      });

      return {
        totalServices: services.length,
        activeServices: activeServices.length,
        customServices: services.filter(s => !s.isCore).length,
        totalBookings: bookings.length,
        newBookings: newBookings.length,
        inProgressBookings: inProgressBookings.length,
        completedBookings: completedBookings.length,
        conversionRate: bookings.length > 0 ? Math.round((completedBookings.length / bookings.length) * 100) : 0,
        distribution
      };
    },

    // EXPORT & IMPORT BACKUP
    exportFullBackup() {
      const backup = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        services: this.getServices(),
        bookings: this.getBookings(),
        settings: this.getSettings(),
        portfolio: this.getPortfolio(),
        dataBundles: this.getDataBundles()
      };
      return JSON.stringify(backup, null, 2);
    },

    importFullBackup(jsonString) {
      try {
        const data = JSON.parse(jsonString);
        if (data.services && Array.isArray(data.services)) {
          this.saveServices(data.services);
        }
        if (data.bookings && Array.isArray(data.bookings)) {
          this.saveBookings(data.bookings);
        }
        if (data.settings && typeof data.settings === 'object') {
          this.saveSettings(data.settings);
        }
        if (data.portfolio && Array.isArray(data.portfolio)) {
          this.savePortfolio(data.portfolio);
        }
        if (data.dataBundles && Array.isArray(data.dataBundles)) {
          this.saveDataBundles(data.dataBundles);
        }
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },

    resetToFactoryDefaults() {
      localStorage.removeItem(STORAGE_KEYS.SERVICES);
      localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.PORTFOLIO);
      localStorage.removeItem(STORAGE_KEYS.DATA_BUNDLES);
      this.getServices();
      this.getBookings();
      this.getSettings();
      this.getPortfolio();
      this.getDataBundles();
      this._notifyListeners('reset_complete', {});
      return true;
    },

    // REAL-TIME MULTI-TAB & CROSS-WINDOW SYNC SYSTEM
    _listeners: {},
    _broadcastChannel: null,

    initRealtimeSync() {
      if (typeof window === 'undefined') return;

      // 1. BroadcastChannel (instant multi-tab synchronization)
      try {
        if ('BroadcastChannel' in window) {
          this._broadcastChannel = new BroadcastChannel('vto_live_realtime_sync');
          this._broadcastChannel.onmessage = (msgEvent) => {
            if (msgEvent && msgEvent.data && msgEvent.data.event) {
              this._dispatchLocalListeners(msgEvent.data.event, msgEvent.data.data, false);
            }
          };
        }
      } catch (e) {
        console.warn('BroadcastChannel not available, using storage event fallback:', e);
      }

      // 2. Storage Event Listener (cross-tab fallback for all browser environments)
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('vto_')) {
          let eventType = 'data_updated';
          if (e.key === STORAGE_KEYS.SERVICES) eventType = 'services_updated';
          else if (e.key === STORAGE_KEYS.SETTINGS) eventType = 'settings_updated';
          else if (e.key === STORAGE_KEYS.DATA_BUNDLES) eventType = 'data_bundles_updated';
          else if (e.key === STORAGE_KEYS.PORTFOLIO) eventType = 'portfolio_updated';
          else if (e.key === STORAGE_KEYS.BOOKINGS) eventType = 'bookings_updated';
          else if (e.key === 'vto_realtime_ping') {
            try {
              const pingData = JSON.parse(e.newValue || '{}');
              if (pingData.event) eventType = pingData.event;
            } catch (err) {}
          }
          this._dispatchLocalListeners(eventType, null, false);
        }
      });
    },

    on(event, callback) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(callback);
    },

    _dispatchLocalListeners(event, data, isSource = true) {
      if (this._listeners[event]) {
        this._listeners[event].forEach(cb => {
          try { cb(data); } catch(err) { console.error('Error in VTOData listener:', err); }
        });
      }
      if (this._listeners['*']) {
        this._listeners['*'].forEach(cb => {
          try { cb({ event, data }); } catch(err) { console.error('Error in VTOData wildcard listener:', err); }
        });
      }
      // Trigger DOM CustomEvent
      try {
        window.dispatchEvent(new CustomEvent('vto_data_sync', { detail: { event, data, isSource } }));
      } catch (e) {}
    },

    _notifyListeners(event, data) {
      // 1. Dispatch to current window listeners
      this._dispatchLocalListeners(event, data, true);

      // 2. Broadcast across tabs via BroadcastChannel
      if (this._broadcastChannel) {
        try {
          this._broadcastChannel.postMessage({ event, data, timestamp: Date.now() });
        } catch (e) {}
      }

      // 3. Trigger cross-tab storage event for all other windows/tabs
      try {
        localStorage.setItem('vto_realtime_ping', JSON.stringify({ event, timestamp: Date.now() }));
      } catch (e) {}
    },

    _resolveUrl(endpoint) {
      if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.startsWith('http')) {
        const base = window.location.origin.replace(/\/+$/, '');
        const rel = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
        return base + rel;
      }
      return endpoint;
    },

    // 4. Server API Persistence & Cross-Device Sync
    _persistToServer(section, data) {
      if (typeof fetch === 'undefined') return Promise.resolve(false);
      const payload = {};
      payload[section] = data;
      payload.updatedAt = new Date().toISOString();

      return fetch(this._resolveUrl('/api/data'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(resData => {
        this._dispatchLocalListeners('server_saved', { section, success: true, timestamp: Date.now() }, true);
        return true;
      })
      .catch(err => {
        console.warn('VTOData: Remote persist note:', err.message);
        this._dispatchLocalListeners('server_saved', { section, success: false, error: err.message }, true);
        return false;
      });
    },

    syncFromServer(force = false) {
      if (typeof fetch === 'undefined') return Promise.resolve(false);
      const candidates = ['/api/data', '/vto-data-store.json', 'vto-data-store.json'];
      const fetchCandidate = (idx) => {
        if (idx >= candidates.length) return Promise.reject(new Error('No sync endpoint accessible'));
        const rawUrl = this._resolveUrl(candidates[idx]);
        const url = rawUrl + (rawUrl.includes('?') ? '&' : '?') + '_t=' + Date.now();
        return fetch(url, { cache: 'no-store' })
          .then(res => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
          })
          .catch(() => fetchCandidate(idx + 1));
      };

        return fetchCandidate(0)
          .then(data => {
            if (!data || typeof data !== 'object') return false;
            let changed = false;

            if (Array.isArray(data.dataBundles) && data.dataBundles.length > 0) {
              const cur = localStorage.getItem(STORAGE_KEYS.DATA_BUNDLES);
              const fresh = JSON.stringify(data.dataBundles);
              if (cur !== fresh || force) {
                localStorage.setItem(STORAGE_KEYS.DATA_BUNDLES, fresh);
                this._dispatchLocalListeners('data_bundles_updated', data.dataBundles, false);
                changed = true;
              }
            }

            if (data.settings && typeof data.settings === 'object') {
              const cur = localStorage.getItem(STORAGE_KEYS.SETTINGS);
              const fresh = JSON.stringify(data.settings);
              if (cur !== fresh || force) {
                localStorage.setItem(STORAGE_KEYS.SETTINGS, fresh);
                this._dispatchLocalListeners('settings_updated', data.settings, false);
                changed = true;
              }
            }

            if (Array.isArray(data.services) && data.services.length > 0) {
              const cur = localStorage.getItem(STORAGE_KEYS.SERVICES);
              const fresh = JSON.stringify(data.services);
              if (cur !== fresh || force) {
                localStorage.setItem(STORAGE_KEYS.SERVICES, fresh);
                this._dispatchLocalListeners('services_updated', data.services, false);
                changed = true;
              }
            }

            if (Array.isArray(data.portfolio) && data.portfolio.length > 0) {
              const cur = localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
              const fresh = JSON.stringify(data.portfolio);
              if (cur !== fresh || force) {
                localStorage.setItem(STORAGE_KEYS.PORTFOLIO, fresh);
                this._dispatchLocalListeners('portfolio_updated', data.portfolio, false);
                changed = true;
              }
            }

            if (changed) {
              this._dispatchLocalListeners('data_updated', data, false);
            }
            this._dispatchLocalListeners('server_synced', { success: true, timestamp: Date.now() }, false);
            return true;
          })
          .catch(err => {
            this._dispatchLocalListeners('server_synced', { success: false, error: err.message }, false);
            return false;
          });
      },

      pushFullSyncToServer() {
        if (typeof fetch === 'undefined') return Promise.resolve(false);
        try {
          const fullBackup = JSON.parse(this.exportFullBackup());
          return fetch(this._resolveUrl('/api/data'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fullBackup)
          })
          .then(r => r.json())
          .then(res => {
            this._dispatchLocalListeners('server_saved', { section: 'all', success: true, timestamp: Date.now() }, true);
            return res;
          });
        } catch (err) {
          return Promise.reject(err);
        }
      }
    };

  // Initialize real-time multi-tab and cross-device sync
  VTOData.initRealtimeSync();

  // Run initial server sync on load
  if (typeof window !== 'undefined') {
    VTOData.syncFromServer();
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('focus', () => {
        VTOData.syncFromServer();
      });
    }
    if (typeof setInterval === 'function') {
      setInterval(() => {
        VTOData.syncFromServer();
      }, 30000);
    }
  }

  // Expose to window
  global.VTOData = VTOData;

})(typeof window !== 'undefined' ? window : this);
