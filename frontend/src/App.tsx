import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { 
  Home, 
  Sparkles, 
  MessageSquare, 
  User as UserIcon, 
  Settings, 
  LogOut, 
  Bell, 
  PieChart, 
  Users, 
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'home' | 'login' | 'register' | 'dashboard'>('home');
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'messages' | 'profile' | 'settings'>('overview');
  
  // Form states
  const [username, setUsername] = useState('');
  const [loginInput, setLoginInput] = useState(''); // Holds username or email
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('USIU-Africa');
  const [gender, setGender] = useState('');

  // Lifestyle Preferences Questionnaire States
  const [preferredGender, setPreferredGender] = useState('No preference');
  const [accommodationType, setAccommodationType] = useState('Apartment');
  const [locationCampus, setLocationCampus] = useState('North Campus');
  const [monthlyBudget, setMonthlyBudget] = useState(780);
  const [sleepSchedule, setSleepSchedule] = useState('Early sleeper');
  const [cleanliness, setCleanliness] = useState('Very clean');
  const [studyHabits, setStudyHabits] = useState('Quiet environment');

  // Privacy & Settings States
  const [showGenderInMatches, setShowGenderInMatches] = useState(true);
  const [allowMatchInvitations, setAllowMatchInvitations] = useState(true);
  const [notifyMatches, setNotifyMatches] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);

  // Chat Messaging States
  const [messages, setMessages] = useState<any[]>([
    { id: '1', sender: 'Amina', text: 'Hi Maya! I noticed we’re both looking near North Campus.', time: '10:24' },
    { id: '2', sender: 'Maya', text: 'Hi Amina — yes! Your preference for a quiet study space stood out too.', time: '10:27' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  // Check active session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setView('dashboard');
        fetchUserProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setView('dashboard');
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setView('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch student profile from Supabase
  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data && !error) {
      setFullName(data.full_name || '');
      setUsername(data.username || '');
      setUniversity(data.university || 'USIU-Africa');
      setGender(data.gender || '');
      // Only set preferences if student has already completed them
      setPreferredGender(data.preferred_roommate_gender || '');
      setAccommodationType(data.accommodation_type || '');
      setLocationCampus(data.location || '');
      setMonthlyBudget(data.budget || 0);
      setSleepSchedule(data.sleeping_schedule || '');
      setCleanliness(data.cleanliness || '');
      setStudyHabits(data.study_habits || '');
    }
  };

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

  // Handle Registration - maps username to generated email internally if email not explicitly supplied
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const targetEmail = email.trim() ? email.trim() : `${cleanUsername}@usiu.ac.ke`;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: targetEmail,
        password,
        options: {
          data: {
            username: cleanUsername,
            full_name: fullName,
            university: university || 'USIU-Africa',
            gender: gender
          }
        }
      });

      if (error) {
        alert(error.message || "Registration failed. Please try again.");
        return;
      }

      if (data.user) {
        alert("Account created successfully! You can now log in using your username.");
        setView('login');
      }
    } catch (err: any) {
      alert(err.message || "An unexpected error occurred during registration.");
    }
  };

  // Handle Login using Username or Email
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetEmail = loginInput.trim();
    
    // If username supplied without '@', map to internal domain format
    if (!targetEmail.includes('@')) {
      targetEmail = `${targetEmail.toLowerCase()}@usiu.ac.ke`;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password,
    });

    if (error) {
      alert(error.message);
    } else if (data.user) {
      setUser(data.user);
      setView('dashboard');
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('home');
  };

  // Save updated profile preferences
  const handleSavePreferences = async () => {
    if (!user) return;
    const { error } = await supabase.from('profiles').upsert([
      {
        id: user.id,
        username: username,
        full_name: fullName,
        university: university,
        gender: gender,
        preferred_roommate_gender: preferredGender,
        accommodation_type: accommodationType,
        location: locationCampus,
        budget: monthlyBudget,
        sleeping_schedule: sleepSchedule,
        cleanliness: cleanliness,
        study_habits: studyHabits
      }
    ]);

    if (error) {
      alert("Failed to save preferences: " + error.message);
    } else {
      alert("Preferences saved successfully!");
    }
  };

  // Chat Send Handler
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'Maya', text: newMessage.trim(), time: timeStr }]);
    setNewMessage('');
  };

  // ---------------- STUDENT DASHBOARD VIEW ----------------
  if (view === 'dashboard' || user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans">
        {/* Dark Sidebar Navigation */}
        <aside className="w-64 bg-[#0f172a] text-white flex flex-col justify-between p-6 shrink-0 min-h-screen">
          <div>
            <div className="flex items-center space-x-3 cursor-pointer mb-8" onClick={() => setView('home')}>
              <div className="w-9 h-9 bg-[#7c3aed] rounded-xl flex items-center justify-center font-bold text-xl text-white">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">RoomMatch</span>
            </div>

            <div className="space-y-1 text-left">
              <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-3 px-3">YOUR SPACE</p>
              
              <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === 'overview' ? 'bg-[#1e293b] text-white font-semibold' : 'text-slate-400 hover:text-white'}`}>
                <Home className="w-4 h-4 text-slate-400" />
                <span>Overview</span>
              </button>

              <button onClick={() => setActiveTab('matches')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === 'matches' ? 'bg-[#1e293b] text-white font-semibold' : 'text-slate-400 hover:text-white'}`}>
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Matches</span>
              </button>

              <button onClick={() => setActiveTab('messages')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === 'messages' ? 'bg-[#1e293b] text-white font-semibold' : 'text-slate-400 hover:text-white'}`}>
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span>Messages</span>
                </div>
                <span className="bg-[#7c3aed] text-white text-xs px-2 py-0.5 rounded-full font-bold">2</span>
              </button>

              <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === 'profile' ? 'bg-[#1e293b] text-white font-semibold' : 'text-slate-400 hover:text-white'}`}>
                <UserIcon className="w-4 h-4 text-indigo-400" />
                <span>My profile</span>
              </button>

              <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === 'settings' ? 'bg-[#1e293b] text-white font-semibold' : 'text-slate-400 hover:text-white'}`}>
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center space-x-3 text-left">
                <div className="w-9 h-9 rounded-full bg-[#7c3aed] text-white font-bold flex items-center justify-center text-xs">
                  {fullName ? fullName.split(' ').map(n => n[0]).join('') : 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate">{fullName || 'Student'}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Top Header & Main Content Window */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
          <header className="h-16 border-b border-slate-200/80 bg-white px-8 flex items-center justify-between sticky top-0 z-40">
            <div className="text-left">
              <h4 className="text-sm font-bold text-[#1e293b]">{university}</h4>
              <p className="text-xs text-slate-500">Spring housing cycle</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
                <Bell className="w-4 h-4" />
              </button>
              <div className="flex items-center space-x-2 border border-slate-200 rounded-full px-3 py-1.5 cursor-pointer hover:bg-slate-50">
                <UserIcon className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-xs font-bold text-slate-800">{fullName ? fullName.split(' ')[0] : 'Account'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </header>

          <div className="p-8 max-w-6xl mx-auto w-full flex-1">
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-8 text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-[#7c3aed] tracking-wider uppercase">STUDENT DASHBOARD</span>
                    <h1 className="text-3xl font-extrabold text-[#1e293b] mt-1">Good morning, {fullName ? fullName.split(' ')[0] : 'Student'}</h1>
                    <p className="text-sm text-slate-500 mt-1">Your housing search is taking shape. Here's what's new in your workspace.</p>
                  </div>
                  <button onClick={() => setActiveTab('matches')} className="bg-[#7c3aed] text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:bg-[#6d28d9] transition text-sm">
                    Explore matches &rarr;
                  </button>
                </div>

                {/* Dashboard Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Profile completion</p>
                      <p className="text-3xl font-extrabold text-[#1e293b] mt-2">92%</p>
                      <p className="text-[11px] text-slate-400 mt-1">One section left</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#7c3aed] flex items-center justify-center font-bold">
                      <PieChart className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Potential matches</p>
                      <p className="text-3xl font-extrabold text-[#1e293b] mt-2">3</p>
                      <p className="text-[11px] text-slate-400 mt-1">Based on current filters</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Very high matches</p>
                      <p className="text-3xl font-extrabold text-[#1e293b] mt-2">1</p>
                      <p className="text-[11px] text-slate-400 mt-1">Eligible to connect</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/10 text-[#7c3aed] flex items-center justify-center font-bold">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Unread messages</p>
                      <p className="text-3xl font-extrabold text-[#1e293b] mt-2">2</p>
                      <p className="text-[11px] text-slate-400 mt-1">From 1 conversation</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Profile Strength Box */}
                <div className="bg-[#0f172a] text-white p-6 rounded-2xl shadow-md">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">PROFILE STRENGTH</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-4xl font-extrabold">92</span>
                    <span className="text-sm text-slate-400">/100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full my-4 overflow-hidden">
                    <div className="bg-[#7c3aed] h-full rounded-full w-[92%]"></div>
                  </div>
                  <p className="text-xs text-slate-300">Add a short bio to help potential roommates understand you.</p>
                  <button onClick={() => setActiveTab('profile')} className="mt-4 text-xs font-bold text-[#7c3aed] hover:underline flex items-center space-x-1">
                    <span>Complete profile</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. MATCHES TAB */}
            {activeTab === 'matches' && (
              <div className="space-y-6 text-left">
                <div>
                  <span className="text-xs font-bold text-[#7c3aed] tracking-wider uppercase">RECOMMENDATIONS</span>
                  <h1 className="text-3xl font-extrabold text-[#1e293b] mt-1">People who fit your rhythm</h1>
                  <p className="text-xs text-slate-500 mt-1">Gender preference is applied as a separate eligibility filter. It does not affect compatibility scores.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Amina Match Card */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-14 h-14 rounded-full bg-purple-100 text-[#7c3aed] font-bold flex items-center justify-center text-lg">AY</div>
                        <div>
                          <h3 className="font-bold text-lg text-[#1e293b] flex items-center space-x-1">
                            <span>Amina</span>
                            <span className="text-blue-500 text-xs">✓</span>
                          </h3>
                          <p className="text-xs text-slate-500">{university}</p>
                          <p className="text-xs text-slate-400">📍 North Campus</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-extrabold text-[#7c3aed]">100%</span>
                        <p className="text-[10px] text-purple-600 font-bold">Very high</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="bg-purple-50 text-[#7c3aed] px-3 py-1 rounded-full text-xs font-medium">✓ sleeping schedule</span>
                      <span className="bg-purple-50 text-[#7c3aed] px-3 py-1 rounded-full text-xs font-medium">✓ wake-up schedule</span>
                      <span className="bg-purple-50 text-[#7c3aed] px-3 py-1 rounded-full text-xs font-medium">✓ cleanliness</span>
                    </div>

                    <p className="text-xs text-slate-600">You both align on sleeping schedule, wake-up schedule, cleanliness.</p>
                    <button onClick={() => setActiveTab('messages')} className="w-full bg-[#7c3aed] text-white p-3 rounded-xl text-xs font-semibold hover:bg-[#6d28d9] transition">
                      Send message &rarr;
                    </button>
                  </div>

                  {/* Jules Match Card */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-lg">JC</div>
                        <div>
                          <h3 className="font-bold text-lg text-[#1e293b] flex items-center space-x-1">
                            <span>Jules</span>
                            <span className="text-blue-500 text-xs">✓</span>
                          </h3>
                          <p className="text-xs text-slate-500">{university}</p>
                          <p className="text-xs text-slate-400">📍 Riverside</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-extrabold text-blue-600">76%</span>
                        <p className="text-[10px] text-blue-600 font-bold">High</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">✓ wake-up schedule</span>
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">✓ cleanliness</span>
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">✓ study environment</span>
                    </div>

                    <p className="text-xs text-slate-600">You both align on wake-up schedule, cleanliness, study environment.</p>
                    <button onClick={() => setActiveTab('messages')} className="w-full border border-slate-200 text-[#1e293b] p-3 rounded-xl text-xs font-semibold hover:bg-slate-50 transition">
                      Send message &rarr;
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. MESSAGES TAB */}
            {activeTab === 'messages' && (
              <div className="space-y-6 text-left">
                <div>
                  <span className="text-xs font-bold text-[#7c3aed] tracking-wider uppercase">MESSAGES</span>
                  <h1 className="text-3xl font-extrabold text-[#1e293b] mt-1">Your conversations</h1>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm grid md:grid-cols-3 min-h-[500px] overflow-hidden">
                  <div className="border-r border-slate-100 p-4 space-y-4">
                    <input type="text" placeholder="🔍 Search conversations" className="w-full p-3 border border-slate-200 rounded-xl text-xs" />
                    <div className="p-3 bg-purple-50 rounded-xl flex items-center justify-between cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-purple-200 text-[#7c3aed] font-bold flex items-center justify-center text-xs">AY</div>
                        <div>
                          <p className="text-sm font-bold text-[#1e293b]">Amina</p>
                          <p className="text-xs text-slate-500 truncate w-32">Your preference for a quiet...</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">100%</span>
                    </div>
                  </div>

                  <div className="md:col-span-2 flex flex-col justify-between p-6 bg-slate-50/50">
                    <div className="space-y-4">
                      {messages.map((m) => (
                        <div key={m.id} className={`flex ${m.sender === 'Maya' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`p-4 rounded-2xl text-xs max-w-sm ${m.sender === 'Maya' ? 'bg-[#7c3aed] text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none shadow-sm'}`}>
                            <p>{m.text}</p>
                            <p className={`text-[9px] mt-1 text-right ${m.sender === 'Maya' ? 'text-purple-200' : 'text-slate-400'}`}>{m.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendMessage} className="flex space-x-3 mt-6">
                      <input type="text" placeholder="Write a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} className="flex-1 p-3 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none" />
                      <button type="submit" className="bg-[#7c3aed] text-white px-5 py-3 rounded-xl font-bold text-xs hover:bg-[#6d28d9] transition">Send</button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* 4. MY PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-6 text-left max-w-4xl">
                <div>
                  <span className="text-xs font-bold text-[#7c3aed] tracking-wider uppercase">PROFILE & PREFERENCES</span>
                  <h1 className="text-3xl font-extrabold text-[#1e293b] mt-1">Make your matches more accurate</h1>
                  <p className="text-xs text-slate-500 mt-1">Your answers can be updated at any time. Private identifiers are never shown on match cards.</p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Full name</label>
                      <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">University</label>
                      <input type="text" value={university} onChange={e => setUniversity(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Gender</label>
                      <select value={gender} onChange={e => setGender(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white">
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Preferred roommate gender</label>
                      <select value={preferredGender} onChange={e => setPreferredGender(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white">
                        <option value="No preference">No preference</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Accommodation type</label>
                      <select value={accommodationType} onChange={e => setAccommodationType(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white">
                        <option value="Apartment">Apartment</option>
                        <option value="Single room">Single room</option>
                        <option value="Shared room">Shared room</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Location or campus</label>
                      <input type="text" value={locationCampus} onChange={e => setLocationCampus(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Monthly budget ($)</label>
                      <input type="number" value={monthlyBudget} onChange={e => setMonthlyBudget(Number(e.target.value))} className="w-full p-3 border border-slate-200 rounded-xl text-sm" />
                    </div>
                  </div>

                  {/* Lifestyle Questionnaire Fields */}
                  <div className="pt-6 border-t border-slate-100 grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Sleeping schedule</label>
                      <select value={sleepSchedule} onChange={e => setSleepSchedule(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-white">
                        <option value="Early sleeper">Early sleeper</option>
                        <option value="Night owl">Night owl</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Cleanliness</label>
                      <select value={cleanliness} onChange={e => setCleanliness(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-white">
                        <option value="Very clean">Very clean</option>
                        <option value="Moderate">Moderate</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Study habits</label>
                      <select value={studyHabits} onChange={e => setStudyHabits(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-white">
                        <option value="Quiet environment">Quiet environment</option>
                        <option value="Group study">Group study</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button onClick={handleSavePreferences} className="bg-[#7c3aed] text-[#ffffff] px-8 py-3.5 rounded-xl font-semibold shadow-md hover:bg-[#6d28d9] transition text-sm">
                      Save preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="space-y-6 text-left max-w-4xl">
                <div>
                  <span className="text-xs font-bold text-[#7c3aed] tracking-wider uppercase">ACCOUNT</span>
                  <h1 className="text-3xl font-extrabold text-[#1e293b] mt-1">Settings & privacy</h1>
                  <p className="text-xs text-slate-500 mt-1">Control notifications, discovery, and account safety.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-[#1e293b]">Privacy</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-700">Show gender on eligible match cards</span>
                      <input type="checkbox" checked={showGenderInMatches} onChange={e => setShowGenderInMatches(e.target.checked)} className="w-4 h-4 text-[#7c3aed]" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-700">Allow new match invitations</span>
                      <input type="checkbox" checked={allowMatchInvitations} onChange={e => setAllowMatchInvitations(e.target.checked)} className="w-4 h-4 text-[#7c3aed]" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-[#1e293b]">Notifications</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-700">New high-compatibility matches</span>
                      <input type="checkbox" checked={notifyMatches} onChange={e => setNotifyMatches(e.target.checked)} className="w-4 h-4 text-[#7c3aed]" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-700">New messages</span>
                      <input type="checkbox" checked={notifyMessages} onChange={e => setNotifyMessages(e.target.checked)} className="w-4 h-4 text-[#7c3aed]" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-4 border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('home')}>
            <div className="w-8 h-8 bg-indigo-600 text-white font-bold rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">RoomMatch</span>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/50" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input type="text" placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/50" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">University or institution</label>
              <input type="text" placeholder="University or institution" value={university} onChange={e => setUniversity(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/50" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/50" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input type="text" placeholder="Username" value={loginInput} onChange={e => setLoginInput(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/50" />
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