'use client';

export function AuthDivider({ text }: { text: string }) {
  return (
    <div className="velar-auth-divider">
      <span />
      <p>{text}</p>
      <span />
    </div>
  );
}

export { AuthDivider as Divider };
