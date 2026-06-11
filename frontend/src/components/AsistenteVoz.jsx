import React, { useState } from 'react';
import { Mic, MicOff, Loader, MessageSquare, Send, X } from 'lucide-react';
import api from '../services/api';

const AsistenteVoz = () => {
  const [escuchando, setEscuchando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [respuestaBot, setRespuestaBot] = useState('');
  
  // Estados para el modo texto
  const [modoTexto, setModoTexto] = useState(false);
  const [preguntaTexto, setPreguntaTexto] = useState('');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  // --- LÓGICA DE ENVÍO (Sirve para voz y para texto) ---
  const enviarPregunta = async (textoPregunta) => {
    setProcesando(true);
    setRespuestaBot('');
    try {
      console.log("⏳ Enviando pregunta al backend:", textoPregunta);
      const res = await api.post('/chatbot/preguntar', { pregunta: textoPregunta });
      
      const respuestaTexto = res.data.respuesta;
      console.log("✅ Respuesta de la IA:", respuestaTexto);
      
      setRespuestaBot(respuestaTexto);

      // Hablar la respuesta solo si hay soporte
      if ('speechSynthesis' in window) {
        const speech = new SpeechSynthesisUtterance(respuestaTexto);
        speech.lang = 'es-PE';
        window.speechSynthesis.speak(speech);
      }
    } catch (error) {
      console.error("❌ Error conectando al backend:", error);
      setRespuestaBot("Lo siento, hubo un error al conectar con el servidor.");
    } finally {
      setProcesando(false);
      setModoTexto(false); // Cierra el input si estaba abierto
    }
  };

  // --- LÓGICA DEL MICRÓFONO ---
  let recognition = null;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'es-PE';
    recognition.continuous = false;

    recognition.onstart = () => setEscuchando(true);
    
    recognition.onresult = (event) => {
      const transcripcion = event.results[0][0].transcript;
      console.log("🗣️ Has dicho:", transcripcion);
      setEscuchando(false);
      enviarPregunta(transcripcion); // Enviamos lo escuchado
    };

    recognition.onerror = (event) => {
      console.error("⚠️ Error del micrófono:", event.error);
      setEscuchando(false);
      setProcesando(false);
      if(event.error === 'network') {
         setRespuestaBot("Error de red del micrófono. Por favor, intenta usar el teclado para escribir tu pregunta.");
      }
    };

    recognition.onend = () => setEscuchando(false);
  }

  const toggleMicrofono = () => {
    if (!SpeechRecognition) {
      setRespuestaBot("Tu navegador no soporta voz. Usa el botón de teclado.");
      return;
    }
    if (escuchando) recognition.stop();
    else recognition.start();
  };

  const handleEnviarTexto = (e) => {
    e.preventDefault();
    if (preguntaTexto.trim() === '') return;
    enviarPregunta(preguntaTexto);
    setPreguntaTexto('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end mb-16 lg:mb-0">
      
      {/* CUADRO DE DIÁLOGO / RESPUESTA */}
      {respuestaBot && !modoTexto && (
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-xl mb-3 max-w-sm border border-primary-200 dark:border-primary-900 animate-slide-down relative">
          <button 
            onClick={() => setRespuestaBot('')} 
            className="absolute top-1 right-1 p-1 text-neutral-400 hover:text-neutral-600"
          >
            <X className="w-4 h-4" />
          </button>
          <p className="text-sm text-neutral-700 dark:text-neutral-300 pr-4">{respuestaBot}</p>
        </div>
      )}

      {/* INPUT DE TEXTO MANUAL */}
      {modoTexto && (
        <form onSubmit={handleEnviarTexto} className="bg-white dark:bg-neutral-800 p-2 rounded-lg shadow-xl mb-3 w-72 border border-neutral-200 dark:border-neutral-700 flex animate-slide-down">
          <input
            type="text"
            autoFocus
            value={preguntaTexto}
            onChange={(e) => setPreguntaTexto(e.target.value)}
            placeholder="Pregúntale al sistema..."
            className="flex-1 bg-transparent border-none text-sm px-2 outline-none text-neutral-800 dark:text-white"
          />
          <button type="submit" disabled={procesando} className="p-2 text-primary-600 hover:bg-primary-50 rounded-md disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* BOTONES FLOTANTES */}
      <div className="flex items-center gap-2">
        {/* Botón de Teclado */}
        <button 
          onClick={() => { setModoTexto(!modoTexto); setRespuestaBot(''); }}
          className="p-3 rounded-full shadow-lg bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-primary-600 border border-neutral-200 dark:border-neutral-700 transition-all"
          title="Escribir pregunta"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Botón de Micrófono */}
        <button 
          onClick={toggleMicrofono}
          className={`p-4 rounded-full shadow-lg text-white transition-all ${
            escuchando ? 'bg-red-500 animate-pulse scale-110' : 
            procesando ? 'bg-amber-500' : 'bg-primary-600 hover:bg-primary-700'
          }`}
          title="Hablar por micrófono"
        >
          {procesando ? <Loader className="w-6 h-6 animate-spin" /> : 
           escuchando ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
      </div>

    </div>
  );
};

export default AsistenteVoz;