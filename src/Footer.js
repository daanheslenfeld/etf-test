import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#0F1014] border-t border-gray-800 text-gray-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Disclaimer Section */}
        <div className="mb-8 space-y-4 text-xs leading-relaxed">
          <p>
            Beleggen brengt risico's met zich mee. De waarde van je investering kan dalen of stijgen.
            Het geïnvesteerde kapitaal kan verloren gaan. In het verleden behaalde resultaten, simulaties
            of voorspellingen zijn geen betrouwbare indicator voor toekomstige prestaties. Raadpleeg onze
            risico-informatie.
          </p>
          <p>
            *2% rente p.j. (variabel) op Broker-saldi, onbeperkt met PRIME+ en tot € 100.000 met de FREE broker.
            Het rentepercentage is o.a. gebaseerd op de respectieve marktrente. De allocatie van kassaldi is variabel,
            en houdt rekening met beschikbare capaciteiten en voorwaarden. Saldi bij banken zijn beschermd tot € 100.000
            per klant per bank onder de wettelijke depositogarantie. Voor gekwalificeerde geldmarktfondsen gelden in plaats
            van de wettelijke depositogarantie de Europese regels ter bescherming van beleggers (ICBE's), ongeacht het bedrag.
          </p>
          <p>
            Bekijk alsjeblieft onze risico-informatie over het veilig bewaren van kassaldi. Voor meer informatie over rente
            zie <a href="https://scalable.capital/rente" className="text-[#28EBCF] hover:underline">scalable.capital/rente</a>.
          </p>
        </div>

        {/* Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-white mb-3">Scalable Capital</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-[#28EBCF] transition-colors">Status</a></li>
              <li><a href="#" className="hover:text-[#28EBCF] transition-colors">Carrières</a></li>
              <li><a href="#" className="hover:text-[#28EBCF] transition-colors">Newsroom</a></li>
              <li><a href="#" className="hover:text-[#28EBCF] transition-colors">Veiligheid</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Informatie</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-[#28EBCF] transition-colors">Documenten</a></li>
              <li><a href="#" className="hover:text-[#28EBCF] transition-colors">Privacybeleid</a></li>
              <li><a href="#" className="hover:text-[#28EBCF] transition-colors">Sustainability-related disclosures</a></li>
              <li><a href="#" className="hover:text-[#28EBCF] transition-colors">Privacy-instellingen</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-gray-800 text-xs text-gray-500">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2">
              <a href="#" className="hover:text-[#28EBCF] transition-colors">Over ons</a>
              <span className="hidden md:inline">|</span>
              <a href="#" className="hover:text-[#28EBCF] transition-colors">Contact</a>
              <span className="hidden md:inline">|</span>
              <a href="#" className="hover:text-[#28EBCF] transition-colors">Juridische kennisgeving</a>
            </div>
            <div className="text-center md:text-right">
              Copyright © Scalable Capital Bank GmbH | Alle rechten voorbehouden.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
