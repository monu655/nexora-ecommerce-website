import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowUp, Clock, Mail, MapPin, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { toast } from '@/store/toastStore';

/*
  Footer with working Support and Company links (single file).

  About, Contact, Shipping, Returns, Warranty, FAQs, Privacy and Terms open in a
  popup right here. No other file and no router changes are needed.

  Edit the CONTACT block below to your real details.
  The Privacy policy and Terms text further down is plain starter text, not legal advice.
*/

/* ---- Edit these values to match your real business details ---- */
const CONTACT = {
  email: 'support@nexora.in',
  phone: '+91 80000 00000',
  hours: 'Mon to Sat, 10:00 to 19:00 IST',
  address: 'Nexora Devices Pvt. Ltd., Bengaluru, Karnataka, India',
};

const SOCIALS = [
  { label: 'Instagram', icon: 'instagram', href: 'https://instagram.com/' },
  { label: 'X (Twitter)', icon: 'twitter', href: 'https://x.com/' },
  { label: 'YouTube', icon: 'youtube', href: 'https://youtube.com/' },
  { label: 'LinkedIn', icon: 'linkedin', href: 'https://linkedin.com/' },
  { label: 'Facebook', icon: 'facebook', href: 'https://facebook.com/' },
];

// Only list methods you actually accept at checkout.
const PAYMENT_METHODS = ['UPI', 'Visa', 'Mastercard', 'RuPay', 'Net Banking', 'COD'];

const shopLinks = ['Audio', 'Wearables', 'Keyboards', 'Gaming', 'Laptop Accessories', 'Mobile Accessories'].map((name) => ({
  label: name,
  to: `/products?category=${encodeURIComponent(name)}`,
}));

const COLUMNS = [
  { title: 'Shop', links: [{ label: 'All products', to: '/products' }, ...shopLinks] },
  {
    title: 'Support',
    links: [
      { label: 'Contact us', to: '/contact' },
      { label: 'Shipping & delivery', to: '/shipping' },
      { label: 'Returns & refunds', to: '/returns' },
      { label: 'Warranty', to: '/warranty' },
      { label: 'FAQs', to: '/faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Nexora', to: '/about' },
      { label: 'Privacy policy', to: '/privacy' },
      { label: 'Terms of service', to: '/terms' },
    ],
  },
  {
    title: 'Your account',
    links: [
      { label: 'Sign in', to: '/login' },
      { label: 'My orders', to: '/orders' },
      { label: 'Profile & addresses', to: '/profile' },
      { label: 'Wishlist', to: '/wishlist' },
      { label: 'Cart', to: '/cart' },
    ],
  },
];
/* ---------------------------------------------------------------- */

const UPDATED = 'September 2026';

const PAGES = {
  '/about': {
    title: 'About Nexora',
    intro: 'Nexora builds audio, wearables and desk hardware for people who notice the details.',
    sections: [
      {
        heading: 'What we make',
        paragraphs: [
          'Our range covers headphones and speakers, smartwatches, mechanical keyboards, gaming gear, and everyday laptop and mobile accessories. We keep the catalogue focused, so every product earns its place.',
        ],
      },
      {
        heading: 'How we work',
        bullets: [
          'Every product is tuned and tested in-house before it ships.',
          'Every Nexora-branded device carries a 2-year warranty, with no registration needed.',
          'Support is answered by real people, not scripts.',
        ],
      },
      {
        heading: 'Where we ship',
        paragraphs: ['We dispatch from Bengaluru and Delhi and deliver across India, usually within 48 hours of dispatch.'],
      },
    ],
  },

  '/contact': {
    title: 'Contact us',
    intro: 'Questions about an order, a product or a warranty claim? Write to us and a real person will reply.',
    contact: true,
  },

  '/shipping': {
    title: 'Shipping & delivery',
    intro: 'Fast dispatch, tracked delivery, and free shipping on larger orders.',
    sections: [
      {
        heading: 'Delivery charges',
        paragraphs: [
          'Delivery is free on orders over ₹4,999. For smaller orders, any delivery charge is shown before you pay.',
        ],
      },
      {
        heading: 'Dispatch and delivery times',
        bullets: [
          'Orders are dispatched within 24 hours from our Bengaluru and Delhi hubs.',
          'Typical delivery time is about 48 hours after dispatch, depending on your pincode.',
          'Remote locations can take a little longer.',
        ],
      },
      {
        heading: 'Tracking your order',
        paragraphs: ['You can follow every order from the My orders page after you sign in.'],
        link: { to: '/orders', label: 'Go to My orders' },
      },
    ],
  },

  '/returns': {
    title: 'Returns & refunds',
    intro: 'Changed your mind? Send it back within 14 days and we arrange the pickup.',
    sections: [
      {
        heading: 'Our 14-day return policy',
        bullets: [
          'You can return most products within 14 days of delivery.',
          'The product should be unused and in its original packaging with all accessories.',
          'We arrange the pickup, so you do not need to visit a courier office.',
        ],
      },
      {
        heading: 'How to return an item',
        bullets: [
          'Open My orders and choose the order, or contact support with your order number.',
          'Tell us which product you want to return and why.',
          'Hand the package to our pickup partner.',
        ],
        link: { to: '/orders', label: 'Go to My orders' },
      },
      {
        heading: 'Refunds',
        paragraphs: [
          'Once we receive and check the returned product, your refund goes back to the original payment method.',
        ],
      },
    ],
  },

  '/warranty': {
    title: 'Warranty',
    intro: 'Every Nexora-branded device is covered for 2 years from the date of delivery.',
    sections: [
      {
        heading: 'What is covered',
        bullets: [
          'Manufacturing defects and faults that appear during normal use.',
          'No warranty registration is needed. Your order record is your proof of purchase.',
        ],
      },
      {
        heading: 'What is not covered',
        bullets: [
          'Accidental damage, drops and liquid damage.',
          'Damage from repairs or changes made by anyone other than Nexora.',
          'Normal wear and tear, such as worn ear cushions or scratched surfaces.',
        ],
      },
      {
        heading: 'How to make a claim',
        paragraphs: ['Contact support with your order number and a short description of the problem. We will guide you through the next steps.'],
        link: { to: '/contact', label: 'Contact support' },
      },
    ],
  },

  '/faq': {
    title: 'Frequently asked questions',
    intro: 'Quick answers to the questions we hear most.',
    faq: [
      ['How quickly will my order ship?', 'Orders are dispatched within 24 hours from Bengaluru or Delhi. Delivery usually takes about 48 hours after dispatch.'],
      ['Is delivery free?', 'Yes, on orders over ₹4,999. For smaller orders, any delivery charge is shown before you pay.'],
      ['Are the prices inclusive of tax?', 'Yes. Prices on the site are inclusive of all taxes.'],
      ['Do I need to register my warranty?', 'No. Every Nexora-branded device has a 2-year warranty, and your order record is your proof of purchase.'],
      ['How do I return a product?', 'Return it within 14 days of delivery. Start from My orders or contact support, and we arrange the pickup.'],
      ['How can I reach support?', `Email ${CONTACT.email} or call ${CONTACT.phone}. We are available ${CONTACT.hours}.`],
    ],
  },

  '/privacy': {
    title: 'Privacy policy',
    intro: `Last updated: ${UPDATED}. This explains what information we collect and how we use it.`,
    sections: [
      {
        heading: 'Information we collect',
        bullets: [
          'Account details such as your name, email address and password (stored securely).',
          'Delivery details such as your address and phone number.',
          'Order history and the products you save to your wishlist.',
          'Basic technical data such as your browser type, used to keep the site working.',
        ],
      },
      {
        heading: 'How we use it',
        bullets: [
          'To process and deliver your orders and handle returns and warranty claims.',
          'To contact you about your order or your support requests.',
          'To keep the site secure and improve it.',
        ],
      },
      {
        heading: 'Sharing your information',
        paragraphs: [
          'We do not sell your personal information. We share only what is needed with delivery partners and payment providers so your order can reach you.',
        ],
      },
      {
        heading: 'Your choices',
        paragraphs: [`You can update your details from your profile at any time. To ask for your data to be corrected or deleted, email ${CONTACT.email}.`],
      },
    ],
  },

  '/terms': {
    title: 'Terms of service',
    intro: `Last updated: ${UPDATED}. By using this site and placing an order, you agree to these terms.`,
    sections: [
      {
        heading: 'Using the site',
        paragraphs: ['You agree to provide accurate information, keep your account details private, and use the site only for lawful purposes.'],
      },
      {
        heading: 'Products and prices',
        paragraphs: [
          'We work to keep product details and prices accurate. If we find an error in a price or listing, we may cancel the affected order and refund any amount you have paid.',
        ],
      },
      {
        heading: 'Orders, delivery, returns and warranty',
        paragraphs: ['Delivery, returns and warranty are governed by our shipping, returns and warranty pages.'],
        link: { to: '/returns', label: 'Read the returns policy' },
      },
      {
        heading: 'Limitation of liability',
        paragraphs: [
          'To the extent allowed by law, Nexora is not liable for indirect or consequential losses arising from the use of our products or this site.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [`For questions about these terms, email ${CONTACT.email}.`],
      },
    ],
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Social icons drawn here as small SVGs, so the footer does not depend on which
// version of lucide-react you have (newer versions removed brand icons).
function SocialIcon({ name }) {
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  switch (name) {
    case 'instagram':
      return (
        <svg {...common}>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    case 'twitter':
      return (
        <svg {...common}>
          <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg {...common}>
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg {...common}>
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
  }
}

function ContactPanel() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'Please enter your name.';
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Please enter a valid email address.';
    if (form.message.trim().length < 10) next.message = 'Please write at least 10 characters.';
    setErrors(next);
    if (Object.keys(next).length) return;

    // No message API exists yet, so this opens the visitor's email app with the message filled in.
    const subject = encodeURIComponent(`Message from ${form.name.trim()}`);
    const body = encodeURIComponent(`${form.message.trim()}\n\nFrom: ${form.name.trim()} (${form.email.trim()})`);
    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
    toast.success('Opening your email app so you can send the message.');
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <ul className="space-y-4 text-[14.5px] text-ink-soft">
        <li className="flex gap-3">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
          <span>
            <span className="block font-medium text-ink">Email</span>
            <a href={`mailto:${CONTACT.email}`} className="hover:text-ink">{CONTACT.email}</a>
          </span>
        </li>
        <li className="flex gap-3">
          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
          <span>
            <span className="block font-medium text-ink">Phone</span>
            <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} className="hover:text-ink">{CONTACT.phone}</a>
          </span>
        </li>
        <li className="flex gap-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
          <span>
            <span className="block font-medium text-ink">Support hours</span>
            {CONTACT.hours}
          </span>
        </li>
        <li className="flex gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
          <span>
            <span className="block font-medium text-ink">Address</span>
            {CONTACT.address}
          </span>
        </li>
      </ul>

      <form onSubmit={submit} className="card space-y-4 p-5" noValidate>
        <h2 className="font-display text-[17px] font-semibold">Send us a message</h2>
        <Field label="Your name" error={errors.name} required>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} />
        </Field>
        <Field label="Email" error={errors.email} required>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={120} />
        </Field>
        <Field label="Message" error={errors.message} required>
          <Textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Tell us how we can help. Include your order number if you have one."
            error={errors.message}
          />
        </Field>
        <Button type="submit" className="w-full">Send message</Button>
      </form>
    </div>
  );
}

function FaqList({ items }) {
  return (
    <div className="divide-y divide-line rounded-xl border border-line">
      {items.map(([q, a]) => (
        <details key={q} className="group px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-ink">
            {q}
            <span className="text-ink-muted transition-transform group-open:rotate-45" aria-hidden>+</span>
          </summary>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">{a}</p>
        </details>
      ))}
    </div>
  );
}

function Section({ heading, paragraphs, bullets, link, onOpen, onClose }) {
  return (
    <section className="mt-9">
      <h2 className="font-display text-[19px] font-semibold tracking-[-0.02em]">{heading}</h2>
      {paragraphs?.map((p) => (
        <p key={p} className="mt-3 text-[15px] leading-relaxed text-ink-soft">{p}</p>
      ))}
      {bullets && (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink-soft marker:text-ink-muted">
          {bullets.map((b) => <li key={b}>{b}</li>)}
        </ul>
      )}
      {link && (PAGES[link.to] && onOpen ? (
        <button type="button" onClick={() => onOpen(link.to)} className="mt-4 inline-block text-[14px] font-medium text-brand-600 hover:underline">
          {link.label} &rarr;
        </button>
      ) : (
        <Link to={link.to} onClick={onClose} className="mt-4 inline-block text-[14px] font-medium text-brand-600 hover:underline">
          {link.label} &rarr;
        </Link>
      ))}
    </section>
  );
}

// The content of one page. Used by the routed page below and by the popup in Footer.jsx.
function InfoBody({ page, onOpen, onClose, headingId }) {
  return (
    <>
      <h1 id={headingId} className="font-display text-display tracking-[-0.03em]">{page.title}</h1>
      <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">{page.intro}</p>

      <div className={page.contact ? 'mt-8' : ''}>
        {page.contact && <ContactPanel />}
        {page.faq && <div className="mt-8"><FaqList items={page.faq} /></div>}
        {page.sections?.map((sec) => <Section key={sec.heading} {...sec} onOpen={onOpen} onClose={onClose} />)}
      </div>
    </>
  );
}

// A footer link: opens the popup for info pages, otherwise a normal router link.
function FooterLink({ to, children, className, onOpenInfo }) {
  if (PAGES[to]) {
    return (
      <button type="button" onClick={() => onOpenInfo(to)} className={`text-left ${className}`}>
        {children}
      </button>
    );
  }
  return <Link to={to} className={className}>{children}</Link>;
}

function InfoModal({ pathKey, onClose, onOpen }) {
  const closeRef = useRef(null);
  const page = PAGES[pathKey];

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  if (!page) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/50 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-modal-title"
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white p-6 shadow-lift sm:rounded-2xl sm:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-2 text-ink-soft hover:bg-surface-sunken hover:text-ink"
        >
          <X className="h-5 w-5" />
        </button>
        <InfoBody page={page} onOpen={onOpen} onClose={onClose} headingId="info-modal-title" />
      </div>
    </div>
  );
}

function Newsletter() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) return toast.error('Please enter a valid email address');
    setBusy(true);
    // No newsletter API exists yet: wire this to your backend when it does.
    setTimeout(() => {
      setBusy(false);
      setEmail('');
      toast.success('Thanks for subscribing. New drops land in your inbox.');
    }, 400);
  };

  return (
    <form onSubmit={submit} className="mt-4 flex max-w-sm gap-2" noValidate>
      <label htmlFor="footer-email" className="sr-only">Email address</label>
      <input
        id="footer-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        className="h-11 min-w-0 flex-1 rounded-lg border border-line-strong bg-white px-3.5 text-[14px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
      />
      <button
        type="submit"
        disabled={busy}
        aria-label="Subscribe to newsletter"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ink text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  const { pathname } = useLocation();
  const [openInfo, setOpenInfo] = useState(null);
  const closeInfo = useCallback(() => setOpenInfo(null), []);

  // Close the popup whenever the page changes.
  useEffect(() => { setOpenInfo(null); }, [pathname]);

  return (
    <footer className="mt-20 border-t border-line bg-surface-sunken" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Nexora footer</h2>

      <div className="container-page py-14">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2.2fr]">
          {/* Brand, contact, newsletter */}
          <div>
            <Link to="/" className="font-display text-[22px] font-bold tracking-[-0.03em] text-ink">NEXORA</Link>
            <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-ink-soft">
              Audio, wearables and desk hardware, tuned in-house and shipped across India within 24 hours.
            </p>

            <ul className="mt-5 space-y-2.5 text-[14px] text-ink-soft">
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                <a href={`mailto:${CONTACT.email}`} className="hover:text-ink">{CONTACT.email}</a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                <span>
                  <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} className="hover:text-ink">{CONTACT.phone}</a>
                  <span className="block text-[13px] text-ink-muted">{CONTACT.hours}</span>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                <span>{CONTACT.address}</span>
              </li>
            </ul>

            <p className="mt-7 text-[14px] font-semibold text-ink">Get new drops and offers</p>
            <Newsletter />
          </div>

          {/* Link columns */}
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink">{col.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <FooterLink
                        to={l.to}
                        onOpenInfo={setOpenInfo}
                        className="text-[14px] text-ink-soft transition-colors hover:text-ink"
                      >
                        {l.label}
                      </FooterLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Payments and socials */}
        <div className="mt-12 flex flex-col gap-6 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-ink-muted">Secure payments</p>
            <ul className="mt-2.5 flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <li key={m} className="rounded-md border border-line bg-white px-2.5 py-1 text-[12px] font-medium text-ink-soft">
                  {m}
                </li>
              ))}
            </ul>
          </div>

          <ul className="flex items-center gap-2" aria-label="Social media">
            {SOCIALS.map(({ label, icon, href }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink-soft transition-colors hover:border-ink hover:text-ink"
                >
                  <SocialIcon name={icon} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-line">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-[13px] text-ink-muted sm:flex-row">
          <p>&copy; {year} Nexora Devices Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <FooterLink to="/privacy" onOpenInfo={setOpenInfo} className="hover:text-ink">Privacy</FooterLink>
            <FooterLink to="/terms" onOpenInfo={setOpenInfo} className="hover:text-ink">Terms</FooterLink>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 hover:text-ink"
            >
              Back to top <ArrowUp className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {openInfo && createPortal(<InfoModal pathKey={openInfo} onClose={closeInfo} onOpen={setOpenInfo} />, document.body)}
    </footer>
  );
}

export default Footer;