'use client';

export function Divider({ text }: { text: string }) {
  return (
    <div className="my-4 flex items-center gap-4 py-1 lg:my-5">
      <span className="h-px flex-1 bg-[#d8e2f5]" />
      <span className="text-sm text-[#69789c]">{text}</span>
      <span className="h-px flex-1 bg-[#d8e2f5]" />
    </div>
  );
}
