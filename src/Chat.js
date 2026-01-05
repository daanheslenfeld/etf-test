import React, { useState, useRef, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Chat = ({ isOpen, onClose, user }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Hallo! Ik ben Daan van PIGG. Waarmee kan ik je helpen?',
      sender: 'bot',
      timestamp: new Date(),
      staffName: 'Daan'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [conversationId, setConversationId] = useState(null);
  const [showArchive, setShowArchive] = useState(false);
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [needsHumanReview, setNeedsHumanReview] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history when chat opens
  useEffect(() => {
    if (isOpen && user) {
      loadConversationHistory();
      loadArchivedConversations();
    }
  }, [isOpen, user]);

  // Load current conversation history
  const loadConversationHistory = async () => {
    try {
      const savedConversation = localStorage.getItem(`chat_conversation_${user?.email}`);
      if (savedConversation) {
        const parsed = JSON.parse(savedConversation);
        if (parsed.messages && parsed.messages.length > 1) {
          setMessages(parsed.messages);
          setConversationId(parsed.id);
          setNeedsHumanReview(parsed.needsHumanReview || false);
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  // Load archived conversations
  const loadArchivedConversations = async () => {
    try {
      const archived = localStorage.getItem(`chat_archive_${user?.email}`);
      if (archived) {
        setArchivedConversations(JSON.parse(archived));
      }
    } catch (error) {
      console.error('Error loading archive:', error);
    }
  };

  // Save conversation to localStorage
  const saveConversation = (updatedMessages, flagForReview = false) => {
    if (!user) return;

    const conversation = {
      id: conversationId || Date.now(),
      userId: user.email,
      messages: updatedMessages,
      lastUpdated: new Date().toISOString(),
      needsHumanReview: flagForReview || needsHumanReview
    };

    localStorage.setItem(`chat_conversation_${user.email}`, JSON.stringify(conversation));

    if (!conversationId) {
      setConversationId(conversation.id);
    }
  };

  // Close and archive current conversation
  const archiveConversation = () => {
    if (!user || messages.length <= 1) return;

    const conversation = {
      id: conversationId || Date.now(),
      userId: user.email,
      messages: messages,
      closedAt: new Date().toISOString(),
      needsHumanReview: needsHumanReview
    };

    // Add to archive
    const archived = JSON.parse(localStorage.getItem(`chat_archive_${user.email}`) || '[]');
    archived.unshift(conversation); // Add to beginning
    localStorage.setItem(`chat_archive_${user.email}`, JSON.stringify(archived.slice(0, 50))); // Keep last 50

    // Clear current conversation
    localStorage.removeItem(`chat_conversation_${user.email}`);

    // Reset state
    setMessages([{
      id: 1,
      text: 'Hallo! Ik ben Daan van PIGG. Waarmee kan ik je helpen?',
      sender: 'bot',
      timestamp: new Date(),
      staffName: 'Daan'
    }]);
    setConversationId(null);
    setNeedsHumanReview(false);

    // Reload archive
    loadArchivedConversations();
  };

  // Load archived conversation
  const loadArchivedConversation = (conversation) => {
    setMessages(conversation.messages);
    setConversationId(conversation.id);
    setNeedsHumanReview(conversation.needsHumanReview || false);
    setShowArchive(false);
  };

  const handleContactFormSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/chat-inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: contactFormData.name,
          email: contactFormData.email,
          phone: contactFormData.phone,
          question: messages[messages.length - 2]?.text || '', // Get the user's last question
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        const botResponse = {
          id: messages.length + 1,
          text: 'Bedankt! Ik heb je gegevens ontvangen en zal zo snel mogelijk met een antwoord terugkomen via e-mail.',
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
        setShowContactForm(false);
        setContactFormData({ name: '', email: '', phone: '' });
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      const errorResponse = {
        id: messages.length + 1,
        text: 'Er ging iets mis bij het versturen. Probeer het nog eens of neem contact met ons op via de website.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const currentMessageCount = messages.length;
    const userMessageText = inputMessage;

    const userMessage = {
      id: currentMessageCount + 1,
      text: userMessageText,
      sender: 'user',
      timestamp: new Date()
    };

    const updatedMessagesWithUser = [...messages, userMessage];
    setMessages(updatedMessagesWithUser);
    setInputMessage('');
    setIsTyping(true);

    // Save user message
    saveConversation(updatedMessagesWithUser);

    // Simulate bot response
    setTimeout(() => {
      const responseResult = getBotResponse(userMessageText, updatedMessagesWithUser);

      if (responseResult.type === 'ESCALATE') {
        const botResponse = {
          id: currentMessageCount + 2,
          text: 'Dit is een goede vraag waar ik even over na moet denken. Ik ga dit voor je uitzoeken en kom er zo snel mogelijk op terug. Je kunt ondertussen gewoon verder chatten met andere vragen!',
          sender: 'bot',
          timestamp: new Date(),
          staffName: 'Daan',
          needsReview: true
        };
        const finalMessages = [...updatedMessagesWithUser, botResponse];
        setMessages(finalMessages);
        setNeedsHumanReview(true);
        saveConversation(finalMessages, true);
      } else {
        const botResponse = {
          id: currentMessageCount + 2,
          text: responseResult.text,
          sender: 'bot',
          timestamp: new Date(),
          staffName: 'Daan'
        };
        const finalMessages = [...updatedMessagesWithUser, botResponse];
        setMessages(finalMessages);
        saveConversation(finalMessages);
      }
      setIsTyping(false);
    }, 1000);
  };

  const getBotResponse = (userInput, conversationHistory) => {
    const input = userInput.toLowerCase();

    // Check for complex/specific questions that need human review
    const complexIndicators = [
      'belastingaangifte', 'specifieke situatie', 'juridisch', 'advocaat',
      'exact bedrag', 'garantie', 'verzekering', 'pensioenaanspraak',
      'contract', 'overeenkomst', 'exacte cijfers', 'specificaties'
    ];

    const isComplex = complexIndicators.some(indicator => input.includes(indicator));
    const isVeryLong = userInput.length > 200; // Very detailed question
    const hasMultipleQuestions = (userInput.match(/\?/g) || []).length > 2;

    if (isComplex || (isVeryLong && hasMultipleQuestions)) {
      return { type: 'ESCALATE', text: '' };
    }

    // Greeting responses
    if (input.includes('hoi') || input.includes('hallo') || input.includes('hey') || input.includes('dag')) {
      return { type: 'RESPONSE', text: 'Hallo! Fijn dat je er bent. Ik ben Daan en help je graag met al je vragen over beleggen bij PIGG. Hoe kan ik je vandaag helpen?' };
    }

    // Opening an account
    if (input.includes('account') || input.includes('rekening') || input.includes('aanmelden') || input.includes('registreer') || input.includes('inschrijv') ||
        (input.includes('hoe') && (input.includes('open') || input.includes('start') || input.includes('begin')))) {
      return { type: 'RESPONSE', text: 'Door op de "Start nu" button te klikken opent een kort vragen programma. Wanneer je alle vragen beantwoord hebt, heb je gratis toegang tot het PIGG platform en kun je jouw portefeuille samenstellen of kiezen voor een door ons samengestelde portefeuille. Wanneer je dan vervolgens wilt gaan beleggen, dan stellen wij jou nog een aantal vragen, kun je geld storten en wordt jouw geld belegd. Het hele proces duurt ongeveer 10 minuten van begin tot aan beleggen.' };
    }

    // Minimum investment amount
    if (input.includes('minimum') || input.includes('minimaal') || input.includes('hoeveel') && (input.includes('geld') || input.includes('bedrag') || input.includes('nodig'))) {
      return { type: 'RESPONSE', text: 'Bij PIGG kun je al starten met beleggen vanaf een klein bedrag. In tegenstelling tot traditionele vermogensbeheerders die vaak € 50.000 tot € 200.000 vereisen, is PIGG toegankelijk voor iedereen die wil beginnen met vermogensopbouw.' };
    }

    // Costs and fees
    if (input.includes('kosten') || input.includes('cost') || input.includes('fee') || input.includes('tarief') || input.includes('prijs')) {
      return { type: 'RESPONSE', text: 'Bij PIGG betaal je € 200 per jaar voor een betaald account. Dit geeft je toegang tot de volledige ETF database en portfolio tools. Daarnaast zijn er de gebruikelijke ETF kosten (TER), die meestal tussen 0.07% en 0.50% per jaar liggen. Geen verborgen kosten of hoge beheervergoedingen!' };
    }

    // Risk questions
    if (input.includes('risico') || input.includes('risk') || input.includes('veilig') || input.includes('gevaarlijk')) {
      return { type: 'RESPONSE', text: 'Beleggen kent altijd risico\'s. De waarde van je investering kan dalen of stijgen. Bij PIGG analyseren we je persoonlijke risicoprofiel en stellen we een passende portefeuille samen. We helpen je om bewuste keuzes te maken die bij jouw situatie passen.' };
    }

    // Cancellation/termination
    if (input.includes('opzeggen') || input.includes('stop') || input.includes('beëindig') || input.includes('annuleer')) {
      return { type: 'RESPONSE', text: 'Bij PIGG heb je volledige flexibiliteit. Je kunt je account op elk moment stopzetten zonder opzegtermijn of boetes. Jouw vermogen blijft altijd van jou en je hebt er dagelijks toegang toe.' };
    }

    // Safety and security
    if (input.includes('veilig') || input.includes('faillissement') || input.includes('bescherm') || input.includes('garantie')) {
      return { type: 'RESPONSE', text: 'Je vermogen bij PIGG is goed beschermd. Je beleggingen staan op jouw naam bij de depotbank en zijn gescheiden van het bedrijfsvermogen. Mocht PIGG ooit failliet gaan, dan blijft jouw geld gewoon van jou. PIGG staat onder toezicht van de AFM en DNB.' };
    }

    // Investment options
    if (input.includes('etf') || input.includes('waarin') && input.includes('beleg')) {
      return { type: 'RESPONSE', text: 'Bij PIGG kun je beleggen in meer dan 3000 ETF\'s wereldwijd. ETFs zijn beleggingsfondsen die verhandeld worden zoals aandelen. Je kunt kiezen uit verschillende categorieën zoals aandelen, obligaties, vastgoed en meer. Bekijk onze ETF database voor alle mogelijkheden!' };
    }

    // Portfolio building
    if (input.includes('portfolio') || input.includes('portefeuille') || input.includes('samenstel')) {
      return { type: 'RESPONSE', text: 'Je kunt bij PIGG op twee manieren een portfolio samenstellen: kies een van onze vooraf samengestelde portefeuilles op basis van je risicoprofiel, of stel zelf je eigen portfolio samen met onze Portfolio Builder. Beide opties geven je volledige controle over je beleggingen.' };
    }

    // Why invest
    if (input.includes('waarom') && (input.includes('beleg') || input.includes('investeer'))) {
      return { type: 'RESPONSE', text: 'Door te beleggen kun je je vermogen laten groeien door middel van rente-op-rente effect. Je ontvangt rendementen die je opnieuw belegt, waardoor je vermogen cumulatief kan groeien. Dit is vooral voordelig op de lange termijn en helpt je financiële doelen te bereiken.' };
    }

    // Inheritance/starting capital
    if (input.includes('erfenis') || input.includes('geërfd') || input.includes('ontvangen')) {
      return { type: 'RESPONSE', text: 'Als je een erfenis hebt ontvangen en het geld niet direct nodig hebt, is beleggen een uitstekende optie. Het voorkomt dat je vermogen waarde verliest door inflatie en kan zelfs groeien. PIGG helpt je om dit vermogen verstandig te beheren.' };
    }

    // Children/long term
    if (input.includes('kind') || input.includes('kleinkinderen') || input.includes('lange termijn')) {
      return { type: 'RESPONSE', text: 'Ja, beleggen voor kinderen of kleinkinderen is een geweldige manier om een financieel fundament te leggen. Een lange beleggingshorizon is juist voordelig voor cumulatieve rendementen. Hoe eerder je begint, hoe meer tijd je vermogen heeft om te groeien!' };
    }

    // Supervision/regulation
    if (input.includes('toezicht') || input.includes('afm') || input.includes('vergunning') || input.includes('dnb')) {
      return { type: 'RESPONSE', text: 'PIGG is een erkend platform en houdt zich aan alle financiële regelgeving. We opereren transparant en staan onder toezicht van de relevante autoriteiten. Jouw veiligheid en vertrouwen zijn onze prioriteit.' };
    }

    // Help/support
    if (input.includes('help') || input.includes('hulp') || input.includes('vraag')) {
      return { type: 'RESPONSE', text: 'Ik kan je helpen met vragen over: beleggen bij PIGG, kosten en tarieven, risico\'s, ETF\'s, portfolio samenstellen, opzeggen, veiligheid en veel meer. Stel gerust je vraag!' };
    }

    // Contact
    if (input.includes('contact') || input.includes('bellen') || input.includes('mail') || input.includes('bereik')) {
      return { type: 'RESPONSE', text: 'Je kunt contact met ons opnemen via de contactgegevens in de footer van de website. We helpen je graag verder met al je vragen over beleggen bij PIGG!' };
    }

    // Complaint
    if (input.includes('klacht') || input.includes('ontevreden') || input.includes('probleem')) {
      return { type: 'RESPONSE', text: 'Het spijt me dat je niet tevreden bent. Laat het ons weten via onze contactpagina, dan kijken we hoe we het kunnen oplossen. Mocht je niet tevreden zijn met de afhandeling, dan kun je ook een klacht indienen bij de Ombudsman van het Kifid.' };
    }

    // Thanks
    if (input.includes('bedankt') || input.includes('dank') || input.includes('thanks')) {
      return { type: 'RESPONSE', text: 'Graag gedaan! Fijn dat ik je kon helpen. Heb je nog andere vragen over beleggen bij PIGG?' };
    }

    // Default response - escalate
    return { type: 'ESCALATE', text: '' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-2 right-2 left-2 sm:bottom-4 sm:right-4 sm:left-auto z-50 max-w-md sm:max-w-none">
      <div className="bg-[#1A1B1F] border border-gray-800 rounded-2xl shadow-2xl w-full sm:w-96 h-[500px] sm:h-[600px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#28EBCF] to-[#20D4BA] p-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {!showArchive ? (
              <>
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#28EBCF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white">Daan - PIGG Assistent</h3>
                  <p className="text-xs text-white/80">Online nu</p>
                </div>
              </>
            ) : (
              <div>
                <h3 className="font-bold text-white">Gesprekken Archief</h3>
                <p className="text-xs text-white/80">{archivedConversations.length} gesprekken</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {!showArchive && messages.length > 1 && (
              <button
                onClick={archiveConversation}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                title="Nieuw gesprek starten"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setShowArchive(!showArchive)}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              title={showArchive ? "Terug naar chat" : "Bekijk archief"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showArchive ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                )}
              </svg>
            </button>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Archive View */}
        {showArchive ? (
          <div className="flex-1 overflow-y-auto p-4 bg-[#0F1014]">
            {archivedConversations.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <p>Nog geen gearchiveerde gesprekken</p>
              </div>
            ) : (
              <div className="space-y-3">
                {archivedConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => loadArchivedConversation(conv)}
                    className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-750 transition-colors border border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">
                          {conv.messages[1]?.text.substring(0, 50)}...
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {conv.messages.length} berichten
                        </p>
                      </div>
                      {conv.needsHumanReview && (
                        <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded">
                          Needs review
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(conv.closedAt).toLocaleDateString('nl-NL', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0F1014]">
              {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.sender === 'user'
                    ? 'bg-[#28EBCF] text-gray-900'
                    : 'bg-gray-800 text-white'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs mt-1 opacity-60">
                  {message.timestamp.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-white rounded-2xl px-4 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Form */}
          {showContactForm && (
            <div className="bg-gray-800/50 rounded-2xl p-4 border border-[#28EBCF]/30">
              <form onSubmit={handleContactFormSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Naam *</label>
                  <input
                    type="text"
                    required
                    value={contactFormData.name}
                    onChange={(e) => setContactFormData({...contactFormData, name: e.target.value})}
                    className="w-full bg-[#0F1014] text-white border border-gray-700 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-[#28EBCF]"
                    placeholder="Je naam"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">E-mailadres *</label>
                  <input
                    type="email"
                    required
                    value={contactFormData.email}
                    onChange={(e) => setContactFormData({...contactFormData, email: e.target.value})}
                    className="w-full bg-[#0F1014] text-white border border-gray-700 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-[#28EBCF]"
                    placeholder="je@email.nl"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Telefoonnummer (optioneel)</label>
                  <input
                    type="tel"
                    value={contactFormData.phone}
                    onChange={(e) => setContactFormData({...contactFormData, phone: e.target.value})}
                    className="w-full bg-[#0F1014] text-white border border-gray-700 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-[#28EBCF]"
                    placeholder="06 12345678"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#28EBCF] text-gray-900 font-semibold rounded-lg py-2 text-sm hover:bg-[#20D4BA] transition-colors"
                >
                  Verstuur
                </button>
              </form>
            </div>
          )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-[#1A1B1F] border-t border-gray-800">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Typ je bericht..."
                  className="flex-1 bg-[#0F1014] text-white border border-gray-700 rounded-full px-4 py-2 text-base focus:outline-none focus:border-[#28EBCF] transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="bg-[#28EBCF] text-gray-900 rounded-full p-2 hover:bg-[#20D4BA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
