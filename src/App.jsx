import { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import {
  Activity, ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, Bell, CalendarDays,
  Check, ChevronDown, Clock3, Heart, HeartPulse, LockKeyhole, LogOut, Mail,
  Menu, ShieldCheck, Sparkles, Stethoscope, UserRound, UsersRound, X,
} from 'lucide-react';

const API = '/api';
const services = [
  { icon: HeartPulse, title: 'Primary care', detail: 'Your everyday health, supported by people who know you.' },
  { icon: Stethoscope, title: 'Specialist care', detail: 'The right expertise, thoughtfully connected to your care.' },
  { icon: Activity, title: 'Diagnostics', detail: 'Clear answers and convenient testing, all in one place.' },
];
const doctors = [
  { name: 'Dr. Olivia Bennett', role: 'Cardiology', years: '12 years experience', image: 'photo-1559839734-2b71ea197ec2' },
  { name: 'Dr. Marcus Chen', role: 'Internal medicine', years: '9 years experience', image: 'photo-1612349317150-e413f6a5b16d' },
  { name: 'Dr. Priya Nair', role: 'Family medicine', years: '11 years experience', image: 'photo-1594824476967-48c8b964273f' },
];
const articles = [
  { category: 'WELLNESS', title: 'Small habits, a healthier heart', date: 'May 18, 2025', image: 'photo-1505751172876-fa1923c5c528' },
  { category: 'PREVENTION', title: 'The checkup you should not skip', date: 'May 09, 2025', image: 'photo-1576091160399-112ba8d25d1d' },
  { category: 'LIVING WELL', title: 'Making sleep part of your care plan', date: 'Apr 26, 2025', image: 'photo-1545205597-3d9d02c29597' },
];

async function apiRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = localStorage.getItem('healthcare-token');
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
  return data;
}

function Brand({ inverse = false }) {
  return <a className={`brand${inverse ? ' brand-light' : ''}`} href="#top" aria-label="HealthCare home">
    <span className="brand-mark"><HeartPulse size={19} strokeWidth={2.2} /></span>
    <span>Health<span className="brand-accent">Care</span></span>
  </a>;
}

function App() {
  const [view, setView] = useState(new URLSearchParams(window.location.search).has('reset') ? 'reset' : 'home');
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('healthcare-token')));
  const resetToken = new URLSearchParams(window.location.search).get('reset') || '';

  useEffect(() => {
    const token = localStorage.getItem('healthcare-token');
    if (!token) return;
    apiRequest('/dashboard').then((data) => {
      setUser(data.user);
      setDashboard(data);
      setView('dashboard');
    }).catch(() => localStorage.removeItem('healthcare-token')).finally(() => setLoading(false));
  }, []);

  function openAuth(mode = 'login') {
    setAuthMode(mode);
    setView('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function acceptSession(data) {
    localStorage.setItem('healthcare-token', data.token);
    setUser(data.user);
    setDashboard({ user: data.user, appointments: [] });
    setView('dashboard');
  }

  async function signInWithGoogle(credential) {
    try {
      const data = await apiRequest('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) });
      acceptSession(data);
    } catch (error) {
      window.alert(error.message);
    }
  }

  function signOut() {
    localStorage.removeItem('healthcare-token');
    setUser(null);
    setDashboard(null);
    setView('home');
  }

  if (loading) return <div className="loading-screen"><span className="loading-mark"><HeartPulse size={22} /></span>Preparing your care space...</div>;
  if (view === 'dashboard' && user) return <Dashboard user={user} dashboard={dashboard} setUser={setUser} setDashboard={setDashboard} onSignOut={signOut} />;
  if (view === 'auth') return <AuthPage mode={authMode} setMode={setAuthMode} onBack={() => setView('home')} onSession={acceptSession} onGoogle={signInWithGoogle} googleEnabled={Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)} />;
  if (view === 'reset') return <ResetPage token={resetToken} onBack={() => { window.history.replaceState({}, '', '/'); setView('auth'); setAuthMode('login'); }} />;
  return <Home onAuth={openAuth} onBook={() => user ? setView('dashboard') : openAuth('register')} />;
}

function Home({ onAuth, onBook }) {
  return <div className="site-shell" id="top">
    <header className="site-header">
      <div className="header-inner"><Brand />
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#services">Services</a><a href="#doctors">Our doctors</a><a href="#stories">Health insights</a>
        </nav>
        <div className="header-actions"><button className="text-button" onClick={() => onAuth('login')}>Log in</button><button className="button button-small" onClick={() => onAuth('register')}>Create account <ArrowUpRight size={15} /></button></div>
      </div>
    </header>

    <main>
      <section className="hero-section page-width">
        <div className="hero-copy reveal-up">
          <div className="eyebrow"><span className="eyebrow-dot" /> CARE THAT MOVES WITH YOU</div>
          <h1>Your health,<br /><span>our priority.</span></h1>
          <p>Thoughtful care, made personal. Find trusted doctors, book appointments and feel more in control of your health.</p>
          <div className="hero-actions"><button className="button" onClick={onBook}>Book an appointment <ArrowRight size={17} /></button><a className="quiet-link" href="#services">Explore our care <ArrowDown size={15} /></a></div>
          <div className="hero-trust"><div className="avatar-stack"><img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80&h=80&fit=crop&crop=faces" alt="" /><img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=80&h=80&fit=crop&crop=faces" alt="" /><img src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=80&h=80&fit=crop&crop=faces" alt="" /></div><div><strong>Care you can count on</strong><span>Trusted by 12,000+ patients</span></div><div className="trust-stars">★★★★★<span>4.9/5</span></div></div>
        </div>
        <div className="hero-visual reveal-up">
          <div className="hero-image-wrap"><img className="hero-image" src="https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=1100&h=1250&fit=crop&crop=faces" alt="Doctor speaking with a patient in a bright clinic" /><div className="image-caption"><span className="caption-icon"><BadgeCheck size={18} /></span><span><b>Care, centered on you</b><small>Here for every step</small></span><ArrowUpRight size={17} /></div></div>
          <div className="hero-stat"><span className="stat-icon"><UsersRound size={17} /></span><b>120+</b><small>care professionals</small></div>
          <span className="hero-sparkle"><Sparkles size={22} /></span>
        </div>
      </section>

      <section className="trust-strip"><div className="page-width trust-strip-inner"><span>CARE THAT FITS YOUR LIFE</span><div><ShieldCheck size={17} /> Trusted, board-certified doctors</div><div><Clock3 size={17} /> Convenient appointment times</div><div><LockKeyhole size={16} /> Private and secure care</div></div></section>

      <section className="section page-width services-section" id="services">
        <div className="section-heading"><div><div className="eyebrow">CARE, YOUR WAY</div><h2>Here for all of <em>you.</em></h2></div><p>From everyday questions to specialized support, good care starts with listening.</p></div>
        <div className="service-grid">{services.map(({ icon: Icon, title, detail }, index) => <article className="service-card" key={title}><span className={`service-icon service-icon-${index}`}><Icon size={22} /></span><span className="card-index">0{index + 1}</span><h3>{title}</h3><p>{detail}</p><button className="arrow-link" onClick={onBook} aria-label={`Book ${title}`}><ArrowUpRight size={19} /></button></article>)}</div>
      </section>

      <section className="doctor-section" id="doctors"><div className="page-width section">
        <div className="section-heading"><div><div className="eyebrow">GOOD PEOPLE, GREAT CARE</div><h2>Meet your care <em>team.</em></h2></div><button className="quiet-link" onClick={onBook}>Find your doctor <ArrowRight size={16} /></button></div>
        <div className="doctor-grid">{doctors.map((doctor) => <article className="doctor-card" key={doctor.name}><div className="doctor-image"><img src={`https://images.unsplash.com/${doctor.image}?w=700&h=760&fit=crop&crop=faces`} alt={doctor.name} /><span><BadgeCheck size={15} /> Accepting patients</span></div><div className="doctor-info"><div><h3>{doctor.name}</h3><p>{doctor.role}</p></div><span className="doctor-years">{doctor.years}</span></div></article>)}</div>
      </div></section>

      <section className="testimonial-section page-width" id="testimonials"><div className="testimonial-decoration"><Heart size={25} /></div><div className="testimonial-copy"><div className="eyebrow">KIND WORDS, REAL CARE</div><div className="quote-stars">★★★★★</div><blockquote>“For the first time, I feel like my doctor knows me as a person, not just a chart.”</blockquote><div className="quote-person"><span className="quote-avatar">JM</span><span><b>Jordan M.</b><small>HealthCare patient since 2023</small></span></div></div><div className="testimonial-note"><span>01 <i>/ 03</i></span><p>Care is a relationship.<br />We’re glad you’re here.</p><div className="slider-lines"><i /><i /><i /></div></div></section>

      <section className="section page-width article-section" id="stories"><div className="section-heading"><div><div className="eyebrow">A LITTLE MORE KNOW-HOW</div><h2>Health, in <em>real life.</em></h2></div><a className="quiet-link" href="#stories">View all articles <ArrowRight size={16} /></a></div><div className="article-grid">{articles.map((article) => <article className="article-card" key={article.title}><img src={`https://images.unsplash.com/${article.image}?w=760&h=500&fit=crop`} alt="" /><div className="article-meta"><span>{article.category}</span><span>{article.date}</span></div><h3>{article.title}</h3><a href="#stories" aria-label={`Read ${article.title}`}><ArrowUpRight size={17} /></a></article>)}</div></section>

      <section className="cta-band"><div className="page-width cta-inner"><span className="cta-icon"><HeartPulse size={23} /></span><div><div className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div><h2>Let’s take good care of you.</h2></div><button className="button button-light" onClick={onBook}>Get started <ArrowRight size={16} /></button></div></section>
    </main>

    <footer className="site-footer"><div className="page-width footer-main"><div className="footer-about"><Brand inverse /><p>Better health starts with care that sees the whole you.</p><div className="footer-social"><a href="#top" aria-label="Instagram">ig</a><a href="#top" aria-label="LinkedIn">in</a><a href="#top" aria-label="Facebook">f</a></div></div><div className="footer-links"><div><b>Explore</b><a href="#services">Our services</a><a href="#doctors">Find a doctor</a><a href="#stories">Health insights</a></div><div><b>Get in touch</b><a href="mailto:hello@healthcare.example">hello@healthcare.example</a><a href="tel:+18005550124">1 (800) 555-0124</a><span>Mon–Fri, 8am–6pm</span></div></div></div><div className="page-width footer-bottom"><span>© 2025 HealthCare. All rights reserved.</span><span>Privacy · Terms · Accessibility</span></div></footer>
  </div>;
}

function AuthPage({ mode, setMode, onBack, onSession, onGoogle, googleEnabled }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError(''); setNotice(''); setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      if (mode === 'forgot') {
        const result = await apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: values.email }) });
        setNotice(result.message);
      } else {
        const data = await apiRequest(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(values) });
        onSession(data);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally { setBusy(false); }
  }

  const title = mode === 'register' ? 'A healthier you starts here.' : mode === 'forgot' ? 'Let’s get you back in.' : 'Good to see you again.';
  return <main className="auth-page">
    <div className="auth-top"><Brand /><button className="text-button" onClick={onBack}><X size={17} /> Back to home</button></div>
    <div className="auth-layout"><div className="auth-art"><img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1100&h=1200&fit=crop" alt="A doctor offering attentive care" /><div className="auth-art-copy"><span className="eyebrow">YOUR HEALTH, OUR PRIORITY</span><p>Care that listens.<br /><em>People who care.</em></p><span className="auth-art-caption"><span className="online-dot" /> A little more human, every day.</span></div></div>
      <section className="auth-form-panel"><div className="auth-form-inner"><span className="auth-overline">{mode === 'register' ? 'CREATE YOUR ACCOUNT' : mode === 'forgot' ? 'PASSWORD RECOVERY' : 'WELCOME BACK'}</span><h1>{title}</h1><p className="auth-subtitle">{mode === 'register' ? 'Join a care team that puts you first.' : mode === 'forgot' ? 'Enter the email linked to your account and we’ll send a reset link.' : 'Sign in to pick up where you left off.'}</p>
        {mode !== 'forgot' && googleEnabled && <div className="google-button"><GoogleLogin onSuccess={({ credential }) => credential && onGoogle(credential)} onError={() => setError('Google sign-in could not be completed.')} text={mode === 'register' ? 'signup_with' : 'signin_with'} shape="rectangular" theme="outline" size="large" width="380" /></div>}
        {mode !== 'forgot' && googleEnabled && <div className="form-divider"><span>or continue with email</span></div>}
        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && <label>Full name<div className="input-wrap"><UserRound size={17} /><input name="name" type="text" placeholder="Your name" autoComplete="name" required maxLength="80" /></div></label>}
          <label>Email address<div className="input-wrap"><Mail size={17} /><input name="email" type="email" placeholder="you@example.com" autoComplete="email" required /></div></label>
          {mode !== 'forgot' && <label>Password<div className="input-wrap"><LockKeyhole size={17} /><input name="password" type="password" placeholder="At least 8 characters" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength="8" required /></div></label>}
          {mode === 'login' && <button className="forgot-link" type="button" onClick={() => { setError(''); setMode('forgot'); }}>Forgot password?</button>}
          {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}
          <button className="button auth-submit" disabled={busy}>{busy ? 'Please wait...' : mode === 'register' ? 'Create your account' : mode === 'forgot' ? 'Send reset link' : 'Log in'} <ArrowRight size={17} /></button>
        </form>
        {mode !== 'forgot' && <p className="auth-switch">{mode === 'register' ? 'Already have an account?' : 'New to HealthCare?'} <button onClick={() => { setError(''); setMode(mode === 'register' ? 'login' : 'register'); }}>{mode === 'register' ? 'Log in' : 'Create an account'}</button></p>}
        {mode === 'forgot' && <p className="auth-switch"><button onClick={() => { setError(''); setNotice(''); setMode('login'); }}>Back to log in</button></p>}
        <p className="auth-privacy"><ShieldCheck size={14} /> Your personal information is encrypted and secure.</p>
      </div></section></div>
  </main>;
}

function ResetPage({ token, onBack }) {
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (values.password !== values.confirmPassword) { setError('Those passwords do not match.'); setBusy(false); return; }
    try {
      await apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password: values.password }) });
      setDone(true);
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }
  return <main className="reset-page"><div className="reset-top"><Brand /><button className="text-button" onClick={onBack}><ArrowRight className="back-arrow" size={16} /> Sign in</button></div><section className="reset-panel"><span className="reset-icon"><LockKeyhole size={22} /></span><span className="auth-overline">PASSWORD RECOVERY</span><h1>{done ? 'You’re all set.' : 'Choose a new password.'}</h1><p>{done ? 'Your password has been updated. Sign in to continue.' : 'Make it at least 8 characters, and choose one you have not used before.'}</p>{done ? <button className="button" onClick={onBack}>Return to sign in <ArrowRight size={16} /></button> : <form className="auth-form" onSubmit={submit}><label>New password<div className="input-wrap"><LockKeyhole size={17} /><input name="password" type="password" minLength="8" required autoComplete="new-password" /></div></label><label>Confirm password<div className="input-wrap"><LockKeyhole size={17} /><input name="confirmPassword" type="password" minLength="8" required autoComplete="new-password" /></div></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button auth-submit" disabled={busy}>{busy ? 'Updating...' : 'Update password'} <ArrowRight size={17} /></button></form>}</section></main>;
}

function Dashboard({ user, dashboard, setUser, setDashboard, onSignOut }) {
  const [tab, setTab] = useState('Overview');
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const appointments = dashboard?.appointments || [];
  const tabs = [
    { label: 'Overview', icon: Activity }, { label: 'Appointments', icon: CalendarDays },
    { label: 'Health information', icon: HeartPulse }, { label: 'My profile', icon: UserRound },
  ];

  async function saveForm(event, endpoint, update) {
    event.preventDefault(); setSaving(true); setToast('');
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const result = await apiRequest(endpoint, { method: 'PATCH', body: JSON.stringify(values) });
      setUser(result.user); setDashboard((current) => ({ ...current, user: result.user })); setToast('Your changes have been saved.');
    } catch (error) { setToast(error.message); }
    finally { setSaving(false); }
  }

  async function bookAppointment(event) {
    event.preventDefault(); setSaving(true); setToast('');
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const result = await apiRequest('/appointments', { method: 'POST', body: JSON.stringify(values) });
      setDashboard((current) => ({ ...current, appointments: [...(current?.appointments || []), result.appointment].sort((a, b) => new Date(a.date) - new Date(b.date)) }));
      setToast('Your appointment request is confirmed.'); event.currentTarget.reset();
    } catch (error) { setToast(error.message); }
    finally { setSaving(false); }
  }

  const nextAppointment = appointments.find((appointment) => new Date(appointment.date) >= new Date());
  return <div className="dashboard-shell"><aside className="dashboard-sidebar"><Brand /><div className="sidebar-label">YOUR SPACE</div><nav className="dashboard-nav">{tabs.map(({ label, icon: Icon }) => <button className={tab === label ? 'active' : ''} key={label} onClick={() => { setTab(label); setToast(''); }}><Icon size={18} />{label}{label === 'Appointments' && appointments.length > 0 && <span className="nav-count">{appointments.length}</span>}</button>)}</nav><div className="sidebar-help"><span><HeartPulse size={18} /></span><b>Here when you need us.</b><small>Questions about your care?</small><a href="mailto:hello@healthcare.example">Contact our team <ArrowUpRight size={14} /></a></div><button className="signout-button" onClick={onSignOut}><LogOut size={17} /> Sign out</button></aside>
    <main className="dashboard-main"><header className="dashboard-header"><div><span className="dashboard-date">YOUR HEALTH, AT A GLANCE</span><h1>{tab === 'Overview' ? `Good to see you, ${user.name.split(' ')[0]}.` : tab}</h1></div><div className="dashboard-user"><button className="notification-button" aria-label="Notifications"><Bell size={18} /><i /></button><span className="user-avatar">{user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><div><b>{user.name}</b><small>HealthCare member</small></div><ChevronDown size={15} /></div></header>
      {toast && <div className={toast.includes('saved') || toast.includes('confirmed') ? 'dashboard-toast success' : 'dashboard-toast'} role="status">{toast}</div>}
      {tab === 'Overview' && <Overview user={user} appointments={appointments} nextAppointment={nextAppointment} onTab={setTab} />}
      {tab === 'Appointments' && <Appointments appointments={appointments} onSubmit={bookAppointment} saving={saving} />}
      {tab === 'Health information' && <HealthForm healthInfo={user.healthInfo || {}} onSubmit={(event) => saveForm(event, '/health-info')} saving={saving} />}
      {tab === 'My profile' && <ProfileForm user={user} onSubmit={(event) => saveForm(event, '/profile')} saving={saving} />}
    </main></div>;
}

function Overview({ user, appointments, nextAppointment, onTab }) {
  return <div className="dashboard-content"><div className="welcome-banner"><div><span className="welcome-kicker"><Sparkles size={14} /> A GOOD DAY TO CHECK IN</span><h2>Taking care of yourself<br />is always a good place to start.</h2><p>Your care, all in one place. Let’s make today a little healthier.</p><button onClick={() => onTab('Appointments')}>Book an appointment <ArrowRight size={15} /></button></div><div className="welcome-art"><div className="welcome-circle"><HeartPulse size={60} strokeWidth={1.2} /></div><span className="welcome-mini mini-one"><Check size={14} /> Care, connected</span><span className="welcome-mini mini-two"><Heart size={14} /> Here for you</span></div></div>
    <div className="overview-grid"><section className="dashboard-panel appointment-panel"><div className="panel-heading"><div><span className="panel-eyebrow">YOUR CARE</span><h3>Upcoming appointment</h3></div><button className="panel-link" onClick={() => onTab('Appointments')}>See all <ArrowRight size={14} /></button></div>{nextAppointment ? <div className="upcoming-details"><span className="calendar-tile"><b>{new Date(nextAppointment.date).toLocaleDateString('en-US', { day: '2-digit' })}</b><small>{new Date(nextAppointment.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</small></span><div><b>{nextAppointment.service}</b><span>{nextAppointment.doctor || 'Care team'}</span><small><Clock3 size={13} /> {nextAppointment.time}</small></div><span className="status-pill">{nextAppointment.status}</span></div> : <div className="empty-appointment"><span><CalendarDays size={20} /></span><div><b>No appointments yet</b><small>Whenever you’re ready, we’re here.</small></div><button onClick={() => onTab('Appointments')}>Book now <ArrowRight size={14} /></button></div>}</section>
      <section className="dashboard-panel profile-progress"><div className="panel-heading"><div><span className="panel-eyebrow">YOUR PROFILE</span><h3>Personal health</h3></div><button className="panel-icon-button" onClick={() => onTab('Health information')} aria-label="Edit health information"><ArrowUpRight size={17} /></button></div><div className="health-summary"><div className="health-summary-item"><span className="health-summary-icon"><Activity size={16} /></span><div><small>Blood type</small><b>{user.healthInfo?.bloodType || 'Not added'}</b></div></div><div className="health-summary-item"><span className="health-summary-icon mint"><Heart size={16} /></span><div><small>Allergies</small><b>{user.healthInfo?.allergies || 'Not added'}</b></div></div></div><button className="add-health-link" onClick={() => onTab('Health information')}>{user.healthInfo?.bloodType ? 'Update your health details' : 'Add health details'} <ArrowRight size={14} /></button></section></div>
    <section className="dashboard-panel notification-panel"><div className="panel-heading"><div><span className="panel-eyebrow">A NOTE FROM YOUR CARE TEAM</span><h3>Notifications</h3></div><Bell size={18} /></div><div className="notification-row"><span className="notification-icon"><HeartPulse size={17} /></span><div><b>{user.notifications?.[0] || 'You’re all caught up.'}</b><small>Just now · HealthCare team</small></div><span className="notification-new">NEW</span></div></section></div>;
}

function Appointments({ appointments, onSubmit, saving }) {
  const minDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  return <div className="dashboard-content inner-page"><div className="page-intro"><span className="panel-eyebrow">CARE, ON YOUR SCHEDULE</span><h2>Appointments</h2><p>Book a visit with the care team that knows you.</p></div><div className="appointment-layout"><section className="dashboard-panel booking-panel"><div className="panel-heading"><div><span className="panel-eyebrow">MAKE SOME TIME FOR YOU</span><h3>Book an appointment</h3></div><CalendarDays size={20} /></div><form className="dashboard-form" onSubmit={onSubmit}><label>What kind of care do you need?<select name="service" required defaultValue=""><option value="" disabled>Select a service</option><option>Primary care</option><option>Cardiology</option><option>Internal medicine</option><option>Family medicine</option><option>Diagnostics</option><option>Other</option></select></label><div className="form-two-col"><label>Preferred date<input type="date" name="date" min={minDate} required /></label><label>Preferred time<select name="time" required defaultValue=""><option value="" disabled>Select a time</option><option value="09:00">9:00 AM</option><option value="10:30">10:30 AM</option><option value="13:00">1:00 PM</option><option value="14:30">2:30 PM</option><option value="16:00">4:00 PM</option></select></label></div><button className="button" disabled={saving}>{saving ? 'Booking...' : 'Request appointment'} <ArrowRight size={16} /></button></form></section><section className="appointment-list"><div className="panel-heading"><div><span className="panel-eyebrow">YOUR VISITS</span><h3>Appointment history</h3></div></div>{appointments.length ? appointments.map((item) => <AppointmentRow key={item._id} item={item} />) : <div className="empty-list"><CalendarDays size={24} /><b>Your visits will show up here.</b><span>Book an appointment to get started.</span></div>}</section></div></div>;
}

function AppointmentRow({ item }) {
  const date = new Date(item.date);
  return <article className="appointment-row"><span className="calendar-tile"><b>{date.toLocaleDateString('en-US', { day: '2-digit' })}</b><small>{date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</small></span><div><b>{item.service}</b><small>{item.doctor || 'Care team'} · {item.time}</small></div><span className="status-pill">{item.status}</span></article>;
}

function HealthForm({ healthInfo, onSubmit, saving }) {
  return <div className="dashboard-content inner-page"><div className="page-intro"><span className="panel-eyebrow">YOUR HEALTH, YOUR TERMS</span><h2>Health information</h2><p>Keep important details close so your care team can support you better.</p></div><form className="dashboard-panel profile-form" onSubmit={onSubmit}><div className="form-section-title"><span className="health-summary-icon"><HeartPulse size={17} /></span><div><h3>Personal health details</h3><p>This information is private and only used to support your care.</p></div></div><div className="form-two-col"><label>Blood type<select name="bloodType" defaultValue={healthInfo.bloodType || ''}><option value="">Prefer not to say</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option></select></label><label>Allergies<input name="allergies" defaultValue={healthInfo.allergies || ''} placeholder="e.g. Penicillin, pollen" maxLength="500" /></label></div><label>Current medications<textarea name="medications" defaultValue={healthInfo.medications || ''} placeholder="List any current medications" rows="3" maxLength="500" /></label><label>Conditions or notes<textarea name="conditions" defaultValue={healthInfo.conditions || ''} placeholder="Anything you’d like your care team to know" rows="3" maxLength="500" /></label><div className="form-footer"><span><LockKeyhole size={14} /> Only you and your care team can see this.</span><button className="button" disabled={saving}>{saving ? 'Saving...' : 'Save health details'} <Check size={16} /></button></div></form></div>;
}

function ProfileForm({ user, onSubmit, saving }) {
  return <div className="dashboard-content inner-page"><div className="page-intro"><span className="panel-eyebrow">YOUR ACCOUNT</span><h2>My profile</h2><p>Keep your contact details up to date.</p></div><form className="dashboard-panel profile-form" onSubmit={onSubmit}><div className="form-section-title"><span className="profile-avatar-large">{user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><div><h3>Personal details</h3><p>Your information helps us make your care feel more personal.</p></div></div><label>Full name<input name="name" defaultValue={user.name} required maxLength="80" autoComplete="name" /></label><label>Email address<input value={user.email} disabled /></label><label>Phone number<input name="phone" type="tel" defaultValue={user.phone || ''} placeholder="(555) 000-0000" maxLength="30" autoComplete="tel" /></label><div className="form-footer"><span><ShieldCheck size={14} /> Your account is protected.</span><button className="button" disabled={saving}>{saving ? 'Saving...' : 'Save changes'} <Check size={16} /></button></div></form></div>;
}

export default App;
