import Image from 'next/image';
interface Props { size?: number; dark?: boolean; className?: string }
export default function YamLogo({ size = 48, dark = false, className = '' }: Props) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image src="/yam-logo.png" alt="YAM Media" width={size} height={size}
             style={{ borderRadius: Math.round(size * 0.18), objectFit: 'contain' }} priority />
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900,
                      fontSize: size * 0.48, letterSpacing: '-0.02em',
                      color: dark ? 'white' : '#0D1B3E', lineHeight: 1 }}>YAM</div>
        <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 300,
                      fontSize: size * 0.20, letterSpacing: '0.32em', color: dark ? '#7EB8F7' : '#4A90D9',
                      textTransform: 'uppercase', lineHeight: 1.4 }}>MEDIA</div>
      </div>
    </div>
  );
}
