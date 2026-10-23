import React from 'react';
import {
  ShieldCheck,
  Lock,
  X,
  Building,
  Users,
  CheckCircle2,
  FileText,
  Printer,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface SchoolGdprModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName?: string;
}

export const SchoolGdprModal: React.FC<SchoolGdprModalProps> = ({
  isOpen,
  onClose,
  schoolName = 'Bygg- & Anläggningsutbildning',
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between gap-3 bg-[#181818]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  GDPR & Skollagen
                </span>
                <span className="text-xs text-slate-400">• DPA-underlag</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Dataskydd & Skolintegritet i FältKoll
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-slate-400 hover:text-white hover:bg-[#222] rounded-xl transition-colors cursor-pointer"
              title="Skriv ut underlag till rektor eller IT"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-[#222] rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Summary Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#18201a] to-[#141414] border border-emerald-500/40 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wide">
              <Sparkles className="w-4 h-4" />
              <span>Sammanfattning för Rektor, IT-avdelning & Dataskyddsombud (DPO)</span>
            </div>
            <p className="text-xs text-slate-300">
              FältKoll är utformat med <strong>Privacy by Design</strong> för att uppfylla skollagens
              krav på elevers personliga integritet och EU:s dataskyddsförordning (GDPR). Systemet har
              en strikt teknisk integritetsvägg mellan driftansvarig och skolans elevinnehåll.
            </p>
          </div>

          {/* Section 1: Strict Privacy Wall */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-black text-sm">
              <Lock className="w-4 h-4 text-orange-400" />
              <span>1. Strikt Integritetsvägg mot Huvudadministratören</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#181818] border border-[#282828] space-y-2 text-xs">
              <p>
                <strong>Systemägaren (Huvudadministratören)</strong> fungerar uteslutande som teknisk
                driftleverantör och licensansvarig.
              </p>
              <ul className="space-y-1.5 list-disc list-inside text-slate-400">
                <li>
                  <strong className="text-white">Ingen insyn i elevtexter:</strong> Administratörskonton
                  har ingen tillgång till elevernas personliga fältanteckningar, loggböcker,
                  reflektioner eller kommentarer.
                </li>
                <li>
                  <strong className="text-white">Ingen åtkomst till fältbilder:</strong> Fotografier
                  och mätbevis som elever laddar upp under övningar är tekniskt spärrade för
                  huvudadministratören.
                </li>
                <li>
                  <strong className="text-white">Behörighetsstyrd åtkomst:</strong> Endast de
                  yrkeslärare som tilldelats respektive klass eller skola har behörighet att öppna och
                  granska elevernas arbeten.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2: Data Minimization */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-black text-sm">
              <Users className="w-4 h-4 text-sky-400" />
              <span>2. Dataminimering & Säker Registrering via Klasskoder</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#181818] border border-[#282828] space-y-2 text-xs">
              <ul className="space-y-1.5 list-disc list-inside text-slate-400">
                <li>
                  <strong className="text-white">Inga känsliga personuppgifter:</strong> Elever behöver
                  inte ange personnummer, hemadress, telefonnummer eller betalningsuppgifter.
                </li>
                <li>
                  <strong className="text-white">Klasskoder och Engångskoder:</strong> Läraren delar ut
                  en kod (t.ex. <code>BA24-BYGG</code>) till klassen. Eleven knyts automatiskt till rätt
                  lärare utan att externa system eller sociala medier blandas in.
                </li>
                <li>
                  <strong className="text-white">Ingen tredjepartsspårning:</strong> Appen innehåller
                  inga kommersiella analysverktyg, reklamspårare eller försäljning av användardata.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 3: Roles & Responsibility (PUB-avtal) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-black text-sm">
              <Building className="w-4 h-4 text-emerald-400" />
              <span>3. Personuppgiftsansvar & Biträdesavtal (DPA)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#181818] border border-[#282828] space-y-2 text-xs">
              <p>
                <strong>Skolan/Kommunen</strong> är <em>Personuppgiftsansvarig (PUA)</em> för elevernas
                studieresultat och fältdokumentation. <strong>FältKoll</strong> agerar{' '}
                <em>Personuppgiftsbiträde (PUB)</em>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="p-2.5 bg-[#121212] rounded-lg border border-[#242424]">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Kryptering & Överföring
                  </span>
                  <span className="text-slate-300 font-bold">
                    TLS 1.3 / HTTPS & Kryptering i vila (AES-256)
                  </span>
                </div>
                <div className="p-2.5 bg-[#121212] rounded-lg border border-[#242424]">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Serverplacering
                  </span>
                  <span className="text-slate-300 font-bold">
                    EU / Google Cloud Europe (europe-west1)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Deletion & Archiving */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-black text-sm">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>4. Gallring, Radering & Terminsslut</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#181818] border border-[#282828] space-y-1.5 text-xs text-slate-400">
              <p>
                Vid kurs- eller terminsslut kan yrkesläraren eller skolan med ett enkelt klick radera
                eller exportera elevers arbeten som slutbetygsunderlag/PDF. När ett elevkonto raderas
                tas tillhörande fältanteckningar bort ur det aktiva molnsystemet.
              </p>
            </div>
          </div>

          {/* Verification stamp */}
          <div className="p-3 bg-[#111] rounded-xl border border-[#242424] flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Gäller för: <strong>{schoolName}</strong></span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">Reviderad: 2026-10</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#262626] bg-[#181818] flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Detta dokument kan bifogas skolans IT- och dataskyddsärende.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-5 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs rounded-xl cursor-pointer transition-colors ml-auto"
          >
            Jag förstår & Stäng
          </button>
        </div>
      </div>
    </div>
  );
};
