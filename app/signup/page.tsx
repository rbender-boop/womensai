'use client';

import { useState } from 'react';
import { Shield } from 'lucide-react';

export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire to Supabase auth
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <a href="/" className="text-sm text-warm-muted hover:text-warm-black mb-8 inline-block transition-colors">← Back</a>

        {submitted ? (
          <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1px solid #EDE8E3' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#F7ECF0' }}>
              <Shield size={20} style={{ color: '#9B4163' }} />
            </div>
            <h1 className="font-serif text-2xl font-bold text-warm-black mb-2">You&apos;re on the list</h1>
            <p className="text-sm text-warm-gray mb-4">We&apos;ll let you know when Pro launches. Your information is safe with us.</p>
            <a href="/" className="text-sm font-medium" style={{ color: '#9B4163' }}>← Back to searching</a>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid #EDE8E3', boxShadow: '0 4px 24px rgba(155, 65, 99, 0.06)' }}>
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-0.5 mb-2">
                <span className="font-serif text-xl font-bold text-warm-black">AskWomens</span>
                <span className="font-serif text-xl font-bold" style={{ color: '#9B4163' }}>AI</span>
              </div>
              <h1 className="font-serif text-2xl font-bold text-warm-black mb-1">Create your free account</h1>
              <p className="text-sm text-warm-gray">Save your searches and get a personalized experience.</p>
            </div>
