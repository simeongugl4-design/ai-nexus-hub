import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, Mail, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success("Check your email for reset instructions");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <KeyRound className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Reset Password</h1>
            <p className="text-sm text-muted-foreground mt-1">We'll send you a reset link</p>
          </div>
          {sent ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">Check your email for reset instructions.</p>
              <Link to="/login" className="text-primary text-sm hover:underline flex items-center justify-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Back to login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
              </div>
              <button type="submit" disabled={isLoading} className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
              <Link to="/login" className="block text-center text-xs text-muted-foreground hover:text-foreground">← Back to login</Link>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
