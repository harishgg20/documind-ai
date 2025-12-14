import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileText, ArrowRight, ShieldCheck, Sparkles, Image as ImageIcon, BrainCircuit, CheckCircle, Mail, Loader2, ArrowLeft } from 'lucide-react';

const AuthView: React.FC = () => {
  const { login, register, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(pwd)) return "Password must contain an uppercase letter.";
    if (!/[a-z]/.test(pwd)) return "Password must contain a lowercase letter.";
    if (!/[0-9]/.test(pwd)) return "Password must contain a number.";
    if (!/[!@#$%^&*]/.test(pwd)) return "Password must contain a special character (!@#$%^&*).";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        const pwdError = validatePassword(password);
        if (pwdError) {
          setError(pwdError);
          setIsLoading(false);
          return;
        }
        await register(name, email, password);
      } else {
        await resetPassword(email);
        setResetSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (newMode: 'login' | 'register' | 'forgot') => {
      setMode(newMode);
      setError(null);
      setResetSent(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f9] px-4 py-8 font-sans overflow-hidden relative">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-200/20 rounded-full blur-[100px]"></div>
         <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-purple-200/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center relative z-10">
        
        {/* Left Side: Product Information */}
        <div className="space-y-8 animate-in slide-in-from-left duration-700 fade-in">
           <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-normal text-[#1f1f1f] tracking-tight leading-tight">
                 Unlock insights from your <span className="text-google-blue font-medium">documents.</span>
              </h1>
              <p className="text-xl text-[#444746] leading-relaxed max-w-lg">
                 DocuMind transforms how you interact with information. Upload reports, research papers, or images and start a conversation instantly.
              </p>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="flex flex-col gap-3 p-5 bg-white rounded-[24px] border border-[#e1e3e1] shadow-sm hover:shadow-md transition-shadow">
                 <div className="w-10 h-10 rounded-full bg-[#e8f0fe] flex items-center justify-center text-google-blue">
                    <FileText className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="text-lg font-medium text-[#1f1f1f]">Chat with PDFs</h3>
                    <p className="text-sm text-[#444746] mt-1">Instant summaries and Q&A with strict page citations.</p>
                 </div>
              </div>

              <div className="flex flex-col gap-3 p-5 bg-white rounded-[24px] border border-[#e1e3e1] shadow-sm hover:shadow-md transition-shadow">
                 <div className="w-10 h-10 rounded-full bg-[#fce8e6] flex items-center justify-center text-google-red">
                    <ImageIcon className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="text-lg font-medium text-[#1f1f1f]">Visual Analysis</h3>
                    <p className="text-sm text-[#444746] mt-1">Analyze charts, diagrams, and photos with precision.</p>
                 </div>
              </div>

              <div className="flex flex-col gap-3 p-5 bg-white rounded-[24px] border border-[#e1e3e1] shadow-sm hover:shadow-md transition-shadow">
                 <div className="w-10 h-10 rounded-full bg-[#f3e8fd] flex items-center justify-center text-purple-600">
                    <BrainCircuit className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="text-lg font-medium text-[#1f1f1f]">Deep Thinking</h3>
                    <p className="text-sm text-[#444746] mt-1">Use the Thinking model for complex reasoning tasks.</p>
                 </div>
              </div>

              <div className="flex flex-col gap-3 p-5 bg-white rounded-[24px] border border-[#e1e3e1] shadow-sm hover:shadow-md transition-shadow">
                 <div className="w-10 h-10 rounded-full bg-[#e6f4ea] flex items-center justify-center text-google-green">
                    <ShieldCheck className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="text-lg font-medium text-[#1f1f1f]">Secure & Private</h3>
                    <p className="text-sm text-[#444746] mt-1">Enterprise-grade security for your sensitive data.</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[420px] bg-white rounded-[28px] p-8 md:p-10 shadow-google-hover border border-[#e1e3e1] animate-in slide-in-from-right duration-700 fade-in delay-100">
                
                {mode === 'forgot' && resetSent ? (
                    <div className="text-center animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-[#e6f4ea] text-google-green rounded-full flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-normal text-[#1f1f1f] mb-3">Check your inbox</h2>
                        <p className="text-[#444746] mb-8 leading-relaxed">
                            We've sent a password reset link to <br/>
                            <span className="font-medium text-[#1f1f1f]">{email}</span>
                        </p>
                        <button 
                            onClick={() => handleModeChange('login')}
                            className="w-full bg-google-blue text-white text-sm font-medium px-8 py-3 rounded-full hover:bg-blue-700 hover:shadow-md transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Sign in
                        </button>
                        <div className="mt-6">
                             <p className="text-xs text-[#444746]">Didn't receive the email? <button onClick={handleSubmit} disabled={isLoading} className="text-google-blue font-medium hover:underline disabled:opacity-50">Click to resend</button></p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center mb-4">
                            <div className="w-12 h-12 rounded-xl bg-google-blue flex items-center justify-center shadow-lg shadow-blue-200">
                                <Sparkles className="w-7 h-7 text-white" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-normal text-[#1f1f1f] mb-2">
                            {mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create Account' : 'Account Recovery'}
                        </h2>
                        <p className="text-base text-[#444746]">
                            {mode === 'login' && "to continue to DocuMind"}
                            {mode === 'register' && "to start your journey"}
                            {mode === 'forgot' && "Enter email to reset password"}
                        </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-[#fce8e6] text-[#b3261e] text-sm rounded-lg border border-[#f9d7d4]">
                                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {mode === 'register' && (
                            <div className="relative group">
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="peer w-full h-14 px-4 pt-4 border border-[#747775] rounded-[8px] bg-transparent text-[#1f1f1f] focus:outline-none focus:border-google-blue focus:border-2 placeholder-transparent"
                                placeholder="Full Name"
                                id="name-input"
                                disabled={isLoading}
                                />
                                <label 
                                htmlFor="name-input"
                                className="absolute left-3 top-2 text-xs text-[#747775] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:left-4 peer-focus:top-2 peer-focus:left-3 peer-focus:text-xs peer-focus:text-google-blue bg-white px-1 pointer-events-none"
                                >
                                Full Name
                                </label>
                            </div>
                        )}

                        <div className="relative group">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="peer w-full h-14 px-4 pt-4 border border-[#747775] rounded-[8px] bg-transparent text-[#1f1f1f] focus:outline-none focus:border-google-blue focus:border-2 placeholder-transparent"
                                placeholder="Email"
                                id="email-input"
                                disabled={isLoading}
                            />
                            <label 
                                htmlFor="email-input"
                                className="absolute left-3 top-2 text-xs text-[#747775] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:left-4 peer-focus:top-2 peer-focus:left-3 peer-focus:text-xs peer-focus:text-google-blue bg-white px-1 pointer-events-none"
                            >
                                Email
                            </label>
                        </div>

                        {mode !== 'forgot' && (
                            <div className="space-y-1">
                            <div className="relative group">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="peer w-full h-14 px-4 pt-4 border border-[#747775] rounded-[8px] bg-transparent text-[#1f1f1f] focus:outline-none focus:border-google-blue focus:border-2 placeholder-transparent"
                                    placeholder="Password"
                                    id="password-input"
                                    disabled={isLoading}
                                />
                                <label 
                                    htmlFor="password-input"
                                    className="absolute left-3 top-2 text-xs text-[#747775] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:left-4 peer-focus:top-2 peer-focus:left-3 peer-focus:text-xs peer-focus:text-google-blue bg-white px-1 pointer-events-none"
                                >
                                    Password
                                </label>
                            </div>
                            {mode === 'register' && (
                                <p className="text-[10px] text-[#444746] px-1 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Use 8+ characters with a mix of letters, numbers & symbols
                                </p>
                            )}
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                            {mode === 'login' ? (
                                <button type="button" disabled={isLoading} onClick={() => handleModeChange('register')} className="text-google-blue text-sm font-medium hover:bg-blue-50 px-2 py-1.5 rounded transition-colors">
                                    Create account
                                </button>
                            ) : (
                                <button type="button" disabled={isLoading} onClick={() => handleModeChange('login')} className="text-google-blue text-sm font-medium hover:bg-blue-50 px-2 py-1.5 rounded transition-colors">
                                    Sign in instead
                                </button>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-google-blue text-white text-sm font-medium px-8 py-3 rounded-full hover:bg-blue-700 hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        {mode === 'login' ? 'Next' : mode === 'register' ? 'Sign up' : 'Reset'}
                                        {mode !== 'forgot' && <ArrowRight className="w-4 h-4" />}
                                    </>
                                )}
                            </button>
                        </div>
                        
                        {mode === 'login' && (
                            <div className="text-right mt-2">
                                <button type="button" disabled={isLoading} onClick={() => handleModeChange('forgot')} className="text-google-blue text-sm font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                                Forgot password?
                                </button>
                            </div>
                        )}

                        </form>
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;