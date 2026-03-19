import React, { useState } from 'react';
import './Contact.css';

const SOCIALS = [
    { icon: '🐙', label: 'GitHub', href: 'https://github.com', color: '#f0f6fc' },
    { icon: '💼', label: 'LinkedIn', href: 'https://linkedin.com', color: '#0a66c2' },
    { icon: '📧', label: 'Email', href: 'mailto:freshcheck@example.com', color: '#ea4335' },
];

const FAQ = [
    { q: 'What types of produce can be detected?', a: 'FreshCheck supports most common fruits and vegetables including apples, bananas, oranges, carrots, tomatoes, broccoli and more.' },
    { q: 'How accurate is the detection?', a: 'Our model achieves 98%+ accuracy on training data and 95%+ on validation data using transfer learning with MobileNetV2.' },
    { q: 'Can I use my phone camera?', a: 'Yes! The Camera page works with both front and rear cameras on mobile browsers that support the MediaDevices API.' },
    { q: 'Is my data stored?', a: 'No images are stored. All analysis is done in real-time and results are returned to your browser only.' },
];

export default function Contact() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.email.trim()) e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
        if (!form.message.trim()) e.message = 'Message is required';
        else if (form.message.length < 20) e.message = 'Message must be at least 20 characters';
        return e;
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        // Simulated submission
        setSubmitted(true);
    };

    const [openFaq, setOpenFaq] = useState(null);

    return (
        <div className="contact-page page-wrapper">
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <div className="section-tag">CONTACT</div>
                    <h1 className="section-title">Get In Touch</h1>
                    <p className="section-desc">Have questions, feedback, or want to collaborate? We'd love to hear from you.</p>
                </div>

                <div className="contact-layout">
                    {/* Contact Form */}
                    <div className="contact-form-section">
                        {!submitted ? (
                            <div className="form-card glass-card">
                                <h2 className="form-title">Send a Message</h2>
                                <form onSubmit={handleSubmit} className="contact-form">
                                    <div className="form-row">
                                        <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
                                            <label htmlFor="name">Full Name *</label>
                                            <input
                                                id="name" name="name" type="text"
                                                placeholder="John Doe"
                                                value={form.name} onChange={handleChange}
                                            />
                                            {errors.name && <div className="field-error">{errors.name}</div>}
                                        </div>
                                        <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
                                            <label htmlFor="email">Email Address *</label>
                                            <input
                                                id="email" name="email" type="email"
                                                placeholder="john@example.com"
                                                value={form.email} onChange={handleChange}
                                            />
                                            {errors.email && <div className="field-error">{errors.email}</div>}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="subject">Subject</label>
                                        <input
                                            id="subject" name="subject" type="text"
                                            placeholder="e.g. Model accuracy inquiry"
                                            value={form.subject} onChange={handleChange}
                                        />
                                    </div>
                                    <div className={`form-group ${errors.message ? 'has-error' : ''}`}>
                                        <label htmlFor="message">Message *</label>
                                        <textarea
                                            id="message" name="message" rows={5}
                                            placeholder="Write your message here..."
                                            value={form.message} onChange={handleChange}
                                        />
                                        {errors.message && <div className="field-error">{errors.message}</div>}
                                        <div className="char-count">{form.message.length} characters</div>
                                    </div>
                                    <button type="submit" className="btn-primary submit-btn">
                                        ✉️ Send Message
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="success-card glass-card">
                                <div className="success-icon">✅</div>
                                <h2>Message Sent!</h2>
                                <p>Thank you for reaching out. We'll get back to you within 24 hours.</p>
                                <button className="btn-outline" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>
                                    Send Another
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="contact-sidebar">
                        {/* Info Cards */}
                        <div className="info-cards">
                            <div className="info-card glass-card">
                                <div className="info-icon">📍</div>
                                <div>
                                    <div className="info-label">Location</div>
                                    <div className="info-value">Hyderabad, India</div>
                                </div>
                            </div>
                            <div className="info-card glass-card">
                                <div className="info-icon">🕐</div>
                                <div>
                                    <div className="info-label">Response Time</div>
                                    <div className="info-value">Within 24 hours</div>
                                </div>
                            </div>
                            <div className="info-card glass-card">
                                <div className="info-icon">🏫</div>
                                <div>
                                    <div className="info-label">Project Type</div>
                                    <div className="info-value">Final Year Research</div>
                                </div>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="social-card glass-card">
                            <h3>Connect With Us</h3>
                            <div className="social-links">
                                {SOCIALS.map((s, i) => (
                                    <a key={i} href={s.href} className="social-link" style={{ '--social-color': s.color }} target="_blank" rel="noopener noreferrer">
                                        <span className="social-icon">{s.icon}</span>
                                        <span>{s.label}</span>
                                        <span className="social-arrow">→</span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* FAQ */}
                        <div className="faq-card glass-card">
                            <h3>FAQ</h3>
                            {FAQ.map((item, i) => (
                                <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
                                    <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                        <span>{item.q}</span>
                                        <span className="faq-toggle">{openFaq === i ? '−' : '+'}</span>
                                    </button>
                                    {openFaq === i && <div className="faq-answer">{item.a}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
