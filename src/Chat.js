import React, { useState, useRef, useEffect } from 'react';

const Chat = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Hallo! Waarmee kan ik je helpen?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: getBotResponse(inputMessage),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const getBotResponse = (userInput) => {
    const input = userInput.toLowerCase();

    // Simple keyword-based responses
    if (input.includes('help') || input.includes('hulp')) {
      return 'Ik kan je helpen met vragen over ETFs, portfolios, beleggen en je account. Wat wil je weten?';
    } else if (input.includes('etf')) {
      return 'ETFs zijn beleggingsfondsen die verhandeld worden zoals aandelen. Je kunt onze ETF database bekijken om meer te leren over beschikbare ETFs.';
    } else if (input.includes('portfolio')) {
      return 'Je kunt een portfolio samenstellen door naar de Portfolio Builder te gaan. Daar kun je ETFs selecteren en je gewenste allocatie instellen.';
    } else if (input.includes('risico') || input.includes('risk')) {
      return 'Beleggen brengt risico\'s met zich mee. De waarde van je investering kan dalen of stijgen. Raadpleeg altijd onze risico-informatie voordat je belegt.';
    } else if (input.includes('kosten') || input.includes('cost') || input.includes('ter')) {
      return 'De kosten van ETFs worden uitgedrukt in de TER (Total Expense Ratio). Dit varieert per ETF, meestal tussen 0.07% en 0.50% per jaar.';
    } else if (input.includes('contact')) {
      return 'Je kunt contact met ons opnemen via de Contact pagina in de footer, of bel ons tijdens kantooruren.';
    } else if (input.includes('hoi') || input.includes('hallo') || input.includes('hey')) {
      return 'Hallo! Fijn dat je er bent. Hoe kan ik je vandaag helpen?';
    } else if (input.includes('bedankt') || input.includes('dank')) {
      return 'Graag gedaan! Is er nog iets anders waarmee ik je kan helpen?';
    } else {
      return 'Bedankt voor je vraag. Voor specifieke vragen kun je contact opnemen met onze klantenservice. Is er iets anders waarmee ik je kan helpen?';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-[#1A1B1F] border border-gray-800 rounded-2xl shadow-2xl w-96 h-[600px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#28EBCF] to-[#20D4BA] p-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#28EBCF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white">Chat Support</h3>
              <p className="text-xs text-white/80">Online nu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

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
              className="flex-1 bg-[#0F1014] text-white border border-gray-700 rounded-full px-4 py-2 focus:outline-none focus:border-[#28EBCF] transition-colors"
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
      </div>
    </div>
  );
};

export default Chat;
