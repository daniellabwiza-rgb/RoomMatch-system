import React, { useState, useEffect, useMemo } from 'react';
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
  const [loginInput, setLoginInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('USIU-Africa');
  const [gender, setGender] = useState('');

  // Lifestyle Preferences Questionnaire States (All 11 specified criteria)
  const [preferredGender, setPreferredGender] = useState('');
  const [accommodationType, setAccommodationType] = useState('');
  const [locationCampus, setLocationCampus] = useState('');
  const [minBudget, setMinBudget] = useState<number>(0);
  const [maxBudget, setMaxBudget] = useState<number>(0);
  
  const [sleepSchedule, setSleepSchedule] = useState('');
  const [wakeUpTime, setWakeUpTime] = useState('');
  const [smoking, setSmoking] = useState('');
  const [drinking, setDrinking] = useState('');
  const [cleanliness, setCleanliness] = useState('');
  const [noiseLevel, setNoiseLevel] = useState('');
  const [guests, setGuests] = useState('');
  const [foodPreference, setFoodPreference] = useState('');
  const [pets, setPets] = useState('');
  const [studyHabits, setStudyHabits] = useState('');

  // Derived Budget Category (low, medium, high based on midpoint of min and max)
  const budgetCategory = useMemo(() => {
    if (!minBudget && !maxBudget) return '';
    const mid = ((Number(minBudget) || 0) + (Number(maxBudget) || Number(minBudget) || 0)) / 2;
    if (mid <= 400) return 'low';
    if (mid <= 800) return 'medium';
    return 'high';
  }, [minBudget, maxBudget]);

  // Privacy & Settings States
  const [showGenderInMatches, setShowGenderInMatches] = useState(true);
  const [allowMatchInvitations, setAllowMatchInvitations] = useState(true);
  const [notifyMatches, setNotifyMatches] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);

  // Chat Messaging States
  const [messages, setMessages] = useState<any[]>([
    { id: '1', sender: 'Amina', text: 'Hi! I noticed we’re both looking near North Campus.', time: '10:24', unread: true },
    { id: '2', sender: 'Amina', text: 'Your preference for a quiet study space stood out too.', time: '10:27', unread: true }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [otherProfiles, setOtherProfiles] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState<boolean>(false);

  // Real Compatibility Scoring & Gender Eligibility Calculation
  const potentialMatchesList = useMemo(() => {
    return otherProfiles
      .filter((other) => {
        // Apply gender preference eligibility filter first (does not affect score)
        const userPref = (preferredGender || 'No preference').toLowerCase();
        const otherGender = (other.gender || '').toLowerCase();
        const otherPref = (other.preferred_roommate_gender || 'No preference').toLowerCase();
        const myGender = (gender || '').toLowerCase();

        const matchesMyPref = userPref === 'no preference' || userPref === '' || userPref === otherGender;
        const matchesTheirPref = otherPref === 'no preference' || otherPref === '' || otherPref === myGender;

        return matchesMyPref && matchesTheirPref;
      })
      .map((other) => {
        // Weighted scoring across all 11 lifestyle & budget preferences
        const otherSleep = other.sleep_schedule || other.sleeping_schedule || '';
        const otherWake = other.wake_up_time || '';
        const otherSmoking = other.smoking_preference || other.smoking || '';
        const otherDrinking = other.drinking_preference || other.drinking || '';
        const otherClean = other.cleanliness_level || other.cleanliness || '';
        const otherNoise = other.noise_level || '';
        const otherGuests = other.guest_preference || other.guests || '';
        const otherFood = other.food_preference || '';
        const otherPets = other.pet_preference || other.pets || '';
        const otherStudy = other.study_habits || '';
        const otherBudgetCat = other.budget_category || '';

        const comparisons = [
          { label: 'sleep schedule', mine: sleepSchedule, theirs: otherSleep, weight: 12 },
          { label: 'wake-up time', mine: wakeUpTime, theirs: otherWake, weight: 10 },
          { label: 'smoking', mine: smoking, theirs: otherSmoking, weight: 10 },
          { label: 'drinking', mine: drinking, theirs: otherDrinking, weight: 8 },
          { label: 'cleanliness', mine: cleanliness, theirs: otherClean, weight: 12 },
          { label: 'noise level', mine: noiseLevel, theirs: otherNoise, weight: 10 },
          { label: 'guests', mine: guests, theirs: otherGuests, weight: 8 },
          { label: 'food preference', mine: foodPreference, theirs: otherFood, weight: 6 },
          { label: 'pets', mine: pets, theirs: otherPets, weight: 8 },
          { label: 'study habits', mine: studyHabits, theirs: otherStudy, weight: 10 },
          { label: 'budget range', mine: budgetCategory, theirs: otherBudgetCat, weight: 6 }
        ];

        let totalScore = 0;
        const traits: string[] = [];

        comparisons.forEach((item) => {
          if (item.mine && item.theirs) {
            if (item.mine.toLowerCase() === item.theirs.toLowerCase()) {
              totalScore += item.weight;
              traits.push(item.label);
            } else if (
              (item.mine.toLowerCase() === 'flexible' || item.theirs.toLowerCase() === 'flexible') ||
              (item.mine.toLowerCase() === 'no preference' || item.theirs.toLowerCase() === 'no preference')
            ) {
              totalScore += Math.round(item.weight * 0.6);
            }
          }
        });

        const finalScore = Math.min(100, Math.max(25, totalScore));
        let tag = 'Moderate';
        if (finalScore >= 85) tag = 'Very high';
        else if (finalScore >= 70) tag = 'High';

        const displayName = other.full_name || other.username || 'Student';
        const initials = displayName
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return {
          id: other.id,
          name: displayName,
          initials: initials || 'ST',
          university: other.university || university,
          location: other.location || 'Campus Area',
          score: finalScore,
          tag,
          traits: traits.length > 0 ? traits : ['university network']
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [
    otherProfiles,
    preferredGender,
    gender,
    sleepSchedule,
    wakeUpTime,
    smoking,
    drinking,
    cleanliness,
    noiseLevel,
    guests,
    foodPreference,
    pets,
    studyHabits,
    budgetCategory,
    university
  ]);

  // Dynamic Calculations for Overview Dashboard
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const profileCompletion = useMemo(() => {
    const fields = [
      fullName,
      university,
      gender,
      preferredGender,
      accommodationType,
      locationCampus,
      minBudget > 0 ? 'min' : '',
      maxBudget > 0 ? 'max' : '',
      sleepSchedule,
      wakeUpTime,
      smoking,
      drinking,
      cleanliness,
      noiseLevel,
      guests,
      foodPreference,
      pets,
      studyHabits
    ];
    const filledCount = fields.filter(f => Boolean(f && String(f).trim() !== '')).length;
    return Math.round((filledCount / fields.length) * 100);
  }, [
    fullName,
    university,
    gender,
    preferredGender,
    accommodationType,
    locationCampus,
    minBudget,
    maxBudget,
    sleepSchedule,
    wakeUpTime,
    smoking,
    drinking,
    cleanliness,
    noiseLevel,
    guests,
    foodPreference,
    pets,
    studyHabits
  ]);

  const veryHighMatchesCount = useMemo(() => {
    return potentialMatchesList.filter(m => m.score >= 85).length;
  }, [potentialMatchesList]);

  const unreadMessagesCount = useMemo(() => {
    return messages.filter(m => m.unread).length;
  }, [messages]);

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

  // Fetch student profile & all other student profiles from Supabase
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
      setPreferredGender(data.preferred_roommate_gender || '');
      setAccommodationType(data.accommodation_type || '');
      setLocationCampus(data.location || '');
      setMinBudget(data.min_budget || 0);
      setMaxBudget(data.max_budget || data.budget || 0);
      setSleepSchedule(data.sleep_schedule || data.sleeping_schedule || '');
      setWakeUpTime(data.wake_up_time || '');
      setSmoking(data.smoking_preference || '');
      setDrinking(data.drinking_preference || '');
      setCleanliness(data.cleanliness_level || data.cleanliness || '');
      setNoiseLevel(data.noise_level || '');
      setGuests(data.guest_preference || '');
      setFoodPreference(data.food_preference || '');
      setPets(data.pet_preference || '');
      setStudyHabits(data.study_habits || '');
    }

    // Fetch all other real student profiles for dynamic matching
    setLoadingMatches(true);
    const { data: allUsersData, error: allUsersError } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userId);

    if (allUsersData && !allUsersError) {
      setOtherProfiles(allUsersData);
    }
    setLoadingMatches(false);
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

  // Handle Registration - maps username to generated email internally
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
    const midpoint = ((Number(minBudget) || 0) + (Number(maxBudget) || Number(minBudget) || 0)) / 2;

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
        min_budget: minBudget,
        max_budget: maxBudget,
        budget: midpoint,
        budget_category: budgetCategory,
        sleep_schedule: sleepSchedule,
        wake_up_time: wakeUpTime,
        smoking_preference: smoking,
        drinking_preference: drinking,
        cleanliness_level: cleanliness,
        noise_level: noiseLevel,
        guest_preference: guests,
        food_preference: foodPreference,
        pet_preference: pets,
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
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'Me', text: newMessage.trim(), time: timeStr, unread: false }]);
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

              <button 
                onClick={() => {
                  setActiveTab('messages');
                  setMessages(prev => prev.map(m => ({ ...m, unread: false })));
                }} 
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === 'messages' ? 'bg-[#1e293b] text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span>Messages</span>
                </div>
                {unreadMessagesCount > 0 && (
                  <span className="bg-[#7c3aed] text-white text-xs px-2 py-0.5 rounded-full font-bold">{unreadMessagesCount}</span>
                )}
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
                  {fullName ? fullName.split(' ').map(n => n[0]).join('') : (username ? username[0].toUpperCase() : 'U')}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate">{fullName || `@${username || 'student'}`}</p>
                  <p className="text-[10px] text-slate-400 truncate">{university}</p>
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
              <div onClick={() => setActiveTab('profile')} className="flex items-center space-x-2 border border-slate-200 rounded-full px-3 py-1.5 cursor-pointer hover:bg-slate-50">
                <UserIcon className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-xs font-bold text-slate-800">{fullName ? fullName.split(' ')[0] : `@${username || 'Account'}`}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </header>

          <div className="p-8 max-w-6xl mx-auto w-full flex-1">
            {/* 1. OVERVIEW TAB (DYNAMIC) */}
            {activeTab === 'overview' && (
              <div className="space-y-8 text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-[#7c3aed] tracking-wider uppercase">STUDENT DASHBOARD</span>
                    <h1 className="text-3xl font-extrabold text-[#1e293b] mt-1">
                      {timeGreeting}, {fullName ? fullName.split(' ')[0] : (username || 'Student')}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Your housing search is taking shape. Here's what's new in your workspace.</p>
                  </div>
                  <button onClick={() => setActiveTab('matches')} className="bg-[#7c3aed] text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:bg-[#6d28d9] transition text-sm">
                    Explore matches &rarr;
                  </button>
                </div>

                {/* Dynamic Dashboard Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Profile completion</p>
                      <p className="text-3xl font-extrabold text-[#1e293b] mt-2">{profileCompletion}%</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {profileCompletion === 100 ? 'All sections complete' : 'Complete preferences'}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#7c3aed] flex items-center justify-center font-bold">
                      <PieChart className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Potential matches</p>
                      <p className="text-3xl font-extrabold text-[#1e293b] mt-2">{potentialMatchesList.length}</p>
                      <p className="text-[11px] text-slate-400 mt-1">Based on current filters</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Very high matches</p>
                      <p className="text-3xl font-extrabold text-[#1e293b] mt-2">{veryHighMatchesCount}</p>
                      <p className="text-[11px] text-slate-400 mt-1">Eligible to connect</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/10 text-[#7c3aed] flex items-center justify-center font-bold">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Unread messages</p>
                      <p className="text-3xl font-extrabold text-[#1e293b] mt-2">{unreadMessagesCount}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {unreadMessagesCount > 0 ? 'From 1 conversation' : 'All caught up'}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Dynamic Profile Strength Box */}
                <div className="bg-[#0f172a] text-white p-6 rounded-2xl shadow-md">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">PROFILE STRENGTH</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-4xl font-extrabold">{profileCompletion}</span>
                    <span className="text-sm text-slate-400">/100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full my-4 overflow-hidden">
                    <div 
                      className="bg-[#7c3aed] h-full rounded-full transition-all duration-500" 
                      style={{ width: `${profileCompletion}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-300">
                    {profileCompletion === 100 
                      ? 'Your lifestyle profile is 100% complete! Your match accuracy is maximized.'
                      : 'Fill out your remaining lifestyle preferences so roommates understand your routine.'}
                  </p>
                  <button onClick={() => setActiveTab('profile')} className="mt-4 text-xs font-bold text-[#7c3aed] hover:underline flex items-center space-x-1">
                    <span>{profileCompletion === 100 ? 'Review profile' : 'Complete profile'}</span>
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

                {loadingMatches ? (
                  <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center text-sm text-slate-500">
                    Finding compatible student profiles...
                  </div>
                ) : potentialMatchesList.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center space-y-3">
                    <h3 className="text-base font-bold text-slate-800">No matching student profiles yet</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Create additional student accounts and complete their lifestyle preferences in the Profile tab to see real compatibility matches here.
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {potentialMatchesList.map((match) => (
                      <div key={match.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-3">
                            <div className="w-14 h-14 rounded-full bg-purple-100 text-[#7c3aed] font-bold flex items-center justify-center text-lg">{match.initials}</div>
                            <div>
                              <h3 className="font-bold text-lg text-[#1e293b] flex items-center space-x-1">
                                <span>{match.name}</span>
                                <CheckCircle2 className="w-4 h-4 text-blue-500 inline" />
                              </h3>
                              <p className="text-xs text-slate-500">{match.university}</p>
                              <p className="text-xs text-slate-400">{match.location}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-extrabold text-[#7c3aed]">{match.score}%</span>
                            <p className="text-[10px] text-purple-600 font-bold">{match.tag}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {match.traits.map((trait, idx) => (
                            <span key={idx} className="bg-purple-50 text-[#7c3aed] px-3 py-1 rounded-full text-xs font-medium">
                              ✓ {trait}
                            </span>
                          ))}
                        </div>

                        <p className="text-xs text-slate-600">You both align on {match.traits.join(', ')}.</p>
                        <button onClick={() => setActiveTab('messages')} className="w-full bg-[#7c3aed] text-white p-3 rounded-xl text-xs font-semibold hover:bg-[#6d28d9] transition">
                          Send message &rarr;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                    <input type="text" placeholder="Search conversations..." className="w-full p-3 border border-slate-200 rounded-xl text-xs" />
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
                        <div key={m.id} className={`flex ${m.sender === 'Me' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`p-4 rounded-2xl text-xs max-w-sm ${m.sender === 'Me' ? 'bg-[#7c3aed] text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none shadow-sm'}`}>
                            <p>{m.text}</p>
                            <p className={`text-[9px] mt-1 text-right ${m.sender === 'Me' ? 'text-purple-200' : 'text-slate-400'}`}>{m.time}</p>
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
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Username</label>
                      <input type="text" value={username} disabled className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-500" />
                    </div>

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
                        <option value="">Select gender...</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Preferred roommate gender</label>
                      <select value={preferredGender} onChange={e => setPreferredGender(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white">
                        <option value="">Select preference...</option>
                        <option value="No preference">No preference</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Accommodation type</label>
                      <select value={accommodationType} onChange={e => setAccommodationType(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white">
                        <option value="">Select accommodation...</option>
                        <option value="Apartment">Apartment</option>
                        <option value="Single room">Single room</option>
                        <option value="Shared room">Shared room</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Location or campus</label>
                      <input type="text" placeholder="e.g. North Campus" value={locationCampus} onChange={e => setLocationCampus(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Min budget ($)</label>
                        <input type="number" placeholder="300" value={minBudget || ''} onChange={e => setMinBudget(Number(e.target.value))} className="w-full p-3 border border-slate-200 rounded-xl text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Max budget ($)</label>
                        <input type="number" placeholder="750" value={maxBudget || ''} onChange={e => setMaxBudget(Number(e.target.value))} className="w-full p-3 border border-slate-200 rounded-xl text-sm" />
                      </div>
                    </div>
                  </div>

                  {budgetCategory && (
                    <div className="bg-purple-50 border border-purple-100 px-4 py-2.5 rounded-xl text-xs text-purple-800 flex items-center justify-between">
                      <span>Computed Budget Tier (based on min/max midpoint):</span>
                      <span className="font-bold uppercase">{budgetCategory}</span>
                    </div>
                  )}

                  {/* Comprehensive Lifestyle Questionnaire Fields (11 Criteria) */}
                  <div className="pt-6 border-t border-slate-100 space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-[#1e293b]">Lifestyle & Daily Routine Questionnaire</h3>
                      <p className="text-xs text-slate-500">Complete all preferences below to compute accurate compatibility matches.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      {/* 1. Sleep schedule */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">1. Sleep schedule</label>
                        <select value={sleepSchedule} onChange={e => setSleepSchedule(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-white">
                          <option value="">Select sleep schedule...</option>
                          <option value="early bird">Early bird</option>
                          <option value="flexible">Flexible</option>
                          <option value="night owl">Night owl</option>
                        </select>
                      </div>

                      {/* 2. Wake-up time */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">2. Wake-up time</label>
                        <select value={wakeUpTime} onChange={e => setWakeUpTime(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-white">
                          <option value="">Select wake-up time...</option>
                          <option value="early (before 6:00)">Early (before 6:00)</option>
                          <option value="mid (6:00 to 8:00)">Mid (6:00 to 8:00)</option>
                          <option value="late (after 8:00)">Late (after 8:00)</option>
                        </select>
                      </div>

                      {/* 3. Smoking */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">3. Smoking</label>
                        <select value={smoking} onChange={e => setSmoking(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-white">
                          <option value="">Select smoking habit...</option>
                          <option value="non-smoker">Non-smoker</option>
                          <option value="occasional">Occasional</option>
                          <option value="smoker">Smoker</option>
                        </select>
                      </div>

                      {/* 4. Drinking */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">4. Drinking</label>
                        <select value={drinking} onChange={e => setDrinking(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-white">
                          <option value="">Select drinking habit...</option>
                          <option value="non-drinker">Non-drinker</option>
                          <option value="social">Social</option>
                          <option value="drinker">Drinker</option>
                        </select>
                      </div>

                      {/* 5. Cleanliness */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">5. Cleanliness</label>
                        <select value={cleanliness} onChange={e => setCleanliness(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-white">
                          <option value="">Select cleanliness level...</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>

                      {/* 6. Noise level */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">6. Noise level</label>
                        <select value={noiseLevel} onChange={e => setNoiseLevel(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-white">
                          <option value="">Select noise tolerance...</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>

                      {/* 7. Guests */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">7. Guests</label>
                        <select value={guests} onChange={e => setGuests(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-white">
                          <option value="">Select guest frequency...</option>
                          <option value="rarely">Rarely</option>
                          <option value="sometimes">Sometimes</option>
                          <option value="frequently">Frequently</option>
                        </select>
                      </div>

                      {/* 8. Food preference */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">8. Food preference</label>
                        <select value={foodPreference} onChange={e => setFoodPreference(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-white">
                          <option value="">Select food preference...</option>
                          <option value="vegan">Vegan</option>
                          <option value="vegetarian">Vegetarian</option>
                          <option value="non-vegetarian">Non-vegetarian</option>
                          <option value="no preference">No preference</option>
                        </select>
                      </div>

                      {/* 9. Pets */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">9. Pets</label>
                        <select value={pets} onChange={e => setPets(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-white">
                          <option value="">Select pet preference...</option>
                          <option value="has pets">Has pets</option>
                          <option value="okay with pets">Okay with pets</option>
                          <option value="not okay with pets">Not okay with pets</option>
                          <option value="no pets">No pets</option>
                        </select>
                      </div>

                      {/* 10. Study habit */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">10. Study habit</label>
                        <select value={studyHabits} onChange={e => setStudyHabits(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-white">
                          <option value="">Select study habit...</option>
                          <option value="quiet">Quiet</option>
                          <option value="background noise okay">Background noise okay</option>
                          <option value="group study">Group study</option>
                          <option value="rarely studies at home">Rarely studies at home</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button onClick={handleSavePreferences} className="bg-[#7c3aed] text-white px-8 py-3.5 rounded-xl font-semibold shadow-md hover:bg-[#6d28d9] transition text-sm">
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
                  <span className="text-xs font-bold text-[#7c3aed] tracking-wider uppercase">ACCOUNT SETTINGS</span>
                  <h1 className="text-3xl font-extrabold text-[#1e293b] mt-1">Preferences & Privacy</h1>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-[#1e293b]">Show gender in match cards</p>
                      <p className="text-xs text-slate-500">Allow your verified gender to be visible to verified matches.</p>
                    </div>
                    <input type="checkbox" checked={showGenderInMatches} onChange={e => setShowGenderInMatches(e.target.checked)} className="w-5 h-5 accent-[#7c3aed]" />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-[#1e293b]">Allow match invitations</p>
                      <p className="text-xs text-slate-500">Let high-compatibility students message you directly.</p>
                    </div>
                    <input type="checkbox" checked={allowMatchInvitations} onChange={e => setAllowMatchInvitations(e.target.checked)} className="w-5 h-5 accent-[#7c3aed]" />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-[#1e293b]">Email notifications for new matches</p>
                      <p className="text-xs text-slate-500">Receive weekly digests when a new student matches above 80%.</p>
                    </div>
                    <input type="checkbox" checked={notifyMatches} onChange={e => setNotifyMatches(e.target.checked)} className="w-5 h-5 accent-[#7c3aed]" />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-bold text-[#1e293b]">Email notifications for messages</p>
                      <p className="text-xs text-slate-500">Get notified when a roommate sends you a chat message.</p>
                    </div>
                    <input type="checkbox" checked={notifyMessages} onChange={e => setNotifyMessages(e.target.checked)} className="w-5 h-5 accent-[#7c3aed]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ---------------- HOME / LANDING VIEW ----------------
  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-4 border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('home')}>
            <div className="w-8 h-8 bg-[#7c3aed] text-white font-bold rounded-lg flex items-center justify-center text-lg">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">RoomMatch</span>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <button onClick={() => scrollToSection('how-it-works')} className="text-gray-600 hover:text-slate-900 font-medium text-sm transition">
              How it works
            </button>
            <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-slate-900 font-medium text-sm transition">
              Features
            </button>
            <button onClick={() => scrollToSection('privacy')} className="text-gray-600 hover:text-slate-900 font-medium text-sm transition">
              Privacy
            </button>
          </div>
        </div>

        <div className="space-x-4">
          <button onClick={() => setView('login')} className="px-4 py-2 text-slate-900 font-medium hover:text-[#7c3aed] transition">Sign in</button>
          <button onClick={() => setView('register')} className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:opacity-90 transition">Get started</button>
        </div>
      </nav>

      {/* Views Controller */}
      {view === 'home' && (
        <div className="flex-1">
          {/* Hero Section */}
          <div className="py-16 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h1 className="text-5xl font-extrabold text-slate-900 leading-tight mb-6">
                Find a roommate whose routine fits yours.
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                RoomMatch compares sleep schedules, cleanliness habits, study routines, and accommodation preferences to find your ideal university roommate.
              </p>
              <div className="flex items-center space-x-4">
                <button onClick={() => setView('register')} className="bg-[#7c3aed] text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:opacity-90 transition">
                  Create student account
                </button>
                <button onClick={() => scrollToSection('how-it-works')} className="px-6 py-4 border border-gray-200 text-slate-900 rounded-xl font-semibold hover:bg-gray-50 transition">
                  See how it works
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-4 -left-4 w-72 h-72 bg-[#7c3aed]/10 rounded-full blur-3xl -z-10"></div>
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
                <h2 className="text-3xl font-bold text-slate-900">Smart Compatibility Matching</h2>
                <p className="text-gray-600 mt-2">Designed around actual daily lifestyle habits rather than random guessing.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-left">
                  <div className="w-12 h-12 bg-[#7c3aed]/10 text-[#7c3aed] rounded-xl flex items-center justify-center font-bold text-2xl mb-4">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Sleep Schedules</h3>
                  <p className="text-gray-600 text-sm">Match with early risers or night owls so your sleep routines never clash.</p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-left">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl mb-4">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Cleanliness & Habits</h3>
                  <p className="text-gray-600 text-sm">Align on room tidiness, guest rules, and study volume preferences.</p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-left">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center font-bold text-2xl mb-4">
                    <Home className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Accommodation Needs</h3>
                  <p className="text-gray-600 text-sm">Filter by budget range, location preferences, and single or shared room options.</p>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div id="how-it-works" className="py-16 px-6 max-w-6xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-12">How RoomMatch Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-center">
                <div className="w-12 h-12 bg-slate-900 text-white font-bold rounded-full flex items-center justify-center mx-auto text-lg">1</div>
                <h3 className="font-bold text-lg text-slate-900">Create Your Account</h3>
                <p className="text-sm text-gray-600">Register with your student username to join your university network.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-center">
                <div className="w-12 h-12 bg-[#7c3aed] text-white font-bold rounded-full flex items-center justify-center mx-auto text-lg">2</div>
                <h3 className="font-bold text-lg text-slate-900">Complete Lifestyle Questionnaire</h3>
                <p className="text-sm text-gray-600">Answer key questions about your sleep, study habits, tidiness, and budget.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-center">
                <div className="w-12 h-12 bg-slate-900 text-white font-bold rounded-full flex items-center justify-center mx-auto text-lg">3</div>
                <h3 className="font-bold text-lg text-slate-900">Get Compatible Matches</h3>
                <p className="text-sm text-gray-600">Review clustered profiles ordered by lifestyle similarity and connect safely.</p>
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div id="privacy" className="bg-slate-50 py-16 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <div className="w-12 h-12 bg-[#7c3aed]/10 text-[#7c3aed] rounded-2xl flex items-center justify-center font-bold text-2xl mx-auto mb-4">
                <UserIcon className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Privacy & Verification First</h2>
              <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
                RoomMatch only grants access to verified students at your institution.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER VIEW */}
      {view === 'register' && (
        <div className="max-w-lg mx-auto my-12 p-8 bg-white rounded-2xl border border-gray-100 shadow-sm w-full text-left">
          <div className="mb-4">
            <button onClick={() => setView('home')} className="text-sm text-[#7c3aed] font-semibold hover:underline">
              ← Back to home
            </button>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Create your student account</h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input type="text" placeholder="e.g. daniella" value={username} onChange={e => setUsername(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input type="text" placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">University or institution</label>
              <input type="text" value={university} onChange={e => setUniversity(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50">
                <option value="">Select Gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <input type="password" placeholder="Repeat password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50" />
            </div>

            <button type="submit" className="w-full bg-[#7c3aed] text-white p-4 rounded-xl font-semibold shadow-md hover:opacity-90 transition mt-2">
              Create account &rarr;
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">Already registered? <button onClick={() => setView('login')} className="text-[#7c3aed] font-semibold hover:underline">Log in</button></p>
        </div>
      )}

      {/* LOGIN VIEW (BY USERNAME OR EMAIL) */}
      {view === 'login' && (
        <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-gray-100 shadow-sm w-full text-left">
          <div className="mb-4">
            <button onClick={() => setView('home')} className="text-sm text-[#7c3aed] font-semibold hover:underline">
              ← Back to home
            </button>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Welcome back</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username or email</label>
              <input type="text" placeholder="e.g. daniella" value={loginInput} onChange={e => setLoginInput(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50" />
            </div>

            <button type="submit" className="w-full bg-slate-900 text-white p-4 rounded-xl font-semibold shadow-md hover:opacity-90 transition mt-2">
              Sign in
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">New to RoomMatch? <button onClick={() => setView('register')} className="text-[#7c3aed] font-semibold hover:underline">Create an account</button></p>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-500 bg-white">
        © {new Date().getFullYear()} RoomMatch. 
      </footer>
    </div>
  );
}