import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { User } from '@supabase/supabase-js';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'home' | 'login' | 'register'>('home');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');
  const [gender, setGender] = useState('');

  // Check active session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Smooth scroll handler for nav links
  const scrollToSection = (id: string) => {
    if (view !== 'home') {
      setView('home');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: data.user.id,
          full_name: fullName,
          university: university,
          gender: gender,
          preferred_roommate_gender: 'No preference',
          accommodation_type: 'Single room',
          location: 'Campus',
          budget: 500
        }
      ]);

      if (profileError) {
        alert(profileError.message);
      } else {
        alert('Registration successful! Please sign in.');
        setView('login');
      }
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      setView('home');
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (user) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-navy mb-2">Welcome back!</h1>
          <p className="text-gray-600 mb-6">You are logged in as: {user.email}</p>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 rounded-xl font-medium hover:bg-red-700 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-4 border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('home')}>
            <div className="w-8 h-8 bg-purple text-white font-bold rounded-lg flex items-center justify-center text-lg">🏠</div>
            <span className="font-bold text-xl text-navy">RoomMatch</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <button onClick={() => scrollToSection('how-it-works')} className="text-gray-600 hover:text-navy font-medium text-sm transition">
              How it works
            </button>
            <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-navy font-medium text-sm transition">
              Features
            </button>
            <button onClick={() => scrollToSection('privacy')} className="text-gray-600 hover:text-navy font-medium text-sm transition">
              Privacy
            </button>
          </div>
        </div>

        <div className="space-x-4">
          <button onClick={() => setView('login')} className="px-4 py-2 text-navy font-medium hover:text-purple transition">Sign in</button>
          <button onClick={() => setView('register')} className="px-4 py-2 bg-navy text-white rounded-xl hover:opacity-90 transition">Get started</button>
        </div>
      </nav>

      {/* Views Controller */}
      {view === 'home' && (
        <div className="flex-1">
          {/* Hero Section */}
          <div className="py-16 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h1 className="text-5xl font-extrabold text-navy leading-tight mb-6">
                Find a roommate whose routine fits yours.
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                RoomMatch compares sleep schedules, cleanliness habits, study routines, and accommodation preferences to find your ideal university roommate.
              </p>
              <div className="flex items-center space-x-4">
                <button onClick={() => setView('register')} className="bg-purple text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:opacity-90 transition">
                  Create student account
                </button>
                <button onClick={() => scrollToSection('how-it-works')} className="px-6 py-4 border border-gray-200 text-navy rounded-xl font-semibold hover:bg-gray-50 transition">
                  See how it works
                </button>
              </div>
            </div>

            {/* Visual Illustration Card */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-72 h-72 bg-purple/10 rounded-full blur-3xl -z-10"></div>
              <div className="bg-white p-3 rounded-3xl border border-gray-100 shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80" 
                  alt="Students studying together" 
                  className="rounded-2xl w-full h-80 object-cover"
                />
              </div>
            </div>
          </div>

          {/* Feature Cards Section */}
          <div id="features" className="bg-slate-50 py-16 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-navy">Smart Compatibility Matching</h2>
                <p className="text-gray-600 mt-2">Designed around actual daily lifestyle habits rather than random guessing.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-left">
                  <div className="w-12 h-12 bg-purple/10 text-purple rounded-xl flex items-center justify-center font-bold text-2xl mb-4">🌙</div>
                  <h3 className="text-xl font-bold text-navy mb-2">Sleep Schedules</h3>
                  <p className="text-gray-600 text-sm">Match with early risers or night owls so your sleep routines never clash.</p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-left">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl mb-4">✨</div>
                  <h3 className="text-xl font-bold text-navy mb-2">Cleanliness & Habits</h3>
                  <p className="text-gray-600 text-sm">Align on room tidiness, guest rules, and study volume preferences.</p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-left">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center font-bold text-2xl mb-4">🏠</div>
                  <h3 className="text-xl font-bold text-navy mb-2">Accommodation Needs</h3>
                  <p className="text-gray-600 text-sm">Filter by budget range, location preferences, and single or shared room options.</p>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div id="how-it-works" className="py-16 px-6 max-w-6xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-navy mb-12">How RoomMatch Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-center">
                <div className="w-12 h-12 bg-navy text-white font-bold rounded-full flex items-center justify-center mx-auto text-lg">1</div>
                <h3 className="font-bold text-lg text-navy">Create Your Account</h3>
                <p className="text-sm text-gray-600">Register with your university email to join your school's verified network.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-center">
                <div className="w-12 h-12 bg-purple text-white font-bold rounded-full flex items-center justify-center mx-auto text-lg">2</div>
                <h3 className="font-bold text-lg text-navy">Complete Lifestyle Questionnaire</h3>
                <p className="text-sm text-gray-600">Answer key questions about your sleep, study habits, tidiness, and budget.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-center">
                <div className="w-12 h-12 bg-navy text-white font-bold rounded-full flex items-center justify-center mx-auto text-lg">3</div>
                <h3 className="font-bold text-lg text-navy">Get Compatible Matches</h3>
                <p className="text-sm text-gray-600">Review clustered profiles ordered by lifestyle similarity and connect safely.</p>
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div id="privacy" className="bg-slate-50 py-16 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <div className="w-12 h-12 bg-purple/10 text-purple rounded-2xl flex items-center justify-center font-bold text-2xl mx-auto mb-4">🛡️</div>
              <h2 className="text-3xl font-bold text-navy mb-4">Privacy & Verification First</h2>
              <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
                RoomMatch only grants access to verified students at your institution.
              </p>
            </div>
          </div>
        </div>
      )}

      {view === 'register' && (
        <div className="max-w-lg mx-auto my-12 p-8 bg-white rounded-2xl border border-gray-100 shadow-sm w-full">
          <div className="mb-4">
            <button onClick={() => setView('home')} className="text-sm text-purple font-semibold hover:underline">
              ← Back to home
            </button>
          </div>
          <h2 className="text-2xl font-bold text-navy mb-6">Create your account</h2>
          <form onSubmit={handleRegister} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input type="text" placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/50" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">University or institution</label>
              <input type="text" placeholder="e.g., USIU" value={university} onChange={e => setUniversity(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/50" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple/50">
                <option value="">Select Gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input type="email" placeholder="you@usiu.ac.ke" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/50" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/50" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <input type="password" placeholder="Repeat password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/50" />
            </div>

            <button type="submit" className="w-full bg-purple text-white p-4 rounded-xl font-semibold shadow-md hover:opacity-90 transition mt-2">
              Create account &rarr;
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">Already registered? <button onClick={() => setView('login')} className="text-purple font-semibold hover:underline">Log in</button></p>
        </div>
      )}

      {view === 'login' && (
        <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-gray-100 shadow-sm w-full">
          <div className="mb-4">
            <button onClick={() => setView('home')} className="text-sm text-purple font-semibold hover:underline">
              ← Back to home
            </button>
          </div>
          <h2 className="text-2xl font-bold text-navy mb-6">Welcome back</h2>
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input type="email" placeholder="you@usiu.ac.ke" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/50" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/50" />
            </div>

            <button type="submit" className="w-full bg-navy text-white p-4 rounded-xl font-semibold shadow-md hover:opacity-90 transition mt-2">
              Sign in
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">New to RoomMatch? <button onClick={() => setView('register')} className="text-purple font-semibold hover:underline">Create an account</button></p>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-500 bg-white">
        © {new Date().getFullYear()} RoomMatch. 
      </footer>
    </div>
  );
}