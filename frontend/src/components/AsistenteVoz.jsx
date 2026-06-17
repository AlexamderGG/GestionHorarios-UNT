import React, { useState, useRef, useEffect } from 'react';
import { 
  MoreHorizontal, Paperclip, Mic, Send, Plus, 
  MessageSquare, User, Calendar, Search, X, MicOff
} from 'lucide-react';
import api from '../services/api'; 

const AsistenteVoz = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Referencia para la API de reconocimiento de voz
  const recognitionRef = useRef(null);

  // Auto-scroll al fondo
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages, isOpen, inputValue]);

  // Inicializar la API de voz del navegador al cargar el componente
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Se detiene al terminar de hablar
      recognition.lang = 'es-PE'; // Español de Perú (ajusta si deseas)
      recognition.interimResults = true; // Muestra el texto mientras hablas

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInputValue(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.error("Error de reconocimiento de voz:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false); // Apaga la animación al dejar de hablar
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || loading) return;

    // Si estaba grabando y el usuario presiona Enter, detenemos el micro
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    const userMessage = inputValue;
    const newMessages = [...messages, { sender: 'user', text: userMessage }];
    setMessages(newMessages);
    setInputValue('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot/preguntar', { pregunta: userMessage });
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: res.data.respuesta || res.data }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Lo siento, tuve un problema al conectar con el servidor. Por favor, reintenta.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Función Real de Dictado por Voz
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Tu navegador no soporta dictado por voz. Intenta usar Chrome o Edge.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setInputValue(''); // Limpiamos el input para el nuevo dictado
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  return (
    <>
      {/* ================= BOTÓN FLOTANTE PERMANENTE ================= */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 bg-primary-600 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:bg-primary-700 hover:scale-110 transition-all duration-300 flex items-center justify-center ${
          isOpen ? 'rotate-90 bg-slate-700 hover:bg-slate-800' : ''
        }`}
        title="Asistente Virtual UNT"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* ================= CONTENEDOR DEL CHAT POPUP ================= */}
      {isOpen && (
        /* CAMBIO DE DISEÑO: bg-slate-50 y shadow exagerada para que destaque en fondo blanco */
        <div className="fixed bottom-24 right-6 z-50 w-[92vw] sm:w-[440px] h-[600px] flex bg-slate-50 dark:bg-neutral-950 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.15)] ring-1 ring-slate-200 dark:ring-neutral-800 overflow-hidden animate-scale-up">
          
          <div className="flex-1 flex flex-col overflow-hidden relative">
            
            {/* Header del Chat */}
            <div className="flex items-center justify-between px-5 py-4 bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces" 
                    alt="Andrea" 
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-neutral-700"
                  />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-neutral-900 rounded-full"></div>
                </div>
                <div>
                  <h1 className="text-sm font-bold text-slate-800 dark:text-white">Andrea (Secretaria Virtual)</h1>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setMessages([])} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 rounded-lg transition-colors" title="Reiniciar conversación">
                  <Plus className="w-5 h-5" />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 rounded-lg transition-colors sm:hidden">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Cuerpo del Chat */}
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50 dark:bg-neutral-900/40">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col justify-center animate-fade-in text-slate-900 dark:text-white">
                  <h2 className="text-xl font-extrabold mb-1">Bienvenido al Asistente Virtual UNT.</h2>
                  <p className="text-sm text-slate-600 dark:text-neutral-400 mb-6 leading-relaxed">
                    Hola, soy Andrea. Soy tu asistente virtual para horarios y laboratorios de Ingeniería de Sistemas. ¿En qué te puedo ayudar hoy?
                  </p>
                  
                  <div className="space-y-3">
                    {/* Botones de sugerencia con fondo blanco puro para hacer contraste con el bg-slate-50 */}
                    <button onClick={() => setInputValue("¿Qué laboratorios están libres hoy?")} className="w-full flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-primary-400 rounded-xl text-left text-xs font-semibold shadow-sm hover:shadow-md transition-all group">
                      <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform"><User className="w-4 h-4" /></div>
                      <span className="text-slate-700 dark:text-neutral-200">Consultar Laboratorios Libres</span>
                    </button>
                    <button onClick={() => setInputValue("¿Cuál es el horario del docente Gomez?")} className="w-full flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-primary-400 rounded-xl text-left text-xs font-semibold shadow-sm hover:shadow-md transition-all group">
                      <div className="w-8 h-8 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform"><Calendar className="w-4 h-4" /></div>
                      <span className="text-slate-700 dark:text-neutral-200">Ver Horarios Profesores</span>
                    </button>
                    <button onClick={() => setInputValue("Busca los cursos del Ciclo 4")} className="w-full flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-primary-400 rounded-xl text-left text-xs font-semibold shadow-sm hover:shadow-md transition-all group">
                      <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform"><Search className="w-4 h-4" /></div>
                      <span className="text-slate-700 dark:text-neutral-200">Buscar Cursos por Ciclo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="flex-shrink-0">
                        {msg.sender === 'bot' ? (
                          <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces" alt="Andrea" className="w-8 h-8 rounded-full object-cover shadow-sm" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300 flex items-center justify-center text-xs font-bold">U</div>
                        )}
                      </div>
                      <div className={`p-3.5 rounded-2xl max-w-[82%] text-sm leading-relaxed shadow-sm ${
                        msg.sender === 'user' 
                          ? 'bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 rounded-tr-none' 
                          : 'bg-blue-100/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-900/30 rounded-tl-none'
                      }`}>
                        {msg.text.split('\n').map((line, i) => (
                          <React.Fragment key={i}>
                            {line}
                            {i !== msg.text.split('\n').length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {loading && (
                    <div className="flex gap-2.5 flex-row">
                      <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces" alt="Andrea" className="w-8 h-8 rounded-full object-cover" />
                      <div className="p-3 bg-blue-100/50 dark:bg-blue-950/20 border border-blue-200 dark:border-transparent rounded-2xl rounded-tl-none flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Footer */}
            <div className="p-4 bg-white dark:bg-neutral-900 border-t border-slate-200 dark:border-neutral-800 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
              <form 
                onSubmit={handleSend}
                className={`flex items-center gap-2 border p-1.5 pl-3.5 rounded-full transition-all ${
                  isRecording 
                  ? 'bg-red-50 border-red-200 shadow-sm' 
                  : 'bg-slate-50 border-slate-200 dark:bg-neutral-800/60 dark:border-neutral-700 focus-within:bg-white dark:focus-within:bg-neutral-900 focus-within:border-slate-300 dark:focus-within:border-neutral-600 focus-within:shadow-sm'
                }`}
              >
                <button type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
                
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={loading}
                  placeholder={isRecording ? "Te escucho..." : "Hacer una consulta..."} 
                  className={`flex-1 bg-transparent outline-none text-sm ${isRecording ? 'text-red-700 font-medium placeholder:text-red-400' : 'text-slate-700 dark:text-neutral-200 placeholder:text-slate-400'}`}
                />
                
                {isRecording && (
                  <div className="flex items-center gap-0.5 px-1">
                    <span className="w-0.5 h-2.5 bg-red-500 rounded-full animate-bounce"></span>
                    <span className="w-0.5 h-4 bg-red-500 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                    <span className="w-0.5 h-2.5 bg-red-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  </div>
                )}

                {/* Botón de Entrada de Voz Real */}
                <button 
                  type="button" 
                  onClick={toggleRecording}
                  className={`p-2 rounded-full transition-all flex items-center justify-center shadow-sm ${
                    isRecording 
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-red-500/30' 
                      : 'bg-slate-700 hover:bg-slate-800 text-white'
                  }`}
                  title={isRecording ? "Detener grabación" : "Dictado por voz"}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
                
                <button 
                  type="submit" 
                  disabled={!inputValue.trim() || loading}
                  className="p-2 text-slate-400 hover:text-primary-600 disabled:opacity-40 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default AsistenteVoz;
