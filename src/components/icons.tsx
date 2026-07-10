import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function IconBase({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return <IconBase {...props}><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></IconBase>;
}

export function BookIcon(props: IconProps) {
  return <IconBase {...props}><path d="M4.5 5.5A3.5 3.5 0 0 1 8 2h3v17H8a3.5 3.5 0 0 0-3.5 3V5.5ZM19.5 5.5A3.5 3.5 0 0 0 16 2h-3v17h3a3.5 3.5 0 0 1 3.5 3V5.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /></IconBase>;
}

export function CheckIcon(props: IconProps) {
  return <IconBase {...props}><path d="m5 12.5 4.25 4.25L19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></IconBase>;
}

export function ClockIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" /><path d="M12 7v5l3 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></IconBase>;
}

export function HomeIcon(props: IconProps) {
  return <IconBase {...props}><path d="m3.5 11 8.5-7 8.5 7v9h-6v-6h-5v6h-6v-9Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /></IconBase>;
}

export function LockIcon(props: IconProps) {
  return <IconBase {...props}><rect height="10" rx="2" stroke="currentColor" strokeWidth="1.7" width="15" x="4.5" y="10" /><path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke="currentColor" strokeWidth="1.7" /></IconBase>;
}

export function MicIcon(props: IconProps) {
  return <IconBase {...props}><rect height="11" rx="4" stroke="currentColor" strokeWidth="1.7" width="7" x="8.5" y="2.5" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></IconBase>;
}

export function ShieldIcon(props: IconProps) {
  return <IconBase {...props}><path d="M12 2.5 20 6v5.5c0 4.8-3.2 8.3-8 10-4.8-1.7-8-5.2-8-10V6l8-3.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /><path d="m8.5 12 2.25 2.25L15.5 9.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></IconBase>;
}

export function SoundIcon(props: IconProps) {
  return <IconBase {...props}><path d="M5 10v4h3l4 3V7l-4 3H5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /><path d="M15 9a4 4 0 0 1 0 6M17.5 6.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></IconBase>;
}

export function SparkIcon(props: IconProps) {
  return <IconBase {...props}><path d="M12 2.5c.7 4.7 2.8 6.8 7.5 7.5-4.7.7-6.8 2.8-7.5 7.5-.7-4.7-2.8-6.8-7.5-7.5C9.2 9.3 11.3 7.2 12 2.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" /><path d="M19 16.5c.25 1.7 1.05 2.5 2.75 2.75-1.7.25-2.5 1.05-2.75 2.75-.25-1.7-1.05-2.5-2.75-2.75 1.7-.25 2.5-1.05 2.75-2.75Z" fill="currentColor" /></IconBase>;
}
