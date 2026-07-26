import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { toast } from 'sonner';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call to send request to admin
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      toast.success('Password reset request sent to Admin.');
    }, 1500);
  };

  const slideVariants = {
    enter: { x: 40, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -40, opacity: 0 }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-[420px] border border-zinc-200/80 dark:border-zinc-800/80 p-0 bg-white dark:bg-zinc-950 rounded-xl shadow-sm relative overflow-hidden">
        <div className="p-8 sm:p-12">
          
          <Link 
            to="/login"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-8 group w-fit"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to login
          </Link>

          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="form"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <div className="text-center mb-8">
                  <div className="inline-flex mb-5 text-zinc-900 dark:text-zinc-100">
                    <Lock size={44} strokeWidth={1.5} />
                  </div>
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight mb-2">
                    Reset Password
                  </h1>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                    Enter your email to request a password reset from the administrator.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide block px-1">
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors">
                        <Mail size={18} strokeWidth={1.5} />
                      </div>
                      <Input
                        placeholder="e.g. student@practicum.edu"
                        className="pl-12 py-3 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg focus:ring-4 focus:ring-zinc-950/10 focus:border-zinc-950 dark:focus:border-zinc-200 transition-all text-sm h-12 shadow-xs"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Error message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700"
                      >
                        <AlertCircle size={14} className="text-zinc-500 dark:text-zinc-400 shrink-0" />
                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-lg font-medium shadow-[0_1px_2px_0_rgba(0,0,0,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-zinc-500 dark:border-zinc-400 border-t-white dark:border-t-zinc-900 rounded-full"
                      />
                    ) : (
                      'Send Request to Admin'
                    )}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="text-center py-6"
              >
                <div className="inline-flex mb-6 text-zinc-900 dark:text-zinc-100">
                  <CheckCircle2 size={56} strokeWidth={1.5} className="text-zinc-900 dark:text-white" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-3">
                  Request Sent
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed mb-8">
                  Your password reset request has been forwarded to the system administrator. You will be notified via email once your password has been reset.
                </p>
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full h-12 bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-lg font-medium shadow-[0_1px_2px_0_rgba(0,0,0,0.4)] transition-all flex items-center justify-center"
                >
                  Return to Login
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
      
      <div className="mt-8 text-center space-y-2">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium tracking-tight">
          © 2026 Practicum Management System. All Rights Reserved.
        </p>
        <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em]">
          Secure Academic Portal
        </p>
      </div>
    </div>
  );
};
