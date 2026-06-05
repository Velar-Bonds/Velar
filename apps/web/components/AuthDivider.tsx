'use client';

export function AuthDivider({ text }: { text: string }) {
  return (
    <div className="my-4 flex items-center gap-3 py-1 lg:my-4">
      <span className="h-px flex-1 bg-[#d8e2f5]" />
      <span className="text-xs text-[#69789c] sm:text-sm">{text}</span>
      <span className="h-px flex-1 bg-[#d8e2f5]" />
    </div>
  );
}

export { AuthDivider as Divider };
