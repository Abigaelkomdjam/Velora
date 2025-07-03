// utils/auth.ts
export async function sendResetPasswordEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email,
    { redirectTo: 'velora://reset-password' }
  );
  if (error) throw error;
}
